import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, set,remove } from 'firebase/database';
import './styles/PreRegistration.css';
import ReactPaginate from "react-paginate";
import { getCookie } from './util/cookie';
const PreRegistration = () => {
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [reasons, setReasons] = useState([]);
    const [availableFloors, setAvailableFloors] = useState([]);
    const [visitorName, setVisitorName] = useState('');
    const [selectedCompany, setSelectedCompany] = useState({ name: '', id: '' });
    const [selectedReason, setSelectedReason] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedContact, setSelectedContact] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');
    const [note, setNote] = useState('');
    const [todayVisitors, setTodayVisitors] = useState([]);
    const [selectedTab, setSelectedTab] = useState('register');
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
    const [searchName, ] = useState('');
    const [searchTerm, setSearchTerm] = useState("");
    const email = getCookie('email'); 
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}/${String(currentDate.getMonth() + 1)}/${currentDate.getFullYear()}`;
    const itemsPerPage = 5; 
 
    useEffect(() => {
        const db = getDatabase();
        const companiesRef = ref(db, 'contactOptions/company');
        
        onValue(companiesRef, (snapshot) => {
            const companiesData = snapshot.val();
            if (companiesData) {
                const companiesList = Object.keys(companiesData).map(companyKey => {
                const company = companiesData[companyKey];
                return {
                    name: company.name,
                    id: companyKey,
                    floors: company.floors ? Object.keys(company.floors) : []
                };
                });
                setCompanies(companiesList);

                const role = getCookie('role');    
                const companyName = getCookie('company');
                if (role === 'companyadmin') {
                setIsCompanyAdmin(true);
                const foundCompany = companiesList.find(c => c.name === companyName);
                if (foundCompany) {
                    setSelectedCompany({ name: foundCompany.name, id: foundCompany.id });
                }
                }
            }
            });
    }, []);
    
    
    useEffect(() => {
        const db = getDatabase();
        const reasonsRef = ref(db, 'contactOptions/reasons');
        onValue(reasonsRef, (snapshot) => {
            const reasonsData = snapshot.val();
            if (reasonsData) {
                const reasonsList = Object.values(reasonsData).map(item => item.reason);
                setReasons(reasonsList);
            }
        });
    }, []);

    useEffect(() => {
    if (selectedCompany && selectedFloor) {
        const db = getDatabase();
        const departmentsRef = ref(
            db,
            `contactOptions/company/${selectedCompany.id}/floors/${selectedFloor}/departments`
        );

        onValue(departmentsRef, (snapshot) => {
            const departmentsData = snapshot.val();
            if (departmentsData) {
                const departmentsList = Object.keys(departmentsData).map(departmentKey => {
                    return departmentsData[departmentKey].name;
                });
                setDepartments(departmentsList);
            } else {
                setDepartments([]);
            }
            setContacts([]);
        });
    }
}, [selectedCompany, selectedFloor]);



    useEffect(() => {
        if (selectedCompany && selectedDepartment && selectedFloor) {
            const db = getDatabase();
            const contactsRef = ref(
                db,
                `contactOptions/company/${selectedCompany.id}/floors/${selectedFloor}/departments/${selectedDepartment}/contacts`
            );

            onValue(contactsRef, (snapshot) => {
                const contactsData = snapshot.val();
                setContacts(
                contactsData ? Object.keys(contactsData).map((key) => contactsData[key].name) : []
                );
            });
            }
    }, [selectedCompany, selectedDepartment,selectedFloor]);

useEffect(() => {
    const db = getDatabase();
    const previsitorsRef = ref(db, 'previsitorRegisters');
    onValue(previsitorsRef, (snapshot) => {
        const visitorsData = snapshot.val();
        if (visitorsData) {
            const today = [];
            const role = getCookie('role');

            Object.keys(visitorsData).forEach(key => {
            const visitor = visitorsData[key];
            const [day, month, year] = visitor.date.split('/');
                const visitorDate = new Date(`${year}-${month}-${day}`);
         if ((role === 'admin' || visitor.email === email) &&
        visitorDate >= new Date().setHours(0, 0, 0, 0)) {
        today.push({ ...visitor, key });
    }

      });

            setTodayVisitors(today.reverse());
        }
    });
}, [email]);

    const filteredVisitors = todayVisitors.filter(visitor =>
    visitor.name.toLowerCase().includes(searchName.toLowerCase())
    );

    const handlePageClick = (data) => {
        setCurrentPage(data.selected);
    };

    const handleFloorChange = (e) => {
    setSelectedFloor(e.target.value);
    };

    const handleCompanyChange = (e) => {
    const company = companies.find(comp => comp.name === e.target.value);
    setSelectedCompany(company || { name: "", id: "" });

    if (company && company.floors) {
        setAvailableFloors(company.floors); // สมมติว่า company.floors เป็น array เช่น ["1", "2"]
    } else {
        setAvailableFloors([]);
    }

    // reset floor และ department เมื่อเปลี่ยน company
    setSelectedFloor('');
    setSelectedDepartment('');
    setContacts([]);
};

    const handleRegister = () => {
        const db = getDatabase();
        const registerRef = ref(db, 'previsitorRegisters');
        const newRegisterRef = push(registerRef);
        const formattedselectedDate = selectedDate
        ? `${new Date(selectedDate).getDate()}/${new Date(selectedDate).getMonth() + 1}/${new Date(selectedDate).getFullYear()}`
        : '';
        const formattedselectedTime = selectedTime ? `${selectedTime}:00` : '';
        const currentTime = new Date();
        const formattedTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;
        const newVisitor = {
                name: visitorName,
                company: selectedCompany.name,
                department: selectedDepartment,
                contact: selectedContact,
                reason: selectedReason,
                note: note,
                date: formattedselectedDate,
                time: formattedselectedTime,
                floor: selectedFloor, // ต้องใช้ state ใหม่แทน
                email: email,
                recorddate: formattedDate,
                recordtime: formattedTime,
                active: true
        };
    
        set(newRegisterRef, newVisitor)
            .then(() => {
                alert('Registration Successful!');
                if(isCompanyAdmin){
                setVisitorName('');              
                setSelectedDepartment('');
                setSelectedContact('');
                setSelectedReason('');
                setNote('');
                setSelectedDate('');
                setSelectedTime('');
            }
            else{
                setVisitorName('');              
                setSelectedCompany('');
                setSelectedDepartment('');
                setSelectedContact('');
                setSelectedReason('');
                setNote('');
                setSelectedDate('');
                setSelectedTime('');
            }
            })
            .catch((error) => {
                console.error('Error writing new visitor data: ', error);
            });
    };


    const handleDelete = (visitorId) => {
        const db = getDatabase();
        const visitorRef = ref(db, `previsitorRegisters/${visitorId}`);
    
        // ลบข้อมูลจาก Firebase
        remove(visitorRef)
            .then(() => {
                alert('Visitor deleted successfully');
            })
            .catch((error) => {
                console.error('Error deleting visitor data: ', error);
            });
    };  
    
    const visibleVisitors = filteredVisitors
  .filter((visitor) =>
    [visitor.name, visitor.company, visitor.department, visitor.contact]
      .some((field) =>
        field?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  )
  .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <div className="visitor-register-container">
            <h1 className="visitor-register-form">Pre-Registration</h1>
            <div className="visitor-register-button-group">
                <button className="visitor-register-button" onClick={() => setSelectedTab('register')}>Pre-Registration</button>
                <button className="visitor-register-button" onClick={() => setSelectedTab('view')}>Pre-Visitors Registered Today</button>
            </div>
    
            {selectedTab === 'register' && (
                <div>                  
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
                            <select
                                value={selectedCompany.name}
                                onChange={handleCompanyChange}
                                disabled={isCompanyAdmin} 
                                required
                                >
                                <option value="" disabled>Select Company</option>
                                    {companies.map((company, index) => (
                                    (!isCompanyAdmin || company.name === selectedCompany.name) && ( 
                                <option key={index} value={company.name}>{company.name}</option>
                                        )
                                    ))}
                            </select>
                        </label>
                                   <label>
                                        Floor:
                                        <select
                                            value={selectedFloor}
                                            onChange={handleFloorChange}
                                            required
                                        >
                                            <option value="" disabled>Select Floor</option>
                                            {availableFloors.map((floor, index) => (
                                                <option key={index} value={floor}>{floor}</option>
                                            ))}
                                        </select>
                                    </label>     
                        <label>
                            Department (Optional):
                            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                                <option value=""disabled>Select Department</option>
                                {departments.map((department, index) => (
                                    <option key={index} value={department}>{department}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Contact (Optional):
                            <select value={selectedContact} onChange={(e) => setSelectedContact(e.target.value)}>
                                <option value=""disabled>Select Contact</option>
                                {contacts.map((contact, index) => (
                                    <option key={index} value={contact}>{contact}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Reason:
                            <select 
                                value={selectedReason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                required
                            >
                                <option value=""disabled>Select Reason</option>
                                {reasons.map((reason, index) => (
                                    <option key={index} value={reason}>{reason}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Note (Optional):
                            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
                        </label>
                        {/* Date Picker */}
            <label>
                Date:
                <input
                    type="date"
                    value={selectedDate }
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                />
            </label>
            {/* Time Picker */}
            <label>
                Time:
                <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                />
            </label>
                        <button className="visitor-register-button" type="submit">Register</button>
                    </form>
                </div>
            )}

            {selectedTab === 'view' && (
                <div>
                    <h3 className="visitor-register-form">PreVisitors Registered</h3>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, company, department..."
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
                                <th>Contact</th>
                                <th>Reason</th>
                                <th>Note</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Floor</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleVisitors.map((visitor, index) => (
                                <tr key={visitor.key || index}>
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
                                    <td>
                                         <button onClick={() => handleDelete(visitor.key)} className="delete-button">Delete</button>
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
                            pageCount={Math.ceil(todayVisitors.length / itemsPerPage)}
                            onPageChange={handlePageClick}
                            containerClassName={"pagination-register"}
                            activeClassName={"active-register"}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreRegistration;
