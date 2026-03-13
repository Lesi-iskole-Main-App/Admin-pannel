import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForgotPasswordResetMutation } from "../api/authApi";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const identifierFromUrl = params.get("identifier") || "";
  const codeFromUrl = params.get("code") || "";

  const [resetPassword, { isLoading }] = useForgotPasswordResetMutation();

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const onChange = (e) => {
    setError("");
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await resetPassword({
        identifier: identifierFromUrl,
        code: codeFromUrl,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      }).unwrap();

      navigate("/home");
    } catch (err) {
      setError(err?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">
          Reset Password
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Set a new password
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">
              New Password
            </label>
            <input
              name="newPassword"
              value={form.newPassword}
              onChange={onChange}
              type="password"
              placeholder="Enter new password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm mb-2">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              type="password"
              placeholder="Confirm new password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-blue-600 disabled:opacity-60 text-white py-2.5 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
          >
            {isLoading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}