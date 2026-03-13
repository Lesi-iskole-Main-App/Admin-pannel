import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const classApi = createApi({
  reducerPath: "classApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/class`,
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
  tagTypes: ["Class"],
  endpoints: (builder) => ({
    getAllClasses: builder.query({
      query: () => `/`,
      providesTags: (result) =>
        result?.classes
          ? [
              { type: "Class", id: "LIST" },
              ...result.classes.map((c) => ({ type: "Class", id: c._id })),
            ]
          : [{ type: "Class", id: "LIST" }],
    }),

    getClassById: builder.query({
      query: (classId) => `/${classId}`,
      providesTags: (result, error, classId) => [{ type: "Class", id: classId }],
    }),

    createClass: builder.mutation({
      query: (body) => ({
        url: `/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Class", id: "LIST" }],
    }),

    updateClass: builder.mutation({
      query: ({ classId, body }) => ({
        url: `/${classId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "Class", id: "LIST" },
        { type: "Class", id: classId },
      ],
    }),

    deleteClass: builder.mutation({
      query: (classId) => ({
        url: `/${classId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Class", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllClassesQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
} = classApi;