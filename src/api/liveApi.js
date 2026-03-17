import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const liveApi = createApi({
  reducerPath: "liveApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/live`,
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
  tagTypes: ["Live"],
  endpoints: (builder) => ({
    getAllLives: builder.query({
      query: () => `/`,
      providesTags: (result) =>
        result?.lives
          ? [
              { type: "Live", id: "LIST" },
              ...result.lives.map((l) => ({ type: "Live", id: l._id })),
            ]
          : [{ type: "Live", id: "LIST" }],
    }),

    getLiveById: builder.query({
      query: ({ classId, liveId }) => `/class/${classId}/${liveId}`,
      providesTags: (result, error, { liveId }) => [
        { type: "Live", id: liveId },
      ],
    }),

    getLivesByClassId: builder.query({
      query: (classId) => `/class/${classId}`,
      transformResponse: (response) => response?.lives || [],
      providesTags: (result, error, classId) =>
        Array.isArray(result)
          ? [
              { type: "Live", id: `CLASS_${classId}` },
              ...result.map((l) => ({ type: "Live", id: l._id })),
            ]
          : [{ type: "Live", id: `CLASS_${classId}` }],
    }),

    getStudentLives: builder.query({
      query: () => `/student`,
      providesTags: (result) =>
        result?.lives
          ? [
              { type: "Live", id: "STUDENT_LIST" },
              ...result.lives.map((l) => ({ type: "Live", id: l._id })),
            ]
          : [{ type: "Live", id: "STUDENT_LIST" }],
    }),

    createLive: builder.mutation({
      query: ({ classId, ...body }) => ({
        url: `/class/${classId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Live", id: "LIST" }],
    }),

    updateLive: builder.mutation({
      query: ({ classId, liveId, body }) => ({
        url: `/class/${classId}/${liveId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { classId, liveId }) => [
        { type: "Live", id: "LIST" },
        { type: "Live", id: `CLASS_${classId}` },
        { type: "Live", id: liveId },
      ],
    }),

    deleteLive: builder.mutation({
      query: ({ classId, liveId }) => ({
        url: `/class/${classId}/${liveId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { classId, liveId }) => [
        { type: "Live", id: "LIST" },
        { type: "Live", id: `CLASS_${classId}` },
        { type: "Live", id: liveId },
      ],
    }),
  }),
});

export const {
  useGetAllLivesQuery,
  useGetLiveByIdQuery,
  useGetLivesByClassIdQuery,
  useGetStudentLivesQuery,
  useCreateLiveMutation,
  useUpdateLiveMutation,
  useDeleteLiveMutation,
} = liveApi;