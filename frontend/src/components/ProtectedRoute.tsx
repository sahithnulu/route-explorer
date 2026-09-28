import React from 'react';
import { isAuthenticated } from '../App';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />
  }
  return children
}

export default ProtectedRoute;
