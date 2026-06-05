import React ,{ useEffect, useState }from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Dashboard.css';
import { getCookie } from './util/cookie';
import axios from "axios";
import config from './config/config';
const Dashboard = () => {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState('');
    const [scanData, setScanData] = useState(null);
    const [selectedDate, ] = useState(getToday());

     useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/logs/scan-count?date=${selectedDate}`
        );
        setScanData(response.data);
      } catch (error) {
        console.error('Error fetching scan count:', error);
      }
    };

    fetchData();
  }, [selectedDate]);

  function getToday() {
    const today = new Date();
    const day = String(today.getDate());
    const month = String(today.getMonth() + 1);
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }
    useEffect(() => {
        const role = getCookie('role'); // ดึง role จาก cookie
        setUserRole(role);
    }, []);
    const goToUserManagement = () => {
        navigate('/UserManagement');
    };

    const goToContactManagement = () => {
        navigate('/ContactManagement');
    };

    const goToVisitorRegister = () => {
        navigate('/VisitorRegister');
    };

    const goToPreRegistration = () => {
        navigate('/PreRegistration');
    };

    const goToVisitorHistory = () => {
        navigate('/VisitorHistory');
    };
    const goToEmpolyee = () => {
        navigate('/Employee');
    };
    return (
        <>
        <div className="dashboard-container" >
  <nav style={{ flex: 1 }}>
    <h1>Dashboard</h1>
    <ul>
      {(userRole === "admin") && (
        <li>
          <button onClick={goToUserManagement}>User Management</button>
        </li>
      )}
      {(userRole === "admin" || userRole === "companyadmin") && (
        <li>
          <button onClick={goToContactManagement}>Contact Management</button>
        </li>
      )}
      {(userRole === "admin" || userRole === "staff") && (
        <li>
          <button onClick={goToVisitorRegister}>Visitor Register</button>
        </li>
      )}
      {(userRole === "admin" || userRole === "companyadmin") && (
        <li>
          <button onClick={goToPreRegistration}>Pre Visitor Register</button>
        </li>
      )}
      {(userRole === "admin" || userRole === "companyadmin" || userRole === "staff") && (
        <li>
          <button onClick={goToVisitorHistory}>Visitor History</button>
        </li>
      )}
      {(userRole === "admin" || userRole === "staff" ) && (
        <li>
          <button onClick={goToEmpolyee}>Empolyee permit</button>
        </li>
      )}
    </ul>
  </nav>
</div> 
        {(userRole === "admin" || userRole === "staff") && (     <div className="scan-box" >
                <h2>การสแกน</h2>
                {scanData ? (
                <div >
                    <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><strong>วันที่:</strong> {scanData.date}</p>
                    <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>เข้า (IN): {scanData.in} ครั้ง  ออก (OUT): {scanData.out} ครั้ง</p>
                </div>
                ) : (
                <p>กำลังโหลดข้อมูล...</p>
                )}
              </div>
              )}
    </>    
    );
};

export default Dashboard;

