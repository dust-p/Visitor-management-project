import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/ContactOptionsManagement.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { getCookie } from "./util/cookie";
import config from './config/config';

function ContactManagement() {
  const [company, setCompany] = useState("");
  const [floors, setFloors] = useState([
  { 
    name: "1",
    departments: [
      {
        name: "",
        contacts: [{ name: "" }],
      },
    ],
  },
]);
  const [floorOptions, setFloorOptions ] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [, setCurrentCompany] = useState(null);
  const [reason, setReason] = useState("");
  const [reasons, setReasons] = useState([]);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [editingReasonId, setEditingReasonId] = useState(null);
  const [mode, setMode] = useState("contact");
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);

  const fetchFloors = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/management/floors`
      );
      setFloors(response.data);
      setFloorOptions(response.data);
    } catch (error) {
      console.error("Error fetching floors:", error);
    }
  };
  
const fetchFloorOptions = async (companyId) => {
  try {
    const response = await axios.get(`/register/companies/${companyId}/floor`);
    setFloorOptions(response.data); // response.data คือ array ของ floor เช่น ["1", "2"]
  } catch (error) {
    console.error("Error fetching floor options:", error);
  }
};

const fetchCompanies = async () => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/api/companies`);
    setCompanies(response.data); // 
  } catch (error) {
    console.error("Error fetching companies:", error);
  }
};

  const fetchReasons = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/reasons`);
      setReasons(response.data);
    } catch (error) {
      console.error("Error fetching reasons:", error);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchReasons();
    fetchFloors();
  }, []);

  useEffect(() => {
    const companyFromCookie = getCookie("company");
    const roleFromCookie = getCookie("role");
    if (roleFromCookie === "companyadmin") {
      setIsCompanyAdmin(true);
      setCompany(companyFromCookie);
    }
  }, []);

const handleFloorChange = (index, newFloorId) => {
  // ตรวจสอบซ้ำ id
  const isDuplicate = floors.some((f, idx) => f.floor === newFloorId && idx !== index);
  if (isDuplicate) {
    alert("ชั้นนี้ถูกเลือกไปแล้ว");
    return;
  }

  const newFloors = [...floors];
  newFloors[index].floor = newFloorId;
  setFloors(newFloors);
};



useEffect(() => {
  if (company) {
    fetchFloorOptions(company);
  }
}, [company]);

const handleAddFloor = () => {
  setFloors([
    ...floors,
    { floor: "", departments: [{ name: "", contacts: [{ name: "" }] }] },
  ]);
};

const handleRemoveFloor = (floorIndex) => {
  const newFloors = [...floors];
  newFloors.splice(floorIndex, 1);
  setFloors(newFloors);
};

const handleAddDepartment = (floorIndex) => {
  const newFloors = [...floors];
  newFloors[floorIndex].departments.push({ name: "", contacts: [{ name: "" }] });
  setFloors(newFloors);
};

const handleRemoveDepartment = (floorIndex, deptIndex) => {
  const newFloors = [...floors];
  newFloors[floorIndex].departments.splice(deptIndex, 1);
  setFloors(newFloors);
};

const handleDepartmentChange = (floorIndex, deptIndex, value) => {
  const newFloors = [...floors];
  newFloors[floorIndex].departments[deptIndex].name = value;
  setFloors(newFloors);
};

const handleAddContact = (floorIndex, deptIndex) => {
  const newFloors = [...floors];
  newFloors[floorIndex].departments[deptIndex].contacts.push({ name: "" });
  setFloors(newFloors);
};

const handleRemoveContact = (floorIndex, deptIndex, contactIndex) => {
  const newFloors = [...floors];
  newFloors[floorIndex].departments[deptIndex].contacts.splice(contactIndex, 1);
  setFloors(newFloors);
};

const handleContactChange = (floorIndex, deptIndex, contactIndex, value) => {
  const newFloors = [...floors];
  newFloors[floorIndex].departments[deptIndex].contacts[contactIndex].name = value;
  setFloors(newFloors);
};
  const handleModalOverlayClick = (event) => {
    if (event.target.className === 'modal') {
      setIsModalOpen(false);
    }
  };

  const handleReasonModalOverlayClick = (event) => {
    if (event.target.className === 'modal') {
      setIsReasonModalOpen(false);
    }
  };


  const handleSubmit = async () => {
  try {
    const payload = { floors, company };

    await axios.post(`${config.API_BASE_URL}/api/save-company`, payload);
    alert("บันทึกข้อมูลสำเร็จ");
    console.log('Sending payload:', { company, floors });
    setIsModalOpen(false);
    setIsEditing(false);
    fetchCompanies(); // รีโหลดข้อมูลใหม่
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
};


  const handleEditReason = (item) => {
    setReason(item.reason);
    setIsReasonModalOpen(true);
    setEditingReasonId(item.id);
  };

  const handleDeleteReason = async (id) => {
    const confirmDelete = window.confirm(
      "คุณแน่ใจหรือว่าต้องการลบ Reason นี้?"
    );
    if (confirmDelete) {
      try {
        await axios.delete(
          `${config.API_BASE_URL}/register/delete-reason/${id}`
        );
        alert("ลบ Reason สำเร็จ");
        fetchReasons();
      } catch (error) {
        console.error("Error deleting reason:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    }
  };

  const handleReasonSubmit = async () => {
    try {
      if (editingReasonId) {
        await axios.post(
          `${config.API_BASE_URL}/register/update-reason/${editingReasonId}`,
          { reason }
        );
        alert("แก้ไข Reason สำเร็จ");
      } else {
        await axios.post(`${config.API_BASE_URL}/register/save-reason`, {
          reason,
        });
        alert("เพิ่ม Reason สำเร็จ");
      }
      setIsReasonModalOpen(false);
      setReason("");
      setEditingReasonId(null);
      fetchReasons();
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleCancel = () => {
  setCurrentCompany(null);
  setCompany("");

  setFloors([
    {
      floor: "",
      departments: [
        {
          name: "",
          contacts: [{ name: "" }],
        },
      ],
    },
  ]);

  setIsModalOpen(false);
  setIsEditing(false);
};

  const handleOpenAddModal = () => {
  if (mode === "contact") {
    setIsModalOpen(true);
    setCompany("");
    setFloors([
      {
        floor: "",
        departments: [
          {
            name: "",
            contacts: [{ name: "" }],
          },
        ],
      },
    ]);
    setIsEditing(false);
  } else if (mode === "reason") {
    setReason("");
    setEditingReasonId(null);
    setIsReasonModalOpen(true);
  }
};


const handleEdit = async (companyId) => {
  const companyToEdit = companies.find((comp) => comp.id === companyId);
  setCompany(companyToEdit.name);
  fetchFloorOptions(companyId);
  try {
    const response = await axios.get(`${config.API_BASE_URL}/api/companies/${companyToEdit.id}`);
    const companyData = response.data;
    console.log("DATA FROM API:", response.data);
    const floorsData = Array.isArray(companyData.floors)
  ? companyData.floors
      .filter(floor => floor) // ตัด null ออก
      .map(floor => ({
        floor: floor.floor || '',   // <-- แก้จาก name เป็น floor ตามโครงสร้างที่ส่งมา
        departments: floor.departments
          ? Object.keys(floor.departments).map(deptKey => {
              const dept = floor.departments[deptKey];
              return {
                name: dept.name || deptKey,
                contacts: dept.contacts
                  ? Object.keys(dept.contacts).map(cKey => ({
                      name: dept.contacts[cKey].name || cKey,
                    }))
                  : [],
              };
            })
          : [],
      }))
  : [];



    setFloors(floorsData); // 👈 รูปแบบตรงกับ useState ที่คุณใช้
    setIsModalOpen(true);
    setIsEditing(true);
  } catch (error) {
    console.error("Error fetching company data:", error);
    alert("เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
  }
};



const handleDelete = async (companyId) => {
  const confirmDelete = window.confirm("คุณแน่ใจหรือว่าต้องการลบบริษัทนี้?");
  if (!confirmDelete) return;

  try {
    await axios.delete(`${config.API_BASE_URL}/api/delete-company/${companyId}`);
    setCompanies(companies.filter((comp) => comp.id !== companyId));
    alert("ลบข้อมูลบริษัทสำเร็จ");
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการลบบริษัท: " + error.message);
  }
};


  return (
    <div className="contact-options-container">
      <h1 className="main-title">Contact Management</h1>
      {!isCompanyAdmin && (
        <div className="tab-options">
          <button
            className={mode === "contact" ? "tab-option active" : "tab-option"}
            onClick={() => {
              setMode("contact");
              setIsModalOpen(false);
              setIsReasonModalOpen(false);
            }}
          >
            จัดการ Contact
          </button>
          <button
            className={mode === "reason" ? "tab-option active" : "tab-option"}
            onClick={() => {
              setMode("reason");
              setIsModalOpen(false);
              setIsReasonModalOpen(false);
            }}
          >
            จัดการ Reason
          </button>
        </div>
      )}

      {!isCompanyAdmin && (
        <div className="add-button-container">
          <button className="add-button" onClick={handleOpenAddModal}>
            {mode === "contact" ? "เพิ่ม Company" : "เพิ่ม Reason"}
          </button>
        </div>
      )}

      {mode === "contact" ? (
        <div className="list-section">
          <h2 className="list-title">รายชื่อบริษัททั้งหมด</h2>
          <ul className="item-list">
            {companies
              .filter((c) => {
                if (!isCompanyAdmin) {
                  return true; // ถ้าไม่ใช่ Company Admin แสดงทุกบริษัท
                } else {
                  const companyFromCookie = getCookie("company");
                  return c.name === companyFromCookie; // ถ้าเป็น Company Admin แสดงเฉพาะบริษัทของตัวเอง
                }
              })
              .map((c) => (
                <li key={c.id} className="list-item">
                  <span className="item-name">{c.name}</span>
                  <div className="button-group">
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(c.id)}
                    >
                      แก้ไข
                    </button>
                    {!isCompanyAdmin && (
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(c.id)}
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <div className="list-section">
          <h2 className="list-title">รายการเหตุผลทั้งหมด</h2>
          <ul className="item-list">
            {reasons.map((item) => (
              <li key={item.id} className="list-item">
                <span className="item-name">{item.reason}</span>
                <div className="button-group">
                  <button
                    className="edit-button"
                    onClick={() => handleEditReason(item)}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteReason(item.id)}
                  >
                    ลบ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal สำหรับเพิ่ม Reason */}
      {isReasonModalOpen && (
        <div className="modal" onClick={handleReasonModalOverlayClick}>
          <div className="modal-content1">
            <button
              className="close-button"
              onClick={() => setIsReasonModalOpen(false)}
            >
              ×
            </button>
            <h2 className="modal-title">
              {editingReasonId ? "แก้ไข Reason" : "เพิ่ม Reason"}
            </h2>
            <input
              placeholder="กรอกเหตุผล"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="modal-input"
            />
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setIsReasonModalOpen(false)}
              >
                ยกเลิก
              </button>
              <button className="confirm-button" onClick={handleReasonSubmit}>
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal สำหรับเพิ่ม/แก้ไข Company */}
      {isModalOpen && (
  <div className="modal" onClick={handleModalOverlayClick}>
    <div className="modal-content1">
      <button
        className="close-button1"
        onClick={() => setIsModalOpen(false)}
      >
        ×
      </button>
      <h2 className="modal-title">
        {isEditing
          ? "แก้ไข Company / Department / Contact"
          : "เพิ่ม Company / Department / Contact"}
      </h2>
      <div className="modal-body">
        <p className="input-label">Company</p>
        <input
          placeholder="Company Name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="modal-input"
          disabled={isCompanyAdmin}
        />

        {/* แสดง Floors */}
         {floors.map((floorItem, floorIndex) => (
        <div key={floorIndex} className="floor-section">
          <p className="input-label">Floor {floorItem.floor || floorIndex + 1}</p>
          <div className="input-with-delete">
            <select
                value={floorItem.floor} // floorItem.floor เป็น id
                onChange={(e) => handleFloorChange(floorIndex, e.target.value)}
                className="modal-input"
                disabled={isCompanyAdmin}
              >
                <option value="">เลือกชั้น</option>
                {floorOptions.map((opt) => {
                  const isDuplicate = floors.some((f, idx) => f.floor === opt.id && idx !== floorIndex);
                  return (
                    <option key={opt.id} value={opt.id} disabled={isDuplicate}>
                      Floor {opt.id} {isDuplicate ? "(ซ้ำ)" : ""}
                    </option>
                  );
                })}
              </select>


            <button
              type="button"
              className="delete-icon-button"
              onClick={() => handleRemoveFloor(floorIndex)}
              style={{ display: isCompanyAdmin ? "none" : "inline-block" }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>

            {/* แสดง Departments */}
            {floorItem.departments.map((dept, deptIndex) => (
              <div key={deptIndex} className="department-container">
                <p className="input-label">Department</p>
                <div className="input-with-delete">
                  <input
                    placeholder={`Department ${deptIndex + 1}`}
                    value={dept.name}
                    onChange={(e) =>
                      handleDepartmentChange(floorIndex, deptIndex, e.target.value)
                    }
                    className="modal-input department-input"
                  />
                  <button
                    type="button"
                    className="delete-icon-button"
                    onClick={() => handleRemoveDepartment(floorIndex, deptIndex)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>

                {/* แสดง Contacts */}
                {dept.contacts.length > 0 && (
                  <p className="input-label">Contact</p>
                )}
                {dept.contacts.map((contact, contactIndex) => (
                  <div
                    key={`${deptIndex}-${contactIndex}`}
                    className="contact-item input-with-delete"
                  >
                    <input
                      placeholder={`Contact ${contactIndex + 1}`}
                      value={contact.name || ""}
                      onChange={(e) =>
                        handleContactChange(floorIndex, deptIndex, contactIndex, e.target.value)
                      }
                      className="modal-input contact-input"
                    />
                    <button
                      type="button"
                      className="delete-icon-button"
                      onClick={() =>
                        handleRemoveContact(floorIndex, deptIndex, contactIndex)
                      }
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
                <button
                  className="add-button"
                  onClick={() => handleAddContact(floorIndex, deptIndex)}
                >
                  + เพิ่ม Contact
                </button>
              </div>
            ))}

            <button
              className="add-button"
              onClick={() => handleAddDepartment(floorIndex)}
            >
              + เพิ่ม Department
            </button>
          </div>
        ))}

        <button className="add-button" onClick={handleAddFloor} style={{ display: isCompanyAdmin ? "none" : "inline-block" }}>
          + เพิ่ม Floor
        </button>
      </div>

      <div className="modal-footer">
        <button className="cancel-button" onClick={handleCancel}>
          ยกเลิก
        </button>
        <button className="confirm-button" onClick={handleSubmit}>
          บันทึก
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default ContactManagement;
