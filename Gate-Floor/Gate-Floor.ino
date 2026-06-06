#include <WiFi.h>
#include <FirebaseESP32.h>
#include <HardwareSerial.h>
#include <WiFiUDP.h>
#include <NTPClient.h>
#include <TimeLib.h>
#include <ctime>
#include <ESP32Servo.h>

// ====== Define ======
#define ALLOWED_FLOOR "2"      // ชั้นที่อนุญาตให้ผ่าน

#define ROLE "floor"
#define WIFI_SSID "testwifi"
#define WIFI_PASSWORD "12345678"




#define TRIG_PIN 5
#define ECHO_PIN 18
#define SERVO_PIN 4
#define LED1_PIN 2   // สีแดง: ไม่ผ่าน
#define LED2_PIN 15  // สีฟ้า: ผ่าน

// ====== Objects ======
FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

HardwareSerial mySerial(2);
Servo myServo;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

// ====== Global variables ======
bool allowed = false;
bool isGateOpenedBySensor = false;

// ====== Helper functions ======
String formatTimeOnly(time_t currentTime) {
  char buffer[10];
  struct tm *timeinfo = localtime(&currentTime);
  strftime(buffer, sizeof(buffer), "%H:%M:%S", timeinfo);
  return String(buffer);
}

String createUniqueKey() {
  time_t currentTime = now();
  return String(currentTime);
}

void resetServo() {
  myServo.write(180);  // ปิดประตู
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  allowed = false;
}
bool isWithinVisitorTimeWindow() {
  int currentHour = hour();
  int currentMinute = minute();
  int totalMinutes = currentHour * 60 + currentMinute;
  int startMinutes = 6 * 60 + 30;   // 6:30
  int endMinutes = 17 * 60 + 30;    // 17:30
  return (totalMinutes >= startMinutes && totalMinutes <= endMinutes);
}
// ฟังก์ชันเช็ค floor ใน employee (เป็น array floor)
bool checkFloorInEmployee(String table, String key, String floor) {
  String path = "/" + table + "/" + key + "/floor";
  Serial.println("Checking floor at path: " + path);

  if (Firebase.get(firebaseData, path)) {
    String floorRaw = firebaseData.stringData();
    Serial.println("Floor raw data: " + floorRaw);

    FirebaseJson json;
    json.setJsonData(floorRaw);

    size_t count = json.iteratorBegin();
    Serial.printf("Number of floor entries: %d\n", count);

    for (size_t i = 0; i < count; i++) {
    FirebaseJson::IteratorValue value = json.valueAt(i);
    String floorValue = value.value;

    floorValue.replace("\"", "");
    floorValue.trim();
    floor.trim();

    Serial.printf("Checking floor: '%s' == '%s'\n", floorValue.c_str(), floor.c_str());

    if (floorValue == floor) {
      json.iteratorEnd();
      Serial.println("Floor match found!");
      return true;
    }
}

    json.iteratorEnd();
  } else {
    Serial.println("Firebase GET failed: " + firebaseData.errorReason());
  }
  return false;
}


bool checkFloorInVisitor(String table, String key, String allowedFloor) {
  String path = "/" + table + "/" + key + "/floor";
  if (Firebase.get(firebaseData, path)) {
    String floorVal = firebaseData.stringData();
    return (floorVal == allowedFloor);
  } else {
    Serial.println("Firebase GET floor failed: " + firebaseData.errorReason());
    return false;
  }
}

