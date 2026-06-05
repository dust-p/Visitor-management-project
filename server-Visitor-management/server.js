const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const {
  getDatabase,
  ref,
  set,
  push,
  get,
  update,
  remove,
} = require("firebase-admin/database");

// Setup Firebase Admin SDK
const serviceAccount = require("./firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://visitor-management-syste-24342-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

const auth = getAuth();
const db = getDatabase();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

function sanitizeFirebaseKey(key) {
    return key.replace(/[.#$\[\]]/g, '_');
  }
// Login Route
app.post("/login", async (req, res) => {
  const { idToken } = req.body;
  console.log("Received ID Token:", idToken);

  try {
    // ตรวจสอบ ID token
    const decodedToken = await auth.verifyIdToken(idToken); // Use auth here
    console.log("Decoded Token:", decodedToken);

    const email = decodedToken.email;

    // ดึงข้อมูลผู้ใช้จาก Realtime Database
    const userRef = db.ref("users").orderByChild("email").equalTo(email);
    const snapshot = await userRef.once("value");

    if (!snapshot.exists()) {
      console.log("No user found for email:", email);
      return res.status(401).send({ error: "Invalid email" });
    }

    const userData = snapshot.val();
    const userId = Object.keys(userData)[0];
    const userRole = userData[userId].role;
    const userCompany = userData[userId].company || null;

    res.status(200).send({ email: email, role: userRole, company: userCompany });
  } catch (error) {
    console.error("Error verifying token or fetching user:", error);
    res.status(401).send({ error: "Invalid token or user does not exist." });
  }
});

// เส้นทางสำหรับลงทะเบียนผู้ใช้
app.post("/register", async (req, res) => {
  const { email, password, role ,company } = req.body;
  try {
    const userRecord = await auth.createUser({ email, password });
    const userRef = db.ref(`users/${userRecord.uid}`);
    await userRef.set({ email, role ,company: company || null });
    res.status(201).send({ uid: userRecord.uid, role , company: company || null});
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// เส้นทางสำหรับลบผู้ใช้
app.delete("/users/:uid", async (req, res) => {
  const { uid } = req.params;
  try {
    await auth.deleteUser(uid).remove();
    await db.ref(`users/${uid}`).remove();
    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// เส้นทางสำหรับอัปเดตผู้ใช้
app.put("/users/:uid", async (req, res) => {
  const { uid } = req.params;
  const { password, role, company } = req.body;
  try {
    await db.ref(`users/${uid}`).update({ role });
    if (password) {
      await auth.updateUser(uid, { password });
    }
    res.status(200).send({ message: "User updated successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const usersRef = db.ref("users");
    const snapshot = await usersRef.once("value");
    if (snapshot.exists()) {
      res.status(200).send(snapshot.val());
    } else {
      res.status(404).send({ error: "No users found" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// 📌 ดึงรายชื่อบริษัท
app.get("/users/companies", async (req, res) => {
  try {
    const ref = db.ref("contactOptions/floors");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No companies found" });
    }

    const companies = [];
    snapshot.forEach((floor) => {
      floor.forEach((company) => {
        const companyData = company.val();
        if (companyData.name && companyData.name.trim() !== "") {
          companies.push({
            id: company.key, // ใช้คีย์เป็น ID
            name: companyData.name,
          });
        }
      });
    });

    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/register/companies", async (req, res) => {
  try {
    const ref = db.ref("contactOptions/floors");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No companies found" });
    }

    const companies = [];
    snapshot.forEach((floor) => {
      floor.forEach((company) => {
        const companyData = company.val();
        if (companyData.name && companyData.name.trim() !== "") {
          companies.push({
            id: company.key, // ใช้คีย์เป็น ID
            name: companyData.name,
          });
        }
      });
    });

    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 📌 ดึงข้อมูล floor ตาม company ที่เลือก
app.get("/register/companies/:companyId/floor", async (req, res) => {
  const { companyId } = req.params;
  try {
    const ref = db.ref("contactOptions/floors");
    const snapshot = await ref.once("value");

    let companyFloor = null;
    snapshot.forEach((floor) => {
      floor.forEach((company) => {
        if (company.key === companyId) {
          companyFloor = {
            floorName: floor.key,
            companyName: company.val().name,
          };
        }
      });
    });

    if (!companyFloor) {
      return res
        .status(404)
        .json({ message: "Floor not found for the selected company" });
    }

    res.json(companyFloor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 ดึงแผนกของบริษัท
app.get("/register/departments/:companyId", async (req, res) => {
  const { companyId } = req.params;

  try {
    const ref = db.ref("contactOptions/floors");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No departments found" });
    }

    let departments = [];
    snapshot.forEach((floor) => {
      floor.forEach((comp) => {
        if (comp.key === companyId) {
          const companyData = comp.val();
          if (companyData.departments) {
            departments = Object.keys(companyData.departments);
          }
        }
      });
    });

    if (departments.length === 0) {
      return res
        .status(404)
        .json({ message: "No departments found for this company" });
    }

    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 ดึงรายชื่อผู้ติดต่อ
app.get("/register/contacts/:companyId/:departmentId", async (req, res) => {
  const { companyId, departmentId } = req.params;

  try {
    const ref = db.ref("contactOptions/floors");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No contacts found" });
    }

    let contacts = [];
    snapshot.forEach((floor) => {
      floor.forEach((comp) => {
        if (comp.key === companyId) {
          const companyData = comp.val();
          if (
            companyData.departments &&
            companyData.departments[departmentId]
          ) {
            const departmentData = companyData.departments[departmentId];
            if (departmentData.contacts) {
              contacts = Object.keys(departmentData.contacts);
            }
          }
        }
      });
    });

    if (contacts.length === 0) {
      return res
        .status(404)
        .json({ message: "No contacts found for this department" });
    }

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 ดึงเหตุผลในการเข้าพบ
// ดึงข้อมูล Reasons
app.get("/register/reasons", async (req, res) => {
  try {
    const ref = db.ref("contactOptions/reasons");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No reasons found" });
    }

    const reasons = Object.entries(snapshot.val() || {}).map(([id, data]) => ({
      id,
      ...data,
    }));

    res.json(reasons);
  } catch (error) {
    console.error("Error fetching reasons:", error);
    res.status(500).json({ error: error.message });
  }
});

// แก้ไข Reason
app.post("/register/update-reason/:id", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await db.ref(`contactOptions/reasons/${id}`).update({ reason });
    res.json({ message: "Reason updated successfully" });
  } catch (error) {
    console.error("Error updating reason:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// 📌 ลบ Reason
app.delete("/register/delete-reason/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.ref(`contactOptions/reasons/${id}`).remove();
    res.json({ message: "Reason deleted successfully" });
  } catch (error) {
    console.error("Error deleting reason:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 บันทึกเหตุผลในการเข้าพบ (เปลี่ยน Endpoint )
app.post("/register/save-reason", async (req, res) => {
  const { reason } = req.body;

  try {
    const newRef = db.ref("contactOptions/reasons").push(); // สร้าง id อัตโนมัติ
    await newRef.set({ reason }); // บันทึกค่าลง Firebase
    res.json({ message: "Reason saved successfully" });
  } catch (error) {
    console.error("Error saving reason:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// 📌 ลงทะเบียนผู้เยี่ยมชมใหม่
app.post("/register/visitors/register", async (req, res) => {
  try {
    const { name, company, department, contact, reason, note, floor, email ,date} =
      req.body;

    const registerRef = db.ref("visitorRegisters").push();
    const currentTime = new Date(date);
    currentTime.setHours(inputDate.getHours() + 7);
    const formattedTime = `${currentTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${currentTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${currentTime
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
    const formattedDate = `${currentTime.getDate()}/${
      currentTime.getMonth() + 1
    }/${currentTime.getFullYear()}`;

    const newVisitor = {
      name,
      company,
      department,
      contact,
      reason,
      note,
      date: formattedDate,
      time: formattedTime,
      floor,
      email,
    };

    await registerRef.set(newVisitor);
    res.json({
      success: true,
      message: "Registration Successful!",
      visitor: newVisitor,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 ลบผู้เยี่ยมชม
app.delete("/register/visitors/:visitorId", async (req, res) => {
  const { visitorId } = req.params;
  try {
    await db.ref(`visitorRegisters/${visitorId}`).remove();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 ดึงข้อมูลผู้เยี่ยมชมวันนี้
app.get("/register/visitors/today", async (req, res) => {
  try {
    const snapshot = await db.ref("visitorRegisters").once("value");
    const visitorsData = snapshot.val();
    const rawDate = req.query.date;
    const inputDate = rawDate ? new Date(rawDate) : new Date();
    inputDate.setHours(inputDate.getHours() + 7);
    const formattedDate = `${inputDate.getDate()}/${inputDate.getMonth() + 1}/${inputDate.getFullYear()}`;

    const todayVisitors = visitorsData
      ? Object.entries(visitorsData)
          .map(([id, visitor]) => ({ id, ...visitor }))
          .filter((visitor) => visitor.date === formattedDate)
      : [];

    res.json(todayVisitors.reverse()); // เรียงจากใหม่ไปเก่า
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// 📌 ดึงข้อมูลผู้เยี่ยมชมที่ลงทะเบียนล่วงหน้า
app.get("/register/previsitors/today", async (req, res) => {
  try {
    const snapshot = await db.ref("previsitorRegisters").once("value");
    const previsitorsData = snapshot.val();
    const rawDate = req.query.date;
    const inputDate = rawDate ? new Date(rawDate) : new Date();
    inputDate.setHours(inputDate.getHours() + 7);
    const formattedDate = `${inputDate.getDate()}/${inputDate.getMonth() + 1}/${inputDate.getFullYear()}`;

    const previsitors = previsitorsData
      ? Object.entries(previsitorsData)
          .map(([id, visitor]) => ({ id, ...visitor }))
          .filter((visitor) => visitor.date === formattedDate)
      : [];

    res.json(previsitors.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 ลบข้อมูลการลงทะเบียนล่วงหน้า
app.delete("/register/previsitors/:previsitorId", async (req, res) => {
  const { previsitorId } = req.params;
  try {
    await db.ref(`previsitorRegisters/${previsitorId}`).remove();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ดึงข้อมูล Floors
app.get("/management/floors", async (req, res) => {
  try {
    const ref = db.ref("contactOptions/floors");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No floors found" });
    }

    const floors = [];
    snapshot.forEach((floor) => {
      const data = floor.val();
      if (floor.key !== "name") { 
        floors.push({
          id: floor.key,       
          name: data.name || "" 
        });
      }
    });

    res.json(floors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ดึงข้อมูล Companies
app.get("/management/companies", async (req, res) => {
  const { floor } = req.query;

  if (!floor) {
    return res.status(400).json({ message: "Floor is required" });
  }

  try {
    const ref = db.ref(`contactOptions/floors/${floor}`);
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res
        .status(404)
        .json({ message: "No companies found on this floor" });
    }

    const companies = [];
    snapshot.forEach((company) => {
      const companyData = company.val();
      if (companyData.name && companyData.name.trim() !== "") {
        companies.push({
          id: company.key,
          name: companyData.name,
          floor: floor,
        });
      }
    });

    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ดึงข้อมูล Reasons
app.get("/reasons", async (req, res) => {
  try {
    const ref = db.ref("contactOptions/reasons");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No reasons found" });
    }

    const reasons = Object.entries(snapshot.val() || {}).map(([id, data]) => ({
      id,
      ...data,
    }));

    res.json(reasons);
  } catch (error) {
    console.error("Error fetching reasons:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/save-company', async (req, res) => {
    const { floor, company, departments } = req.body;
  
    try {
      const floorRef = db.ref(`contactOptions/floors/${floor}`);
      await floorRef.child('name').set(floor);  // บันทึกชื่อชั้น (เช่น "1", "2")
  
      const companyKey = sanitizeKey(company);
      const companyRef = floorRef.child(companyKey);
      await companyRef.child('name').set(company); // บันทึกชื่อบริษัท
  
      // ดึงข้อมูลแผนกและคอนแทคที่มีอยู่
      const existingDepartmentsSnapshot = await companyRef.child('departments').once('value');
      const existingDepartments = existingDepartmentsSnapshot.val() || {};
  
      // ลบแผนกที่ไม่ได้อยู่ในคำขอใหม่
      for (const deptKey in existingDepartments) {
        if (!departments.some(dept => sanitizeKey(dept.name) === deptKey)) {
          await companyRef.child(`departments/${deptKey}`).remove();
        }
      }
  
      // เพิ่มหรือลบแผนกใหม่ตามคำขอ
      for (const dept of departments) {
        const deptKey = sanitizeKey(dept.name);
        const deptRef = companyRef.child(`departments/${deptKey}`);
        await deptRef.child('name').set(dept.name); // บันทึกชื่อแผนก
  
        // ดึงข้อมูลคอนแทคที่มีอยู่
        const existingContactsSnapshot = await deptRef.child('contacts').once('value');
        const existingContacts = existingContactsSnapshot.val() || {};
  
        // ลบคอนแทคที่ไม่ได้อยู่ในคำขอใหม่
        for (const contactKey in existingContacts) {
          const contactName = existingContacts[contactKey]?.name;
          if (!dept.contacts.some(contact => sanitizeKey(contact.name) === contactKey)) {
            await deptRef.child(`contacts/${contactKey}`).remove();
          }
        }
  
        // เพิ่มหรือลบคอนแทคใหม่ตามคำขอ
        for (const contact of dept.contacts) {
          const contactName = contact?.name || 'unnamed';
          const contactKey = sanitizeKey(contactName);
          const contactRef = deptRef.child(`contacts/${contactKey}`);
          await contactRef.child('name').set(contactName); // บันทึก Contact
        }
      }
  
      res.status(200).send('Company data saved successfully');
    } catch (error) {
      console.error('Error saving company:', error);
      res.status(500).send('Error saving company: ' + error.message);
    }
  });
  
  function sanitizeKey(key) {
    return key.replace(/[.#$/\[\]]/g, '_'); // Firebase ห้ามใช้ตัวอักษรพวกนี้ใน path
  }
  
  
  
  
  
  app.get('/api/companies', async (req, res) => {
    try {
      const companiesRef = db.ref('contactOptions/floors');
      const snapshot = await companiesRef.once('value');
      const data = snapshot.val();
  
      if (!data) {
        return res.status(404).send('No data found');
      }
  
      // แปลงข้อมูล Firebase ให้อยู่ในรูปแบบที่ต้องการ (แสดงแค่ชื่อบริษัท)
      const companiesList = [];
  
      // Loop ผ่าน floors
      Object.keys(data).forEach(floor => {
        Object.keys(data[floor]).forEach(companyKey => {
          const companyData = data[floor][companyKey];
  
          if (companyData.name) {  // ตรวจสอบว่ามีชื่อบริษัทหรือไม่
            companiesList.push({
              id: companyKey,   // ส่ง `id` ของบริษัท
              floor: floor,     // ส่ง `floor` ของบริษัท
              name: companyData.name,  // แสดงแค่ชื่อบริษัท
              departments: companyData.departments || [] // ส่ง `departments` ถ้ามี
            });
          }
        });
      });
  res.json(companiesList); // ส่งกลับข้อมูลที่แปลงแล้ว
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).send("Error fetching companies: " + error.message);
  }
});
  

app.get("/api/companies/:companyId", async (req, res) => {
  const companyId = req.params.companyId;

  try {
    // ดึงข้อมูลจาก Firebase
    const companyRef = db.ref("contactOptions/floors");
    const snapshot = await companyRef.once("value");
    const floorsData = snapshot.val();

    // หาข้อมูลบริษัทที่ตรงกับ companyId ที่ต้องการ
    let companyData = null;
    for (const floorKey in floorsData) {
      for (const companyKey in floorsData[floorKey]) {
        // ตรวจสอบว่า companyKey ตรงกับ companyId ที่ต้องการหรือไม่
        if (companyKey === companyId) {
          companyData = floorsData[floorKey][companyKey];
          companyData.id = companyKey;
          companyData.floor = floorKey;

          // ดึงข้อมูล departments และ contacts
          for (const deptKey in companyData.departments) {
            const department = companyData.departments[deptKey];
            department.contacts = department.contacts || []; // ให้แน่ใจว่ามี contacts
          }

          break;
        }
      }
      if (companyData) break;
    }

    if (!companyData) {
      return res.status(404).send("Company not found");
    }

    res.json(companyData); // ส่งข้อมูลทั้งหมดกลับไป
  } catch (error) {
    res.status(500).send("Error fetching company data: " + error.message);
  }
});

app.post('/api/update-company/:id', async (req, res) => {
    const companyId = req.params.id;
    const { floor, company, departments } = req.body;

    try {
        const companyRef = db.ref(`contactOptions/floors/${floor}/${companyId}`);

        await companyRef.child('name').set(company); // อัปเดตชื่อบริษัท
        await companyRef.child('departments').remove(); // ลบ Departments เก่าก่อนเพิ่มใหม่

        for (let i = 0; i < departments.length; i++) {
            const dept = departments[i];
            const deptRef = companyRef.child(`departments/${i}`);
            await deptRef.child('name').set(dept.name); // อัปเดตชื่อแผนก

            await deptRef.child('contacts').remove(); // ลบ Contacts เก่าก่อนเพิ่มใหม่
            for (let j = 0; j < dept.contacts.length; j++) {
                const contactName = dept.contacts[j];
                const contactRef = deptRef.child(`contacts/${j}`);
                await contactRef.child('name').set(contactName); // อัปเดต Contact
            }
        }

        res.status(200).send('Company data updated successfully');
    } catch (error) {
        res.status(500).send('Error updating data: ' + error.message);
    }
});

app.get("/companies", async (req, res) => {
  try {
    const ref = db.ref("contactOptions/floors");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No companies found" });
    }

    const companies = [];
    snapshot.forEach((floor) => {
      floor.forEach((company) => {
        const companyData = company.val();
        if (companyData.name && companyData.name.trim() !== "") {
          // ตรวจสอบว่ามีชื่อ
          companies.push({
            id: company.key, // ใช้คีย์เป็น ID
            name: companyData.name, // ใช้ชื่อบริษัท
          });
        }
      });
    });

    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/departments", async (req, res) => {
  const { company } = req.query;
  if (!company) return res.status(400).json({ error: "Company is required" });

  try {
    const ref = db.ref("contactOptions/floors");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No departments found" });
    }

    let departments = [];

    snapshot.forEach((floor) => {
      floor.forEach((comp) => {
        if (comp.key === company) {
          // ค้นหา company ตาม key
          const companyData = comp.val();
          if (companyData.departments) {
            departments = Object.keys(companyData.departments);
          }
        }
      });
    });

    if (departments.length === 0) {
      return res
        .status(404)
        .json({ message: "No departments found for this company" });
    }

    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/contacts", async (req, res) => {
  const { company, department } = req.query;
  if (!company || !department)
    return res
      .status(400)
      .json({ error: "Company and Department are required" });

  try {
    const ref = db.ref("contactOptions/floors");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No contacts found" });
    }

    let contacts = [];

    snapshot.forEach((floor) => {
      floor.forEach((comp) => {
        if (comp.key === company) {
          // ค้นหา company ตาม key
          const companyData = comp.val();
          if (companyData.departments && companyData.departments[department]) {
            const departmentData = companyData.departments[department];
            if (departmentData.contacts) {
              contacts = Object.keys(departmentData.contacts);
            }
          }
        }
      });
    });

    if (contacts.length === 0) {
      return res
        .status(404)
        .json({ message: "No contacts found for this department" });
    }

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/history/all", async (req, res) => {
  try {
    const { date, company, department, contact,LogType, gate, No, floor, source } = req.query;

    // กำหนดว่าเราจะโหลด data จาก table ไหนบ้าง
    const pathsToFetch = [];

    if (source) {
      if (["visitorRegisters", "previsitorRegisters", "logs"].includes(source)) {
        pathsToFetch.push(source);
      }
    } else {
      pathsToFetch.push("visitorRegisters", "previsitorRegisters", "logs");
    }

    let allData = [];

    for (const path of pathsToFetch) {
      const ref = db.ref(path);
      const snapshot = await ref.once("value");

      if (!snapshot.exists()) continue;

      let data = Object.values(snapshot.val()).map(entry => ({
        ...entry,
      }));

      // Apply filter ตามแหล่งข้อมูล
      if (path === "logs") {
        if(LogType === "inandout" ){ 
          if(LogType === "inandout" && !gate ){        
          data = data.filter(entry => entry.gate === "in").concat(data.filter(entry => entry.gate === "out"));
          }
        if (date) {
          data = data.filter(entry => entry.date === date);
        }
        if (gate) {
          data = data.filter(entry => entry.gate === gate);
        }      
        if (No) {
          data = data.filter(entry => entry.No === No);
        }
      }
      if(LogType === "floor"){
        if (date) {
          data = data.filter(entry => entry.date === date);
        }
          if(LogType === "floor" && !floor ){        
          data = data.filter(entry => entry.floor !== undefined);
          }
        if (floor) {
          data = data.filter(entry => entry.floor === floor);
        }
      }
      } else {
        if (date) {
          data = data.filter(entry => entry.date === date);
        }
        if (company) {
          data = data.filter(entry => entry.company === company);
        }
        if (department) {
          data = data.filter(entry => entry.department === department);
        }
        if (contact) {
          data = data.filter(entry => entry.contact === contact);
        }
      }

      allData = allData.concat(data);
    }

    res.status(200).json(allData);
  } catch (error) {
    console.error("Error fetching combined history:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



app.delete("/api/delete-company/:floor/:companyId", async (req, res) => {
  const { floor, companyId } = req.params;

  try {
    const companyRef = db.ref(`contactOptions/floors/${floor}/${companyId}`);
    const snapshot = await companyRef.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "บริษัทไม่พบ" });
    }

    await companyRef.remove();
    return res.status(200).json({ message: "บริษัทถูกลบเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    return res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการลบบริษัท", error: error.message });
  }
});

// Run Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
