import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const enrollApi = createApi({
  reducerPath: "enrollApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/enroll`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const reduxToken = getState()?.auth?.token;
      const storageToken = localStorage.getItem("token");
      const token = reduxToken || storageToken;

      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Enroll"],
  endpoints: (builder) => ({
    requestEnroll: builder.mutation({
      query: (body) => ({
        url: "/request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Enroll"],
    }),

    getMyEnrollRequests: builder.query({
      query: () => ({
        url: "/my",
        method: "GET",
      }),
      providesTags: ["Enroll"],
    }),

    getMyApprovedClasses: builder.query({
      query: () => ({
        url: "/my-approved-classes",
        method: "GET",
      }),
      providesTags: ["Enroll"],
    }),

    getPendingEnrollRequestOptions: builder.query({
      query: () => ({
        url: "/pending-options",
        method: "GET",
      }),
      providesTags: ["Enroll"],
    }),

    getPendingEnrollRequests: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();

        if (params.level) search.set("level", params.level);
        if (params.grade) search.set("grade", params.grade);
        if (params.stream) search.set("stream", params.stream);
        if (params.page) search.set("page", String(params.page));
        if (params.limit) search.set("limit", String(params.limit));

        const queryString = search.toString();

        return {
          url: queryString ? `/pending?${queryString}` : "/pending",
          method: "GET",
        };
      },
      providesTags: ["Enroll"],
    }),

    approveEnroll: builder.mutation({
      query: (id) => ({
        url: `/approve/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Enroll"],
    }),

    rejectEnroll: builder.mutation({
      query: (id) => ({
        url: `/reject/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Enroll"],
    }),
  }),
});

export const {
  useRequestEnrollMutation,
  useGetMyEnrollRequestsQuery,
  useGetMyApprovedClassesQuery,
  useGetPendingEnrollRequestOptionsQuery,
  useGetPendingEnrollRequestsQuery,
  useApproveEnrollMutation,
  useRejectEnrollMutation,
} = enrollApi;