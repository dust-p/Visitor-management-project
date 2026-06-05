import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getCookie } from './cookie';  

const PrivateRoute = ({ element, allowedRoles, ...rest }) => {
    const auth = getAuth();
    const user = auth.currentUser;

    const role = getCookie('role'); 


    if (!user) {
        return <Navigate to="/login" />;
    }

    if (!allowedRoles.includes(role)) {
        return <Navigate to="/dashboard" />;  
    }

    return <Route {...rest} element={element} />;
};

export default PrivateRoute;
