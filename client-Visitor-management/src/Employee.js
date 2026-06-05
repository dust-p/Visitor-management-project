import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react"; // หรือ import ตามที่ใช้อยู่
import { getCookie } from "./util/cookie";
import config from './config/config';
import axios from "axios";
import ReactPaginate from "react-paginate";

function Employee() {
  // State
  const [selectedTab, setSelectedTab] = useState("register"); // register หรือ employees
  const [employeeName, setEmployeeName] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showPermit, setShowPermit] = useState(false);
  const [pendingEmployee, setPendingEmployee] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState('');
  const permitRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
const itemsPerPage = 10;

const handlePageClick = ({ selected }) => {
  setCurrentPage(selected);
};

const filteredEmployees = employees.filter((emp) =>
  [emp.name, emp.company, emp.department]
    .some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
);
const offset = currentPage * itemsPerPage;
// คำนวณ pagination ใหม่จากข้อมูลที่ถูกกรอง
const pageCount = Math.ceil(filteredEmployees.length / itemsPerPage);
const currentItems = filteredEmployees.slice(offset, offset + itemsPerPage);


      const role = getCookie('role');
      const companyName = getCookie('company');
  // ดึงรายชื่อบริษัท
    useEffect(() => {
        fetch(`${config.API_BASE_URL}/register/companies`)
            .then(res => res.json())
            .then(data => setCompanies(data))
            .catch(err => console.error(err));
    }, []);

