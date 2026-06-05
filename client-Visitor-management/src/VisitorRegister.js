import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './styles/VisitorRegister.css';
import ReactPaginate from "react-paginate";
import config from './config/config';
import { getCookie } from './util/cookie';
const VisitorRegister = () => {
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [reasons, setReasons] = useState([]);
    const [visitorName, setVisitorName] = useState('');
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedContact, setSelectedContact] = useState('');
    const [selectedReason, setSelectedReason] = useState('');
    const [note, setNote] = useState('');
    const [todayVisitors, setTodayVisitors] = useState([]);
    const [pretodayVisitors, setpreTodayVisitors] = useState([]);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [pendingVisitor, setPendingVisitor] = useState(null);
    const [selectedTab, setSelectedTab] = useState('register');
    const permitRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [showPermit, setShowPermit] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [searchPreName, setSearchPreName] = useState('');

    const itemsPerPage = 10; 
    const email = getCookie('email');    
    
const searchLower = searchName.toLowerCase().trim();
const presearchLower = searchPreName.toLowerCase().trim();
const filteredVisitors = todayVisitors.filter(visitor => {
  const nameLower = visitor.name.toLowerCase();
  const activeString = (visitor.active === true || visitor.active === "true") ? "yes" : "no";

  return (
    nameLower.includes(searchLower) ||  // ชื่อตรง
    searchLower.includes(nameLower) ||  // พิมพ์ชื่อบางส่วน
    searchLower.includes(activeString)  // พิมพ์ว่า yes / no
  );
});

const filteredPreVisitors = pretodayVisitors.filter(previsitor => {
  const nameLower = previsitor.name.toLowerCase();
  const activeString = (previsitor.active === true || previsitor.active === "true") ? "yes" : "no";

  return (
    nameLower.includes(presearchLower) ||
    presearchLower.includes(nameLower) ||
    presearchLower.includes(activeString)
  );
});


