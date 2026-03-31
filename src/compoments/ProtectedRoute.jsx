import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  const tokenFromRedux = useSelector((state) => state?.auth?.token);
  const tokenFromStorage = localStorage.getItem("token");

  const token = tokenFromRedux || tokenFromStorage;

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;