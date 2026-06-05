import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { getCookie } from '../util/cookie';
import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react"; // หรือ import ตามที่ใช้อยู่
import axios from "axios";
import "../styles/Navbar.css";
import config from '../config/config';

const Navbar = () => {
    const navigate = useNavigate();
    const auth = getAuth();
    const [email, setEmail] = useState(null);
    const [role, setRole] = useState(null);
    const [uid, setUid] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showUserPermit, setShowUserPermit] = useState(false);
    const [userPermitData, setUserPermitData] = useState(null);
    const permitRef = useRef(null);
        useEffect(() => {
            const email = getCookie('email');
            const role = getCookie('role');
            const uid = getCookie('uid');
            if (role && role && uid ){
                setEmail(email);
                setRole(role);
                setUid(uid);
            }          
        }, []);

    if (!email || !role) {
            return <p>Loading...</p>;
        }
    const handleLogout = async () => {
        try {
            await signOut(auth);
            document.cookie = 'email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            navigate("/login");
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };


const handleShowPermit = () => {
  // เตรียมข้อมูลไว้แสดงใน modal
  const formattedDate = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
  const payload = {
    email,
    role,
    uid,
    date: formattedDate,
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    code: Date.now(),
  };
  setUserPermitData(payload);
  setShowUserPermit(true);  // แค่เปิด modal
};

const handleConfirmPrint = async () => {
  try {
    const res = await axios.post(`${config.API_BASE_URL}/user/permit/${uid}`, userPermitData);
    if (res.data.success) {
      printPermit();         // สั่งพิมพ์
      setShowUserPermit(false); // ปิด modal
    } else {
      alert("Failed to save permit");
    }
  } catch (err) {
    console.error(err);
    alert("Error saving permit");
  }
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
        <nav className="navbar">
            <div className="navbar-left">              
                    <>                       
                        <Link to="/dashboard" className="navbar-link">Dashboard</Link>
                    </>          
            </div>
            <div className="navbar-right">
              
                    <>               
                    <span className="role-text">Role: {role}</span> {/* แสดง Role ที่ผู้ใช้มี */}
                    <div className="dropdown-container">
                    <button
                        className="dropdown-toggle"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        menu {dropdownOpen ? '▲' : '▼'}
                    </button>
                    {dropdownOpen && (
                        <div className="dropdown-menu">
                            {role !== 'companyadmin' && (
                            <button className="btn-print" onClick={handleShowPermit}>
                                🖨️ Print Permit
                            </button>
                            )}
                            <button className="btn-logout" onClick={handleLogout}>
                            🔓 Logout
                            </button>
                        </div>
                        )}
                </div>
                    </>
            
            </div>
            {showUserPermit && (
  <div className="modal" onClick={() => setShowUserPermit(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={() => setShowUserPermit(false)}>X</button>
      <div ref={permitRef} className="visitor-register-permit">
        <h3>{role}</h3>
        <p></p>
        <p><strong>Email:</strong> {userPermitData.email}</p>
        <p></p>
        
        <div className="qr-code">
          <QRCodeSVG
            value={`userPermits,${userPermitData.uid},${userPermitData.code}`}
            size={200}
          />
        </div>
      </div>
      <div className="modal-footer">
        <button onClick={handleConfirmPrint}>Print</button>
      </div>
    </div>
  </div>
)}

        </nav>
    );
};

export default Navbar;