const handleCompanySelect = (e) => {
        const companyId = e.target.value;
        setSelectedCompany(companyId);
        setSelectedFloor('');
        setDepartments([]);
        setContacts([]);
    };
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



    // ดึงรายชื่อผู้ติดต่อ
    useEffect(() => {
            if (selectedCompany && selectedFloor && selectedDepartment) {
            fetch(`${config.API_BASE_URL}/register/contacts/${selectedCompany}/${selectedFloor}/${selectedDepartment}`)
                .then(res => res.json())
                .then(data => setContacts(data))
                .catch(err => console.error(err));
            }
}, [selectedCompany, selectedFloor, selectedDepartment]);


    useEffect(() => {
        fetch(`${config.API_BASE_URL}/register/reasons`)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setReasons(data);
            })
            .catch((err) => console.error('Error fetching reasons:', err));
    }, []);

    useEffect(() => {
        fetch(`${config.API_BASE_URL}/register/visitors/today?date=${new Date().toISOString()}`)
            .then(res => res.json())
            .then(data => setTodayVisitors(data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        fetch(`${config.API_BASE_URL}/register/previsitors/today?date=${new Date().toISOString()}`)
            .then(res => res.json())
            .then(data => setpreTodayVisitors(data))
            .catch(err => console.error(err));
    }, []);

    const fetchTodayVisitors = () => {
        fetch(`${config.API_BASE_URL}/register/visitors/today?date=${new Date().toISOString()}`)
            .then(res => res.json())
            .then(data => setTodayVisitors(data))
            .catch(err => console.error(err));
    };

    const fetchPreTodayVisitors = () => {
        fetch(`${config.API_BASE_URL}/register/previsitors/today?date=${new Date().toISOString()}`)
            .then(res => res.json())
            .then(data => setpreTodayVisitors(data))
            .catch(err => console.error(err));
    };

    const handlePageClick = (data) => {
        setCurrentPage(data.selected);
    };

    const handleRegister = () => {
        const timestampKey = `${Date.now()}`;
        const formattedDate = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
        const newVisitor = {
            key: timestampKey,
            name: visitorName,
            company: selectedCompany,
            department: selectedDepartment,
            contact: selectedContact,
            reason: selectedReason,
            note: note,
            floor: selectedFloor ,
            email: email,
            date: formattedDate,
            time: new Date().toLocaleTimeString(),
        };

        setPendingVisitor(newVisitor);
        setSelectedVisitor(null); // Clear selectedVisitor when showing pending
        setShowPermit(true);
    };

    const handleDelete = (visitorId) => {
        fetch(`${config.API_BASE_URL}/register/visitors/${visitorId}`, { method: 'DELETE' })
            .then(() => {
                alert('Visitor deleted successfully');
                fetchTodayVisitors(); // Refresh the list after deletion
            })
            .catch(err => console.error(err));
    };

    const handlePreDelete = (previsitorId) => {
        fetch(`${config.API_BASE_URL}/register/previsitors/${previsitorId}`, { method: 'DELETE' })
            .then(() => {
                alert('Pre-registered visitor deleted successfully');
                fetchPreTodayVisitors(); // Refresh the list after deletion
            })
            .catch(err => console.error(err));
    };

    const handleView = (visitor) => {
        setSelectedVisitor(visitor);
        setPendingVisitor(null); // Clear pendingVisitor when showing selected
        setShowPermit(true);
    };

    const handlePrint = () => {
        printPermit();
        setShowPermit(false);
        setSelectedVisitor(null); // Clear selectedVisitor after printing
    };

    const handleBack = () => {
        setShowPermit(false);
        setPendingVisitor(null);
        setSelectedVisitor(null);
    };

    const handleConfirm = () => {
        console.log("Selected Visitor: ", pendingVisitor);
     const visitorWithDate = {
        ...pendingVisitor,
        date: new Date().toISOString() // 👉 ใส่วันที่แบบ dd/mm/yyyy
    };

        fetch(`${config.API_BASE_URL}/register/visitors/register/${pendingVisitor.key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(visitorWithDate),
        })
            .then(res => res.json())
            .then(data => {
                console.log("API Response: ", data);
                setVisitorName('');
                setSelectedCompany('');
                setSelectedDepartment('');
                setSelectedContact('');
                setSelectedReason('');
                setNote('');
                setSelectedFloor('');


                if (data.success) {
                    printPermit();
                    setShowPermit(false);
                } else {
                    alert("Registration failed, please try again.");
                }
                fetchTodayVisitors();
                fetchPreTodayVisitors();
            })
            .catch(error => {
                console.error('Error registering visitor:', error);
                alert("There was an error with the registration process. Please try again.");
            });
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

    // New function to close modal by clicking overlay
    const handleModalOverlayClick = (event) => {
        if (event.target.className === 'modal') {
            setShowPermit(false);
            setPendingVisitor(null);
            setSelectedVisitor(null);
        }
    };

    return (
        <div className="visitor-register-container">
            <h1 className="visitor-register-title">Visitor Registration</h1> {/* เปลี่ยนจาก form เป็น title เพื่อความเหมาะสม */}
            {/* ปุ่มสำหรับสลับระหว่างส่วนต่างๆ */}
            <div className="visitor-register-button-group">
                <button
                    className="visitor-register-button"
                    onClick={() => { setSelectedTab('register'); setSelectedVisitor(null); }}
                >
                    Visitor Register
                </button>
                <button
                    className="visitor-register-button"
                    onClick={() => { setSelectedTab('visitorRegisters'); setSelectedVisitor(null); fetchTodayVisitors() }}
                >
                    Registered
                </button>
                <button
                    className="visitor-register-button"
                    onClick={() => { setSelectedTab('previsitorRegisters'); setSelectedVisitor(null); fetchPreTodayVisitors() }}
                >
                    PreRegistered
                </button>
            </div>

            {/* แสดงส่วนของ Visitor Registration */}
            {selectedTab === 'register' && (
                <div>
                    <h3 className="visitor-register-subtitle">Visitor Register</h3> {/* เปลี่ยนจาก form เป็น subtitle */}
                    <form className="visitor-register-form" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
                        <label>
                            Name:
                            <input
                                type="text"
                                value={visitorName}
                                onChange={(e) => setVisitorName(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Company:
                            <select onChange={handleCompanySelect} value={selectedCompany} required>
                                <option value="">Select Company</option>
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Floor:
                            <select onChange={(e) => setSelectedFloor(e.target.value)} value={selectedFloor} required>
                                <option value="">Select Floor</option>
                                {floors.length > 0 ? (
                                floors.map((floor, index) => (
                                    <option key={index} value={floor}>{floor}</option>
                                ))
                                ) : (
                                <option value="">No floors available</option>
                                )}
                            </select>
                            </label>
                        <label>
                            Department (Optional):
                            <select onChange={(e) => setSelectedDepartment(e.target.value)} value={selectedDepartment}>
                                <option value="">Select Department</option>
                                {departments.length > 0 ? (
                                    departments.map((dep, index) => (
                                        <option key={index} value={dep}>{dep}</option>
                                    ))
                                ) : (
                                    <option value="">No departments available</option>
                                )}
                            </select>
                        </label>
                        <label>
                            Contact (Optional):
                            <select onChange={(e) => setSelectedContact(e.target.value)} value={selectedContact}>
                                <option value="">Select Contact</option>
                                {contacts.length > 0 ? (contacts.map((contact, index) => (
                                    <option key={index} value={contact}>{contact}</option>
                                ))
                                ) : (
                                    <option value="">No contacts available</option>
                                )}
                            </select>
                        </label>
                        <label>
                            Reason:
                            <select
                                value={selectedReason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                required
                            >
                                <option value="">Select Reason</option>
                                {reasons.map((reason) => (
                                    <option key={reason.id} value={reason.reason}>
                                        {reason.reason}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Note (Optional):
                            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
                        </label>
                        <button className="visitor-register-button" type="submit">Register</button>
                    </form>

                    {/* Modal สำหรับ Register และ Confirm */}
                    {showPermit && pendingVisitor && (
                        <div className="modal" onClick={handleModalOverlayClick}>
                            <div className="modal-content">
                                <div ref={permitRef} className="visitor-register-permit">
                                    <h3>Visitor Permit</h3>
                                    <p><strong>Name:</strong> {pendingVisitor.name}</p>
                                    <p><strong>Company:</strong> {pendingVisitor.company}</p>
                                    <p><strong>Department:</strong> {pendingVisitor.department}</p>
                                    <p><strong>Contact:</strong> {pendingVisitor.contact}</p>
                                    <p><strong>Reason:</strong> {pendingVisitor.reason}</p>
                                    <p><strong>Note:</strong> {pendingVisitor.note}</p>
                                    <p><strong>Date:</strong> {pendingVisitor.date}</p>
                                    <p><strong>Time:</strong> {pendingVisitor.time}</p>
                                    <p><strong>Floor:</strong> {pendingVisitor.floor}</p>
                                    <div className="visitor-register-qr-code">
                                        <QRCodeSVG
                                            value={`visitorRegisters,${pendingVisitor.key}`}
                                            size={156}
                                            includeMargin={true}
                                        />
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
            )}

            {/* แสดงส่วนของ Visitors Registered Today */}
            {selectedTab === 'visitorRegisters' && (
                <div>
                    <h3 className="visitor-register-subtitle">Registered</h3>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อหรือ active (yes/no)"
                        value={searchName}
                        onChange={(e) => {
                            setSearchName(e.target.value);
                            setCurrentPage(0); // reset page เมื่อมีการค้นหาใหม่
                        }}
                        className="search-input" // ใช้ class นี้
                    />
                    <table className="visitor-register-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Department</th>
                                <th>Contact</th>
                                <th>Reason</th>
                                <th>Note</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Floor</th>
                                <th>Active</th>
                                <th>Actions</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVisitors
                                .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
                                .map((visitor, index) => (
                                    <tr key={index}>
                                        <td>{(currentPage * itemsPerPage) + index + 1}</td> 
                                        <td>{visitor.name}</td>
                                        <td>{visitor.company}</td>
                                        <td>{visitor.department}</td>
                                        <td>{visitor.contact}</td>
                                        <td>{visitor.reason}</td>
                                        <td>{visitor.note}</td>
                                        <td>{visitor.date}</td>
                                        <td>{visitor.time}</td>
                                        <td>{visitor.floor}</td>
                                        <td>{visitor.active ? "Yes" : "No"}</td>
                                        <td>
                                            <button className="visitor-register-button" onClick={() => handleView(visitor)}>View</button>
                                        </td>
                                        <td>
                                            <button onClick={() => handleDelete(visitor.id)} className="delete-button">Delete</button>
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
                            pageCount={Math.ceil(filteredVisitors.length / itemsPerPage)} // ใช้ filteredVisitors
                            onPageChange={handlePageClick}
                            containerClassName={"pagination-register"}
                            activeClassName={"active-register"}
                        />
                    </div>
                </div>
            )}

            {/* แสดงส่วนของ Pre-registered Visitors Today */}
            {selectedTab === 'previsitorRegisters' && (
                <div>
                    <h3 className="visitor-register-subtitle">PreRegistered</h3>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อหรือ active (yes/no)"
                        value={searchPreName}
                        onChange={(e) => {
                            setSearchPreName(e.target.value);
                            setCurrentPage(0); // reset ไปหน้าแรกเมื่อพิมพ์ค้นหา
                        }}
                        className="search-input" // ใช้ class นี้
                    />
                    <table className="visitor-register-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Department</th>
                                <th>Contact</th>
                                <th>Reason</th>
                                <th>Note</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Floor</th>
                                <th>Active</th>
                                <th>Actions</th>                              
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPreVisitors
                                .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
                                .map((previsitor, index) => (
                                    <tr key={index}>
                                        <td>{(currentPage * itemsPerPage) + index + 1}</td> 
                                        <td>{previsitor.name}</td>
                                        <td>{previsitor.company}</td>
                                        <td>{previsitor.department}</td>
                                        <td>{previsitor.contact}</td>
                                        <td>{previsitor.reason}</td>
                                        <td>{previsitor.note}</td>
                                        <td>{previsitor.date}</td>
                                        <td>{previsitor.time}</td>
                                        <td>{previsitor.floor}</td>
                                        <td>{previsitor.active ? "Yes" : "No"}</td>
                                        <td>
                                            <button className="visitor-register-button" onClick={() => handleView(previsitor)}>View</button>
                                        </td>
                                        <td>
                                            <button onClick={() => handlePreDelete(previsitor.id)} className="delete-button">Delete</button>
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
                            pageCount={Math.ceil(filteredPreVisitors.length / itemsPerPage)} // ใช้ filteredPreVisitors
                            onPageChange={handlePageClick}
                            containerClassName={"pagination-register"}
                            activeClassName={"active-register"}
                        />
                    </div>
                </div>
            )}

            {/* ใบอนุญาต (Modal) สำหรับการ View รายละเอียด */}
            {showPermit && selectedVisitor && (
                <div className="modal" onClick={handleModalOverlayClick}> {/* เพิ่ม onClick handler ตรงนี้ */}
                    <div className="modal-content">
                        {/* ใบอนุญาต */}
                        <button className="close-button" onClick={() => { setShowPermit(false); setSelectedVisitor(null); }}>
                            &times;
                        </button>
                        <div ref={permitRef} className="visitor-register-permit">
                            <h3>Visitor Permit</h3>
                            <p><strong>Name:</strong> {selectedVisitor.name}</p>
                            <p><strong>Company:</strong> {selectedVisitor.company}</p>
                            <p><strong>Department:</strong> {selectedVisitor.department}</p>
                            <p><strong>Contact:</strong> {selectedVisitor.contact}</p>
                            <p><strong>Reason:</strong> {selectedVisitor.reason}</p>
                            <p><strong>Note:</strong> {selectedVisitor.note}</p>
                            <p><strong>Date:</strong> {selectedVisitor.date}</p>
                            <p><strong>Time:</strong> {selectedVisitor.time}</p>
                            <p><strong>Floor:</strong> {selectedVisitor.floor}</p>
                            <div className="visitor-register-qr-code">
                                <QRCodeSVG
                                    value={`${selectedTab},${selectedVisitor.id}`}
                                    size={156}
                                    includeMargin={true}
                                />
                            </div>
                        </div>

                        {/* ปุ่มพิมพ์ใบอนุญาต */}
                        <div className="modal-footer"> {/* ใช้ modal-footer เหมือนเดิม แต่เปลี่ยนปุ่มให้เป็น print */}
                            <button onClick={handlePrint}>
                                Print Permit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitorRegister;