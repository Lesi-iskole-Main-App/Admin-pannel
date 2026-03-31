import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const teacherApi = createApi({
  reducerPath: "teacherApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/user`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const reduxToken = getState()?.auth?.token;
      const storageToken = localStorage.getItem("token");
      const token = reduxToken || storageToken;

      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  tagTypes: ["Teachers"],
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: () => "/",
      transformResponse: (response) => {
        if (Array.isArray(response)) return { users: response };
        if (Array.isArray(response?.users)) return response;
        return { users: [] };
      },
      providesTags: (result) =>
        result?.users
          ? [
              { type: "Teachers", id: "LIST" },
              ...result.users.map((u) => ({ type: "Teachers", id: u._id })),
            ]
          : [{ type: "Teachers", id: "LIST" }],
    }),

    approveTeacher: builder.mutation({
      query: (id) => ({
        url: `/${id}/approve-teacher`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }],
    }),

    rejectTeacher: builder.mutation({
      query: (id) => ({
        url: `/${id}/reject-teacher`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useApproveTeacherMutation,
  useRejectTeacherMutation,
} = teacherApi;