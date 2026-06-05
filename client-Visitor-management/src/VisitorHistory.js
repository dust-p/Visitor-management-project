import React, {useCallback, useState, useEffect } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";
import { Table, TableHead, TableBody, TableRow, TableCell, MenuItem, Select, Pagination, TextField, InputLabel ,Button  } from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/VisitorHistory.css";
import { getCookie } from './util/cookie';
import config from './config/config';
import { format } from "date-fns";

const VisitorHistory = () => {
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [floors, setFloors] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [adminCompany, setadminCompany] = useState('');
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedContact, setSelectedContact] = useState("");
  const [selectedLogType, setSelectedLogType] = useState("inandout"); 
  const [selectedInOut, setSelectedInOut] = useState("all"); 
  const [selectedFloor, setSelectedFloor] = useState(""); 
  const [selectedNoGate, setSelectedNoGate] = useState(""); 
  const [filterType, setFilterType] = useState("visitorRegisters");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visitorData, setVisitorData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnOrder, setColumnOrder] = useState([]);
  const itemsPerPage = 10;
  
  const role = getCookie('role');
  const companyName = getCookie('company');

  const filteredVisitorData = visitorData.filter(visitor =>
  Object.values(visitor).some(value =>
    typeof value === 'string' &&
    value.toLowerCase().includes(searchTerm.toLowerCase())
  )
);
  useEffect(() => {
    if (filterType === "logs" && selectedLogType === "floor") {
      fetchFloors();
    }
  }, [filterType, selectedLogType]);

useEffect(() => {
    setUserRole(role);
  setadminCompany(companyName);
  if(role === "companyadmin"){
    setSelectedCompany(companyName)
  }
}, [companyName,role]);

const fetchVisitorData = useCallback(async (companyOverride) => {
  try {
    const params = {
      filterType,
      date: selectedDate ? formatDateToDDMMYYYY(selectedDate) : undefined,
      source: filterType === "logs" 
        ? "logs" 
        : filterType === "previsitorRegisters" 
        ? "previsitorRegisters" 
        : "visitorRegisters",
    };

    if (filterType === "logs") {
      if (selectedLogType === "inandout") {
        params.LogType = selectedLogType;
        if (selectedInOut) {   
          if (selectedInOut === "all") {
            params.gate = undefined;
          } else {
            params.gate = selectedInOut; // กำหนดค่าเฉพาะที่เลือก
          }
        }
        if (selectedNoGate) {  
          params.No = selectedNoGate;
        }
      } else if (selectedLogType === "floor") {
        params.LogType = selectedLogType;
        if (selectedFloor) {
          params.floor = selectedFloor;
        }
      } else {
        params.LogType = undefined;
      }
    } else {
      params.company = companyOverride || selectedCompany;
      params.department = selectedDepartment || undefined;
      params.contact = selectedContact || undefined;
    }

    const response = await axios.get(`${config.API_BASE_URL}/history/all`, { params });
    setVisitorData(response.data);
  } catch (error) {
    console.error("Error fetching visitor data:", error);
  }
}, [
  filterType,
  selectedDate,
  selectedLogType,
  selectedInOut,
  selectedNoGate,
  selectedFloor,
  selectedCompany,
  selectedDepartment,
  selectedContact
]);


  const formatDateToDDMMYYYY = (date) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchCompanies = async () => { 
    try {
      const response = await axios.get(`${config.API_BASE_URL}/companies`);
      setCompanies(response.data);
      
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchDepartments = useCallback(async (company) => {
  setSelectedCompany(company);
  setSelectedDepartment(""); 
  setSelectedContact("");
  try {
    const res = await axios.get(`${config.API_BASE_URL}/departments?company=${company}`);
    setDepartments(res.data);
  } catch (err) {
    console.error("Error:", err);
    setDepartments([]);
  }
}, []);


  const fetchContacts = async (department) => {
  setSelectedDepartment(department);
  setSelectedContact("");
  try {
    const res = await axios.get(`${config.API_BASE_URL}/contacts?company=${selectedCompany}&department=${department}`);
    setContacts(res.data);
  } catch (err) {
    console.error("Error:", err);
    setContacts([]);
  }
};


  const fetchFloors = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/management/floors`);
      setFloors(response.data);
    } catch (error) {
      console.error("Error fetching floors:", error);
    }
  };
useEffect(() => {
  if (role === 'companyadmin') {
    setSelectedCompany(companyName)
    fetchVisitorData(companyName);  // ส่ง companyName ตรง ๆ ถ้าฟังก์ชันรองรับ
  }
  else{fetchVisitorData();}
  fetchCompanies();
}, [fetchVisitorData,role,companyName]);


// when filterType → reset all filters to defaults
useEffect(() => {
  if(filterType === "visitorRegisters"){
    setColumnOrder(["name", "date", "time", "floor", "company", "department","contact", "reason", "note","email"]);
     if(userRole === "companyadmin" ){
      setSelectedCompany(adminCompany);
     }
     else{
    setSelectedCompany("");
     }
    setSelectedDepartment("");
    setSelectedContact("");
    setSelectedLogType("inandout");
    setSelectedInOut("all");
    setSelectedFloor("");
    setSelectedNoGate("");
  }else if(filterType === "previsitorRegisters"){
    setColumnOrder(["name", "date", "time", "floor", "company", "department","contact", "reason", "note","recorddate","recordtime","email"]);
     if(userRole === "companyadmin" ){
      setSelectedCompany(adminCompany);
     }
     else{
    setSelectedCompany("");
     }
    setSelectedDepartment("");
    setSelectedContact("");
    setSelectedLogType("inandout");
    setSelectedInOut("all");
    setSelectedFloor("");
    setSelectedNoGate("");
  } else if(filterType === "logs"){   
    if( selectedLogType === "inandout"){
    setColumnOrder(["name", "date", "scanTime", "gate","Nogate","category"]);
     if(userRole === "companyadmin" ){
      setSelectedCompany(adminCompany);
     }
     else{
    setSelectedCompany("");
     }
    setSelectedDepartment("");
    setSelectedContact("");
    setSelectedFloor("");
    }
     if(selectedLogType === "floor"){
      setColumnOrder(["name", "date", "scanTime", "floor","category"]);
       if(userRole === "companyadmin" ){
      setSelectedCompany(adminCompany);
     }
     else{
    setSelectedCompany("");
     }
      setSelectedDepartment("");
      setSelectedContact("");
      setSelectedNoGate("");   
    }
  }
}, [filterType,selectedLogType,userRole,adminCompany]);

  
  const getFileName = () => {
    let fileName = filterType; // visitorRegisters, previsitorRegisters, logs

    if (selectedCompany) {
        fileName += ` ${selectedCompany}`;
    }
    if (selectedDepartment) {
        fileName += ` ${selectedDepartment}`;
    }
    if (selectedContact) {
        fileName += ` ${selectedContact}`;
    }

    if (filterType === "logs") {
        fileName += ` ${selectedLogType}`;
        if (selectedLogType === "floor" && selectedFloor) {
            fileName += ` ${selectedFloor}`;
        }
        if (selectedLogType === "inandout" && selectedInOut) {
            fileName += ` ${selectedInOut}`;
        }
    }

    return `${fileName} ${formatDateToDDMMYYYY(selectedDate)}.csv`;
};


  return (
    <div className="visitor-history-container">
      <h2>Visitor History</h2>    
      <div className="filter-section">
  {/* หัวข้อมูล Type */}
  <div className="filter-label">
    <InputLabel>Type</InputLabel>
    
    <Select
    type="text"
    value={filterType}
    onChange={(e) => setFilterType(e.target.value)}
    className="filter-select"
>

{/* 2 ตัวแรกทุก role มีเหมือนกัน */}
<MenuItem value="visitorRegisters">Visitor Registers</MenuItem>
<MenuItem value="previsitorRegisters">PreVisitor Registers</MenuItem>

{/* เฉพาะ userRole ไม่ใช่ companyadmin */}
{userRole !== "companyadmin" && (
  <MenuItem value="logs">Logs</MenuItem>
)}
</Select>
  </div>

  {/* หัวข้อมูล Date */}
  
  <div className="filter-label">
      <InputLabel>Select Date</InputLabel>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        disabled={userRole === "staff"}
        dateFormat="d/M/yyyy" // ✅ ระบุรูปแบบที่ต้องการ
        customInput={
          <TextField
            fullWidth
            variant="outlined"
            value={selectedDate ? format(selectedDate, "d/M/yyyy") : ""}
            readOnly // ป้องกันไม่ให้ผู้ใช้พิมพ์เอง
          />
        }
      />
    </div>

  {/* หัวข้อมูล Company, Department, Contact */}
  {filterType !== "logs" ? (
    <>
      <div className="filter-label">
        <InputLabel>Company</InputLabel>
        <Select
          value={selectedCompany}
          onChange={(e) => fetchDepartments(e.target.value)}
          className="filter-select"
          disabled={userRole === "companyadmin"}
        >
          <MenuItem value="">Select Company</MenuItem>
          {companies.map((company) => (
            <MenuItem key={company.id} value={company.id}>
              {company.name}
            </MenuItem>
          ))}
        </Select>
      </div>

      <div className="filter-label">
        <InputLabel>Department</InputLabel>
        <Select
          value={selectedDepartment}
          onChange={(e) => fetchContacts(e.target.value)}
          className="filter-select"
        >
          <MenuItem value="">Select Department</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </div>

      <div className="filter-label">
        <InputLabel>Contact</InputLabel>
        <Select
          value={selectedContact}
          onChange={(e) => setSelectedContact(e.target.value)}
          className="filter-select"
        >
          <MenuItem value="">Select Contact</MenuItem>
          {contacts.map((ct) => (
            <MenuItem key={ct} value={ct}>
              {ct}
            </MenuItem>
          ))}
        </Select>
      </div>
    </>
  ) : (
    <>
      <div className="filter-label">
        <InputLabel>Gate</InputLabel>
        <Select
          value={selectedLogType}
          onChange={(e) => setSelectedLogType(e.target.value)}
          className="filter-select"
        > 
          <MenuItem value="inandout">In and Out</MenuItem>
          <MenuItem value="floor">Floor</MenuItem>
        </Select>
      </div>

      {selectedLogType === "inandout" && (
        <div className="filter-label">
          <InputLabel>In and Out</InputLabel>
          <Select
            value={selectedInOut}
            onChange={(e) => setSelectedInOut(e.target.value)}
            className="filter-select"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="in">In</MenuItem>
            <MenuItem value="out">Out</MenuItem>
          </Select>
        </div>
      )}    
      {selectedLogType === "inandout" && (
        <div className="filter-label">
          <InputLabel>No</InputLabel>
          <Select
            value={selectedNoGate}
            onChange={(e) => setSelectedNoGate(e.target.value)}
            className="filter-select"
          >
            <MenuItem value="">Select Nogate</MenuItem>
            <MenuItem value="1">1</MenuItem>
            <MenuItem value="2">2</MenuItem>
            <MenuItem value="3">3</MenuItem>
            <MenuItem value="4">4</MenuItem>
          </Select>
        </div>
        

      )}

      {selectedLogType === "floor" && (
        <div className="filter-label">
          <InputLabel>Floor</InputLabel>
          <Select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="filter-select"
          >
            {floors.map((floor) => (
              <MenuItem key={floor.id} value={floor.id}>
                {floor.id}
              </MenuItem>
            ))}
          </Select>
        </div>
      )}
    </>
  )}
</div>
          <input
  type="text"
  placeholder="Search by name..."
  value={searchTerm}
  onChange={(e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // รีเซตหน้าเมื่อเปลี่ยนคำค้น
  }}
  className="search-input"
  />



<Table className="visitor-table">
  <TableHead>
    <TableRow>
      <TableCell>#</TableCell> {/* คอลัมน์เลขแถว */}
      {columnOrder.map((key) => (
        <TableCell key={key}>{key}</TableCell>
      ))}
    </TableRow>
  </TableHead>
  <TableBody>
    {filteredVisitorData.length > 0 ? (
      filteredVisitorData
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        .map((visitor, index) => (
          <TableRow key={index}>
            <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell> 
            {columnOrder.map((key, i) => (
              <TableCell key={i}>{visitor[key]}</TableCell> 
            ))}
          </TableRow>
        ))
    ) : (
      <TableRow>
        <TableCell colSpan={columnOrder.length + 1} align="center">
          ไม่มีข้อมูล
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>

<Pagination
  count={Math.ceil(filteredVisitorData.length / itemsPerPage)}
  page={currentPage}
  onChange={(e, value) => setCurrentPage(value)}
/>
      
{userRole !== "staff" && (
      <div className="export-section">
      
    <Button
      variant="contained"
      color="primary"
      onClick={() => document.getElementById("csv-download").click()}
    >
      Export to CSV
    </Button>
      
    <CSVLink
      data={visitorData}
      filename={getFileName()}
      className="hidden-link"
      id="csv-download"
    />
       </div>
      )}
    </div>
  );
};

export default VisitorHistory;