useEffect(() => {
  if (selectedCompany) { 
    fetch(`${config.API_BASE_URL}/register/companies/${selectedCompany}/floor`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFloors(data);
        } else {
          setFloors([]);
        }
      })
      .catch(err => {
        console.error("Error fetching floor data:", err);
        setFloors([]);
      });
  } else {
    setFloors([]);
  }
}, [selectedCompany]);


    useEffect(() => {
  if (selectedCompany && selectedFloor) {
    fetch(`${config.API_BASE_URL}/register/departments/${selectedCompany}/${selectedFloor}`)
      .then(res => res.json())
      .then(data => {
        setDepartments(data);
      })
      .catch(err => console.error("Error fetching departments:", err));
  }
}, [selectedCompany, selectedFloor]);


    useEffect(() => {
            if (selectedCompany && selectedFloor && selectedDepartment) {
            fetch(`${config.API_BASE_URL}/register/contacts/${selectedCompany}/${selectedFloor}/${selectedDepartment}`)
                .then(res => res.json())
                .then(data => setEmployeeName(data))
                .catch(err => console.error(err));
            }
}, [selectedCompany, selectedFloor, selectedDepartment]);

     useEffect(() => {            
            if(role === "companyadmin"){
                setSelectedCompany(companyName)
            }
        }, [companyName,role]);

          const fetchEmployees = () => {
          const role = getCookie('role');
          const companyName = getCookie('company');

          let url = `${config.API_BASE_URL}/employees`;

          if (role === 'companyadmin') {
            url += `?company=${companyName}`;
          }

          axios.get(url)
            .then(res => {
              setEmployees(res.data);
            })
            .catch(err => {
              console.error("Error fetching employees:", err);
            });
        };

  // ฟังก์ชันจัดการเลือกบริษัท
  const handleCompanySelect = (e) => {
    setSelectedCompany(e.target.value);
    setSelectedDepartment("");
  };

  // ฟังก์ชันลงทะเบียนพนักงาน (ยังไม่บันทึกจริง)
  const handleRegister = (e) => {
    e.preventDefault();
    const formattedDate = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
    const newEmployee = {
      name: selectedEmployee,
      company: selectedCompany,
      department: selectedDepartment || "",
      floor: Object.values(floors),
      recorddate: formattedDate,
      recordtime: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      code: Date.now(),
      key: btoa(unescape(encodeURIComponent(selectedEmployee))), 
    };
    
    setPendingEmployee(newEmployee);
    setShowPermit(true);
  };

  const handleDelete = (employeeKey) => {
  if (!window.confirm("Are you sure you want to delete this employee?")) return;

  axios.delete(`${config.API_BASE_URL}/employees/${employeeKey}`)
    .then(() => {
      alert("Employee deleted successfully");
      fetchEmployees(); // รีโหลดรายการใหม่
    })
    .catch((err) => {
      console.error("Error deleting employee:", err);
      alert("Failed to delete employee");
    });
};
  // ยืนยันบันทึกข้อมูลพนักงาน (POST API)
  const handleConfirm = () => {
     axios.post(`${config.API_BASE_URL}/employees/register/${pendingEmployee.key}`, pendingEmployee)
    .then(res => {
        if (res.data.success) {
          alert("Employee registered successfully");
          setEmployeeName("");
          if(role !== 'companyadmin'){
            setSelectedCompany("");
          }         
          setSelectedDepartment("");
          setSelectedEmployee("");
          printPermit();
          setShowPermit(false);
          setPendingEmployee(null);
         
          fetchEmployees();
        } else {
          alert("Failed to register employee");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Error registering employee");
      });
  };

  const handleBack = () => {
    setShowPermit(false);
    setPendingEmployee(null);
  };


  const printPermit = () => {
        const printContents = permitRef.current.innerHTML;
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';

        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
                <head>
                    <style>
  @page {
    size: 80mm 200mm;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
  }

  .permit {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    width: 100%;
    max-width: 100%;
    padding: 20px 10px 20px 10px;
    box-sizing: border-box;
    text-align: center;
    border: 1px solid #000;
    min-height: 180mm;
    position: relative;
  }

  .permit h3 {
    margin-top: 0;
    font-size: 18px;
    font-weight: bold;
  }

  .permit p {
    margin: 10px 0;
    font-size: 15px;
  }

  .qr-code {
    position: absolute;
    bottom: 20px; /* ห่างจากขอบล่าง */
    left: 50%;
    transform: translateX(-50%);
  }
</style>


                </head>
                <body>
                    <div class="permit">${printContents}</div>
                </body>
            </html>
        `);
        doc.close();
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
    };

  return (
    <div className="visitor-register-container">
  <h1 className="visitor-register-title">Employee Registration</h1>

  <div className="visitor-register-button-group">
    <button className="visitor-register-button" onClick={() => {
      setSelectedTab("register");
      setPendingEmployee(null);
    }}>
      Add Permit
    </button>
    <button className="visitor-register-button" onClick={() => {
      setSelectedTab("employees");
      setPendingEmployee(null);
      fetchEmployees();
    }}>
      Employee Permit List
    </button>
  </div>

  {selectedTab === "register" && (
    <form onSubmit={handleRegister} className="visitor-register-form">
      <label>
        Company:
        <select onChange={handleCompanySelect} value={selectedCompany} required disabled={role === 'companyadmin'} >
          <option value="">Select Company</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label>
        Floor:
        <select onChange={(e) => setSelectedFloor(e.target.value)} value={selectedFloor} required>
          <option value="">Select Floor</option>
          {floors.length > 0
            ? floors.map((floor, index) => (
              <option key={index} value={floor}>{floor}</option>
            ))
            : <option value="">No floors available</option>}
        </select>
      </label>

      <label>
        Department:
        <select onChange={(e) => setSelectedDepartment(e.target.value)} value={selectedDepartment} required>
          <option value="">Select Department</option>
          {departments.length > 0
            ? departments.map((dep, i) => (
              <option key={i} value={dep}>{dep}</option>
            ))
            : <option value="">No departments available</option>}
        </select>
      </label>

      <label>
        Employee:
        <select onChange={(e) => setSelectedEmployee(e.target.value)} value={selectedEmployee} required>
          <option value="">Select Employee</option>
          {employeeName.length > 0
            ? employeeName.map((name, i) => (
              <option key={i} value={name}>{name}</option>
            ))
            : <option value="">No Employees available</option>}
        </select>
      </label>

      <button type="submit">Print Permit</button>
    </form>
  )}

  {selectedTab === "employees" && (
    <div>
      <h3 className="visitor-register-subtitle">Employee List</h3>
      <input
        type="text"
        className="search-input"
        placeholder="Search by name, company, or department..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <table className="visitor-register-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Company</th>
            <th>Department</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((emp, idx) => (
            <tr key={emp.key}>
              <td>{offset + idx + 1}</td>
              <td>{emp.name}</td>
              <td>{emp.company}</td>
              <td>{emp.department}</td>
              <td>
                <button className="delete-button" onClick={() => handleDelete(emp.key)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination-container">
 <ReactPaginate
  previousLabel={"Previous"}
  nextLabel={"Next"}
  breakLabel={"..."}
  pageCount={pageCount}
  onPageChange={handlePageClick}
  containerClassName={"pagination-register"}
  activeClassName={"active-register"}
  disabledClassName={"disabled"}
  previousClassName={"pagination-previous"}
  nextClassName={"pagination-next"}
  pageClassName={"pagination-page"}
  pageLinkClassName={"pagination-link"}
/>
  </div>

    </div>
    
  )}

  {showPermit && pendingEmployee && (
    <div className="modal" onClick={handleBack}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={handleBack}>×</button>

        <div ref={permitRef} className="visitor-register-permit">
          <h3>Employee Permit</h3>
          <p><strong>Name:</strong> {pendingEmployee.name}</p>
          <p><strong>Company:</strong> {pendingEmployee.company}</p>
          <p><strong>Department:</strong> {pendingEmployee.department}</p>
          <div className="qr-code">
            <QRCodeSVG value={`employees,${pendingEmployee.key},${pendingEmployee.code}`} size={150} />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleBack}>Back</button>
            <button onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )}
</div>

  );
}
export default Employee;