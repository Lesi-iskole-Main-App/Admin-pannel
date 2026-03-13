import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useVerifyPhoneOtpMutation,
  useResendVerifyOtpMutation,
  useForgotPasswordSendOtpMutation,
} from "../api/authApi";

const OTP_LENGTH = 6;

const OTPPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const flow = params.get("flow") || "signup"; // signup | forgot
  const phoneFromUrl = params.get("phone") || "";

  const [phone, setPhone] = useState(phoneFromUrl);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const inputsRef = useRef([]);

  const code = useMemo(() => digits.join(""), [digits]);

  const [verifyPhoneOtp, { isLoading: verifying }] =
    useVerifyPhoneOtpMutation();
  const [resendVerifyOtp, { isLoading: resending }] =
    useResendVerifyOtpMutation();
  const [forgotSendOtp, { isLoading: sendingForgotOtp }] =
    useForgotPasswordSendOtpMutation();

  const updateDigit = (index, value) => {
    const clean = String(value || "").replace(/\D/g, "");

    setError("");
    setMsg("");

    if (!clean) {
      setDigits((prev) => prev.map((item, i) => (i === index ? "" : item)));
      return;
    }

    const nextDigits = [...digits];
    let cursor = index;

    for (const char of clean.slice(0, OTP_LENGTH - index)) {
      nextDigits[cursor] = char;
      cursor += 1;
      if (cursor >= OTP_LENGTH) break;
    }

    setDigits(nextDigits);

    const nextIndex = Math.min(index + clean.length, OTP_LENGTH - 1);
    if (nextIndex < OTP_LENGTH) {
      inputsRef.current[nextIndex]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSendForgotOtp = async () => {
    setError("");
    setMsg("");

    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }

    try {
      await forgotSendOtp({ identifier: phone }).unwrap();
      setMsg("OTP sent. Check your WhatsApp and SMS.");
    } catch (err) {
      setError(err?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerify = async () => {
    setError("");
    setMsg("");

    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }

    if (code.length !== OTP_LENGTH) {
      setError("Enter 6-digit OTP");
      return;
    }

    try {
      if (flow === "signup") {
        await verifyPhoneOtp({
          phonenumber: phone,
          code,
        }).unwrap();

        navigate("/signin");
        return;
      }

      navigate(
        `/reset-password?identifier=${encodeURIComponent(
          phone
        )}&code=${encodeURIComponent(code)}`
      );
    } catch (err) {
      setError(err?.data?.message || "OTP verification failed");
    }
  };

  const handleResendSignupOtp = async () => {
    setError("");
    setMsg("");

    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }

    try {
      await resendVerifyOtp({ phonenumber: phone }).unwrap();
      setMsg("OTP resent. Check your WhatsApp and SMS.");
    } catch (err) {
      setError(err?.data?.message || "Resend failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">
          OTP Verification
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          Check your WhatsApp and SMS, then enter the verification code
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {msg && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
            {msg}
          </div>
        )}

        {flow === "forgot" && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={handleSendForgotOtp}
              disabled={sendingForgotOtp}
              className="w-full mt-3 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold disabled:opacity-60"
            >
              {sendingForgotOtp ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        <div className="flex justify-between gap-2 mb-6">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => updateDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold disabled:opacity-60"
        >
          {verifying ? "Verifying..." : "Verify"}
        </button>

        {flow === "signup" && (
          <button
            type="button"
            onClick={handleResendSignupOtp}
            disabled={resending}
            className="w-full mt-3 border border-blue-600 text-blue-700 py-2.5 rounded-lg hover:bg-blue-50 transition duration-200 font-semibold disabled:opacity-60"
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        )}
      </div>
    </div>
  );
};

export default OTPPage;