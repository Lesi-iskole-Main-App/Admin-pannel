import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import signimage from "../assets/signimage.png";
import { useSignUpMutation } from "../api/authApi";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [signUp, { isLoading }] = useSignUpMutation();

  const [form, setForm] = useState({
    name: "",
    whatsappnumber: "",
    password: "",
    confirmPassword: "",
    role: "admin",
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

    if (String(form.password) !== String(form.confirmPassword)) {
      setError("Passwords do not match");
      return;
    }

    try {
      const payload = {
        name: form.name,
        whatsappnumber: form.whatsappnumber,
        password: form.password,
        role: "admin",
      };

      const res = await signUp(payload).unwrap();
      const phone = res?.user?.phonenumber || form.whatsappnumber;

      navigate(`/otp?flow=signup&phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setError(err?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      <div className="hidden md:flex w-full md:w-1/2">
        <img
          src={signimage}
          alt="Sign up illustration"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col justify-center items-center bg-white w-full md:w-1/2 p-10">
        <h2 className="text-3xl font-bold text-blue-800 mb-2">Admin Panel</h2>
        <p className="text-sm text-gray-500 mb-8">Create your admin account</p>

        {error && (
          <div className="w-full max-w-sm mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form className="w-full max-w-sm" onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              type="text"
              placeholder="Enter your name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">
              WhatsApp Number
            </label>
            <input
              name="whatsappnumber"
              value={form.whatsappnumber}
              onChange={onChange}
              type="tel"
              placeholder="Enter your WhatsApp number"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">Password</label>
            <input
              name="password"
              value={form.password}
              onChange={onChange}
              type="password"
              placeholder="Enter your password"
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
              placeholder="Confirm your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-60"
          >
            {isLoading ? "Signing Up..." : "Sign Up"}
          </button>

          <p className="text-sm text-gray-600 mt-4 text-center">
            Have an account?{" "}
            <Link
              to="/signin"
              className="text-blue-700 font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;