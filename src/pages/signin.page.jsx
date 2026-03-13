import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import signimage from "../assets/signimage.png";
import { useSignInMutation } from "../api/authApi";
import { setCredentials } from "../api/features/authSlice";

const SignInPage = () => {
  const [whatsappnumber, setWhatsappnumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [signIn, { isLoading }] = useSignInMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || location.state?.from || "/home";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await signIn({ whatsappnumber, password }).unwrap();
      dispatch(setCredentials({ token: res?.token, user: res?.user }));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.data?.message || "Sign in failed");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      <div className="hidden md:flex w-full md:w-1/2">
        <img
          src={signimage}
          alt="Sign in illustration"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col justify-center items-center bg-white w-full md:w-1/2 p-10">
        <h2 className="text-3xl font-bold text-blue-800 mb-2">Admin Panel</h2>
        <p className="text-sm text-gray-500 mb-8">Sign in to your account</p>

        {error && (
          <div className="w-full max-w-sm mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form className="w-full max-w-sm" onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">
              WhatsApp Number
            </label>
            <input
              value={whatsappnumber}
              onChange={(e) => setWhatsappnumber(e.target.value)}
              type="tel"
              placeholder="07XXXXXXXX"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm mb-2">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-60"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

          <p className="text-sm text-gray-600 mt-4 text-center">
            No account?{" "}
            <Link to="/" className="text-blue-700 font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignInPage;