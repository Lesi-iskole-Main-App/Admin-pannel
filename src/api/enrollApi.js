import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// Private image responses are blobs, so keep them outside RTK Query's JSON cache.
export const fetchEnrollmentPhotoBlob = async (enrollId, kind, token, signal) => {
  if (!["application", "packing"].includes(kind)) throw new Error("Invalid photo type");
  const response = await fetch(
    `${BACKEND_URL}/api/enroll/photo-content/${encodeURIComponent(enrollId)}/${kind}`,
    {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal,
    }
  );
  if (!response.ok) throw new Error(`Photo unavailable (${response.status})`);
  const blob = await response.blob();
  if (!["image/jpeg", "image/png"].includes(blob.type)) throw new Error("Invalid image type");
  return blob;
};

export const enrollApi = createApi({
  reducerPath: "enrollApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/enroll`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Enroll", "PendingEnrollRequests", "PendingEnrollRequestOptions"],
  endpoints: (builder) => ({
    requestEnroll: builder.mutation({
      query: (payload) => ({
        url: "/request",
        method: "POST",
        body: payload,
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
      providesTags: ["PendingEnrollRequestOptions"],
    }),

    getPendingEnrollRequests: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();

        if (params.grade) search.set("grade", params.grade);
        if (params.subject) search.set("subject", params.subject);
        if (params.phonenumber) search.set("phonenumber", params.phonenumber);
        if (params.batchNumber) search.set("batchNumber", params.batchNumber);
        if (params.page) search.set("page", String(params.page));
        if (params.limit) search.set("limit", String(params.limit));

        const queryString = search.toString();

        return {
          url: queryString ? `/pending?${queryString}` : "/pending",
          method: "GET",
        };
      },
      providesTags: ["PendingEnrollRequests"],
    }),

    approveEnroll: builder.mutation({
      query: (enrollId) => ({
        url: `/approve/${enrollId}`,
        method: "PATCH",
      }),
      invalidatesTags: [
        "PendingEnrollRequests",
        "PendingEnrollRequestOptions",
        "Enroll",
      ],
    }),

    rejectEnroll: builder.mutation({
      query: (enrollId) => ({
        url: `/reject/${enrollId}`,
        method: "PATCH",
      }),
      invalidatesTags: [
        "PendingEnrollRequests",
        "PendingEnrollRequestOptions",
        "Enroll",
      ],
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
