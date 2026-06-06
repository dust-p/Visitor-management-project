#include <WiFi.h>
#include <FirebaseESP32.h>
#include <HardwareSerial.h>
#include <WiFiUDP.h>
#include <NTPClient.h>
#include <TimeLib.h>
#include <ctime>
#include <ESP32Servo.h>

// ====== Define ======
#define ROLE "in"   // ประตูเข้า
String Nogate = "1";

#define WIFI_SSID "testwifi"
#define WIFI_PASSWORD "12345678"



#define TRIG_PIN 5
#define ECHO_PIN 18
#define SERVO_PIN 4
#define LED1_PIN 2   // สีแดง: ไม่ผ่าน
#define LED2_PIN 15  // สีฟ้า: ผ่าน

// ====== Object ======
FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

HardwareSerial mySerial(2);
Servo myServo;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

// ====== Global Variable ======
bool allowed= false;  // บอกว่าผ่านหรือไม่
String table;
String key;
String code;

// ====== Functions ======
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
  int startMinutes = 8 * 60 + 30;   // 8:30
  int endMinutes = 17 * 60 + 30;    // 17:30
  return (totalMinutes >= startMinutes && totalMinutes <= endMinutes);
}


bool checkUserPermitCodeExists(String table, String key, String code) {
  table.trim();
  code.trim();
  key.trim();
  String path = "/" + table + "/" + key + "/code";
  if (Firebase.get(firebaseData, path)) {
    String firebaseCode = firebaseData.stringData();
    if (firebaseCode == code) {
      return true;
    }
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
  setTime(timeClient.getEpochTime() + 25200);  // ไทย +7 ชั่วโมง

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Setup complete.");
}

void loop() {
  timeClient.update();
  time_t currentTime = timeClient.getEpochTime() + 25200;  // ไทย +7 ชม
  setTime(currentTime);

  if (mySerial.available()) {
    String qrData = mySerial.readStringUntil('\n');
    qrData.trim();
    Serial.print("Received QR: ");
    Serial.println(qrData);

    // ตรวจสอบ format ของ QR code ว่าเป็นแบบมี 1 comma หรือ 2 commas
    int firstComma = qrData.indexOf(',');
    int secondComma = qrData.indexOf(',', firstComma + 1);

    String table = "";
    String key = "";
    String code = "";
    bool validQR = false;

    if (firstComma > 0 && secondComma > firstComma) {
      // รูปแบบ table,key,code (userPermits, employee)
      table = qrData.substring(0, firstComma);
      key = qrData.substring(firstComma + 1, secondComma);
      code = qrData.substring(secondComma + 1);
      validQR = true;
    } else if (firstComma > 0) {
      // รูปแบบ table,key (visitorRegisters, previsitorRegisters)
      table = qrData.substring(0, firstComma);
      key = qrData.substring(firstComma + 1);
      validQR = true;
    } else {
      validQR = false;
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

            if (table == "visitorRegisters" || table == "previsitorRegisters" && isWithinVisitorTimeWindow()) {
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
                      }
                    if (isActive && isToday) {
                      allowed = true;
                      code = "";
                    } else {
                      allowed = false;
                      if (!isActive) Serial.println("Visitor not active");
                      if (!isToday) Serial.println("Visitor date is not today");
                    }
                  }          
                 else {
                  Serial.println("Firebase GET failed:");
                  Serial.println(firebaseData.errorReason());       
            }
  } else if (table == "userPermits" || table == "employees") {
      // ตรวจสอบ code ใน userPermits หรือ employee
      if (checkUserPermitCodeExists(table, key, code)) {
        Serial.println("✅ Employee/UserPermit access allowed.");
        allowed = true;
      } else {
        Serial.println("❌ Employee/UserPermit access denied - Code mismatch or key not found.");
        allowed = false;
      }
    } else {
      Serial.println("⚠️ Unknown table.");
      allowed = false;
    }

    if (allowed) {
  Serial.println("✅ Access Granted");
  allowed = true;
  myServo.write(90);
  digitalWrite(LED2_PIN, HIGH);  // ไฟฟ้า

  String uniqueKey = createUniqueKey();
  String scanTimeStr = formatTimeOnly(now());

  // ดึงชื่อจาก firebase ตาม table และ key
  String name = "";

  String namePath = "/" + table + "/" + key + "/name";
  if (Firebase.get(firebaseData, namePath)) {
    name = firebaseData.stringData();
  }
  // วันที่เป็น dd/mm/yyyy
  time_t t = now();
  struct tm *timeinfo = localtime(&t);
  char dateStr[11];
  snprintf(dateStr, sizeof(dateStr), "%d/%d/%04d", timeinfo->tm_mday, timeinfo->tm_mon + 1, 1900 + timeinfo->tm_year);

  Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/name", name);
  Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/date", String(dateStr));
  Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/gate", ROLE);
  Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/Nogate", Nogate);
  Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/scanTime", scanTimeStr);
  Firebase.setString(firebaseData, "/logs/" + uniqueKey + "/category", table);

    } else {
       Serial.println(key);
      Serial.println("❌ Access Denied");
      allowed = false;
      digitalWrite(LED1_PIN, HIGH);  // ไฟแดง
      delay(1000);
      digitalWrite(LED1_PIN, LOW);
      resetServo();
    }
  }        

  // Ultrasonic sensor measure distance
  long duration;
  float distance;

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  duration = pulseIn(ECHO_PIN, HIGH);
  distance = duration * 0.0343 / 2.0;

  Serial.print("📏 Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  // ถ้ามีคนเดินผ่าน (เข้าใกล้ < 10cm) และประตูเปิดอยู่
  if (allowed && distance < 10) {
    Serial.println("🚶 Detected passing through. Closing gate.");
    delay(1000);
    resetServo();
  }
  delay(100);
  

}


