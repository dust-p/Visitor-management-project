import React, {useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import './styles/UserManagement.css';
import ReactPaginate from 'react-paginate'; // นำเข้า react-paginate
import config from './config/config';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('staff');
    const [company, setcompany] = useState('');
    const [editUserId, setEditUserId] = useState(null);
    const [pageNumber, setPageNumber] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All')
    const [companieUser, setCompanieUser] = useState([])
    const [showModal, setShowModal] = useState(false);
    const [, setSelectedUser] = useState(null);
    const [selectedcompanieUser, setselectedCompanieUser] = useState('')
    const [activeTab, setActiveTab] = useState('addUser');
    const [originalUsers, setOriginalUsers] = useState([]);
    const usersPerPage = 5;
    
    
    

    useEffect(() => {
        if (role === 'companyadmin') {
            fetchCompanies();
        }
    }, [role]);
    
    const fetchUsers = useCallback(async () => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/users`);
    const data = response.data;
    const userArray = Object.keys(data).map(key => ({ uid: key, ...data[key] }));

    setOriginalUsers(userArray);

    let filteredUsers = userArray.filter(user => {
      const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = user.role?.toLowerCase().includes(searchTerm.toLowerCase());
      return emailMatch || roleMatch;
    });

    setTotalUsers(filteredUsers.length);
    setUsers(filteredUsers.slice(pageNumber * usersPerPage, (pageNumber + 1) * usersPerPage));
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}, [searchTerm, pageNumber, usersPerPage]);
     
    useEffect(() => {
        fetchUsers();
    }, [searchTerm, pageNumber,fetchUsers]);
    
    const fetchCompanies = async () => {
        try {
          const response = await axios.get(`${config.API_BASE_URL}/users/companies`);
          setCompanieUser(response.data);
        } catch (error) {
          console.error("Error fetching companies:", error);
        }
      };

      const handlePageChange = ({ selected }) => {
        setPageNumber(selected); 
    };
    
    const addUser = async () => {
        try {
            await axios.post(`${config.API_BASE_URL}/register`, { 
                email, 
                password, 
                role,
                company: role === 'companyadmin' ? selectedcompanieUser : null 
            });
    
            fetchUsers();
            setEmail('');
            setPassword('');
            setRole('staff');
            setselectedCompanieUser('');
    
            alert('User registered successfully!');
        } catch (error) {
            console.error('Error adding user:', error);
        }    
    };


    const deleteUser = async (uid) => {
        try {
            await axios.delete(`${config.API_BASE_URL}/users/${uid}`);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const editUser = (user) => {
        setSelectedUser(user);  // เซ็ตผู้ใช้ที่ต้องการแก้ไข
        setEmail(user.email);
        setPassword(user.password);  // ถ้ามีฟิลด์ password
        setRole(user.role);
        setcompany(user.company); 
        setShowModal(true);
        setEditUserId(user.uid)
        
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const handleSearch = () => {
        setPageNumber(0); 
    
        let filteredUsers = originalUsers.filter(user => {
            const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
            
            const roleMatch = selectedRole && selectedRole !== 'All' ? user.role === selectedRole : true;
    
            return emailMatch && roleMatch;
        });
    
        setTotalUsers(filteredUsers.length); 
        setUsers(filteredUsers.slice(pageNumber * usersPerPage, (pageNumber + 1) * usersPerPage)); 
    };
    
    

        
    const updateUser = async () => {
        if (role === 'companyadmin' && !company) {
            alert('Please select a company for Company Admin role');
            return;
        }
        try {
            await axios.put(`${config.API_BASE_URL}/users/${editUserId}`, { password, role ,company});
            fetchUsers();
            setEditUserId(null);
            setEmail('');
            setPassword('');
            setRole('staff');
            setcompany('');
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleEditModalOverlayClick = (event) => {
        if (event.target.className === 'modal') {
          setShowModal(false);
        }
      };
    
    return (
        <div>
            <div className="user-management-container">
                <h1>User Management</h1>
                <div className="tab-options">
    <span 
      className={`tab-option ${activeTab === 'addUser' ? 'active' : ''}`} 
      onClick={() => setActiveTab('addUser')}
    >
      Add User
    </span>
    <span 
      className={`tab-option ${activeTab === 'userList' ? 'active' : ''}`} 
      onClick={() => setActiveTab('userList')}
    >
      User List
    </span>
  </div>
                {activeTab === 'addUser' ? (
                    <div><h2>Add User</h2>
                <div className="form-container">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                    <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)} 
                    >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="companyadmin">Company Admin</option>
                    </select>
                    {role === 'companyadmin' && (
                    <select
                        value={selectedcompanieUser}
                        onChange={(e) => setselectedCompanieUser(e.target.value)}
                        className="modal-input"
                        required
                        >
                        <option value="">Select Company</option>
                            {companieUser.map((companieUser) => (
                        <option key={companieUser.id} value={companieUser.name}>
                            {companieUser.name}
                        </option>
                     ))}
                    </select>
                    )}
                        <button onClick={addUser}>Add User</button>
                    
                </div></div>
            ) : ( 
                <div>              
                <h2>User List</h2>
                <div className="form-container">
                    <input 
                        type="email" 
                        placeholder="Search by email" 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPageNumber(0); }} 
                    />
                    <select 
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value) } 
                    >
                        <option value="All">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="companyadmin">Company Admin</option>
                    </select>
                    <button onClick={handleSearch}>Search</button>
                </div>
                <ul>
                    {users.map(user => (
                        <li key={user.uid}>
                            {user.email} ({user.role})
                            <div>
                                <button onClick={() => editUser(user)}>Edit</button>
                                <button 
                                    className="delete-button" 
                                    onClick={() => deleteUser(user.uid)}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>               
                </div>
            
            )}
            </div>

            
            {showModal && (
                
                <div className="modal" onClick={handleEditModalOverlayClick}>
                    <div className="modal-content">
                        <h3>Edit User</h3>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                            <option value="companyadmin">Company Admin</option>
                        </select>
                        {role === 'companyadmin' && (
                    <select
                        value={company}
                        onChange={(e) => setcompany(e.target.value)}
                        className="modal-input"
                        required
                        >
                        <option value="">Select Company</option>
                            {companieUser.map((companieUser) => (
                        <option key={companieUser.id} value={companieUser.name}>
                            {companieUser.name}
                        </option>
                     ))}
                    </select>
                    )}
                        <button onClick={updateUser}>Update User</button>
                        <button onClick={handleCloseModal}>Close</button>
                    </div>
                </div>
            )}
            {activeTab === 'userList' && (
  <div className="pagination-container">
    <ReactPaginate
      pageCount={Math.max(1, Math.ceil(totalUsers / usersPerPage))}
      pageRangeDisplayed={2}
      marginPagesDisplayed={1}
      onPageChange={handlePageChange}
      containerClassName="pagination-register"
      activeClassName="active-register"
      previousClassName="previous"
      nextClassName="next"
      disabledClassName="disabled"
    />
  </div>
)}
        </div>
    );
    
    
};

export default UserManagement;
