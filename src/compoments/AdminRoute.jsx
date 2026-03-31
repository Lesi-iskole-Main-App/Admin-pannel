import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AdminRoute({ children }) {
  const location = useLocation();

  const tokenFromRedux = useSelector((s) => s?.auth?.token);
  const userFromRedux = useSelector((s) => s?.auth?.user);

  const tokenFromStorage = localStorage.getItem("token");
  const userFromStorageRaw = localStorage.getItem("user");

  const token = tokenFromRedux || tokenFromStorage;

  let userFromStorage = null;
  try {
    userFromStorage = userFromStorageRaw ? JSON.parse(userFromStorageRaw) : null;
  } catch {
    userFromStorage = null;
  }

  const user = userFromRedux || userFromStorage;

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}