// ฟังก์ชันเช็ค userPermits หรือ employee ที่มี code
bool checkUserPermitCodeExists(String table, String key, String code) {
  String path = "/" + table + "/" + key + "/code";
  if (Firebase.get(firebaseData, path)) {
    String firebaseCode = firebaseData.stringData();
    return (firebaseCode == code);
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  mySerial.begin(9600, SERIAL_8N1, 16, 17);

  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  myServo.attach(SERVO_PIN, 500, 2400);
  resetServo();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  timeClient.begin();
  timeClient.update();
  setTime(timeClient.getEpochTime() + 25200);

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Setup complete.");
}

void loop() {
  timeClient.update();
  time_t currentTime = timeClient.getEpochTime() + 25200;
  setTime(currentTime);

  if (mySerial.available()) {
    String qrData = mySerial.readStringUntil('\n');
    qrData.trim();
    Serial.print("Received QR: ");
    Serial.println(qrData);

    int firstComma = qrData.indexOf(',');
    int secondComma = qrData.indexOf(',', firstComma + 1);

    String table = "";
    String key = "";
    String code = "";
    bool validQR = false;

    if (firstComma > 0 && secondComma > firstComma) {
      table = qrData.substring(0, firstComma);
      key = qrData.substring(firstComma + 1, secondComma);
      code = qrData.substring(secondComma + 1);
      validQR = true;
    } else if (firstComma > 0) {
      table = qrData.substring(0, firstComma);
      key = qrData.substring(firstComma + 1);
      validQR = true;
    }

    if (!validQR) {
      Serial.println("⚠️ Invalid QR format");
      digitalWrite(LED1_PIN, HIGH);
      delay(1000);
      digitalWrite(LED1_PIN, LOW);
      resetServo();
      return;
    }

    Serial.printf("Table: %s, Key: %s, Code: %s\n", table.c_str(), key.c_str(), code.c_str());

    allowed = false;

    if (table == "visitorRegisters" || table == "previsitorRegisters"  && isWithinVisitorTimeWindow() && checkFloorInVisitor(table, key, ALLOWED_FLOOR)) {
      String path = "/" + table + "/" + key;
       if (Firebase.getJSON(firebaseData, path)) {
                  FirebaseJson &json = firebaseData.jsonObject();
                  FirebaseJsonData jsonData;
                  bool isActive = false;
                      if (json.get(jsonData, "active")) {
                      isActive = (jsonData.stringValue == "true");
                    }
                     bool isToday = false;
                      if (json.get(jsonData, "date")) {
                        String firebaseDate = jsonData.stringValue;  // รูปแบบน่าจะ "dd/mm/yyyy"
                        
                        // สร้างวันที่วันนี้
                        time_t t = now();
                        struct tm *timeinfo = localtime(&t);
                        char todayDate[11];
                        snprintf(todayDate, sizeof(todayDate), "%d/%d/%04d", timeinfo->tm_mday, timeinfo->tm_mon + 1, 1900 + timeinfo->tm_year);

                        if (firebaseDate == String(todayDate)) {
                          isToday = true;
                        } else {
                          Serial.printf("❌ Visitor date mismatch: expected %s but got %s\n", todayDate, firebaseDate.c_str());
                        }
                      
                    if (isActive && isToday) {
                      allowed = true;
                      code = "";
                    } else {
                      allowed = false;
                      if (!isActive) Serial.println("Visitor not active");
                      if (!isToday) Serial.println("Visitor date is not today");
             }
        } else {
          Serial.println("Key 'active' not found");
        }
      } else {
        Serial.println("Firebase GET failed: " + firebaseData.errorReason());
      }
    } else if (table == "employees") {
      if (checkUserPermitCodeExists(table, key, code)) {
        if (checkFloorInEmployee(table, key, ALLOWED_FLOOR)) {
          Serial.println("✅ Employee/UserPermit access allowed.");
          allowed = true;
        } else {
          Serial.println("Employee floor not allowed");
        }
      } else {
        Serial.println("❌ Employee access denied - Code mismatch or key not found.");
      }
    }
    else if(table == "userPermits" ){
      if (checkUserPermitCodeExists(table, key, code)) {
           Serial.println("✅ UserPermit access allowed (all floors).");
           allowed = true;
      } else {
        Serial.println("❌ UserPermit access denied - Code mismatch or key not found.");
      }
    } else {
      Serial.println("⚠️ Unknown table.");
    }

    if (allowed) {
      Serial.println("✅ Access Granted");
      myServo.write(90);
      digitalWrite(LED2_PIN, HIGH);

      String uniqueKey = createUniqueKey();
      String scanTimeStr = formatTimeOnly(now());

      String name = "";
      String namePath = "/" + table + "/" + key + "/name";

      if (Firebase.get(firebaseData, namePath)) {
        name = firebaseData.stringData();
      }

      time_t t = now();
      struct tm *timeinfo = localtime(&t);
      char dateStr[11];
      snprintf(dateStr, sizeof(dateStr), "%d/%d/%04d", timeinfo->tm_mday, timeinfo->tm_mon + 1, 1900 + timeinfo->tm_year);

      Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/name", name);
      Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/date", String(dateStr));
      Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/gate", ROLE);
      Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/scanTime", scanTimeStr);
      Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/type", table);
      Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/floor", ALLOWED_FLOOR);
    } else {
      Serial.println("❌ Access Denied");
      digitalWrite(LED1_PIN, HIGH);
      delay(1000);
      digitalWrite(LED1_PIN, LOW);
      resetServo();
    }
  }

  long duration;
  float distance;

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  duration = pulseIn(ECHO_PIN, HIGH, 30000);
  distance = duration * 0.0343 / 2.0;
  unsigned long nowMillis = millis();
  Serial.print("📏 Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (allowed && distance < 10 && isGateOpenedBySensor) {
  Serial.println("🚶 Detected passing through (ACCESS). Closing gate.");
  delay(1000);
  resetServo();

}

if (!allowed && distance < 10 && !isGateOpenedBySensor) {
  Serial.println("🚶 Detected passing through (EXIT). Opening gate.");
  isGateOpenedBySensor = true;
  myServo.write(90);
  digitalWrite(LED2_PIN, HIGH);
  delay(2000);  // ให้เวลาเดินออก
  resetServo();
}



if (distance >= 20 && isGateOpenedBySensor) {
  isGateOpenedBySensor = false;
}

  delay(100);
}


