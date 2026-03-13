import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/auth`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    signUp: builder.mutation({
      query: (payload) => ({
        url: "/signup",
        method: "POST",
        body: payload,
      }),
    }),

    signIn: builder.mutation({
      query: (payload) => ({
        url: "/signin",
        method: "POST",
        body: payload,
      }),
    }),

    signOut: builder.mutation({
      query: () => ({
        url: "/signout",
        method: "POST",
      }),
    }),

    verifyPhoneOtp: builder.mutation({
      query: (payload) => ({
        url: "/whatsapp/verify-code",
        method: "POST",
        body: payload,
      }),
    }),

    resendVerifyOtp: builder.mutation({
      query: (payload) => ({
        url: "/whatsapp/send-code",
        method: "POST",
        body: payload,
      }),
    }),

    forgotPasswordSendOtp: builder.mutation({
      query: (payload) => ({
        url: "/forgot-password/send-otp",
        method: "POST",
        body: payload,
      }),
    }),

    forgotPasswordReset: builder.mutation({
      query: (payload) => ({
        url: "/forgot-password/reset",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useSignOutMutation,
  useVerifyPhoneOtpMutation,
  useResendVerifyOtpMutation,
  useForgotPasswordSendOtpMutation,
  useForgotPasswordResetMutation,
} = authApi;