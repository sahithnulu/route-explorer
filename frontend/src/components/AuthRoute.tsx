import React from 'react';
import { isAuthenticated } from '../App';
import { Navigate } from 'react-router-dom';

const AuthRoute = ({ children }: { children: React.ReactElement }) => {
  if (isAuthenticated()) {  
    return <Navigate to="/" />  
  }
  return children  
}

export default AuthRoute;
