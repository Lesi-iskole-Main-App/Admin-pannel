import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const recordingApi = createApi({
  reducerPath: "recordingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/recording`,
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
  tagTypes: ["Recording"],
  endpoints: (builder) => ({
    getAllRecordings: builder.query({
      query: () => `/`,
      providesTags: (result) =>
        result?.recordings
          ? [
              { type: "Recording", id: "LIST" },
              ...result.recordings.map((r) => ({
                type: "Recording",
                id: r._id,
              })),
            ]
          : [{ type: "Recording", id: "LIST" }],
    }),

    getRecordingsByClassId: builder.query({
      query: (classId) => `/class/${classId}`,
      transformResponse: (response) => response?.recordings || [],
      providesTags: (result, error, classId) =>
        Array.isArray(result)
          ? [
              { type: "Recording", id: `CLASS_${classId}` },
              ...result.map((r) => ({ type: "Recording", id: r._id })),
            ]
          : [{ type: "Recording", id: `CLASS_${classId}` }],
    }),

    getRecordingById: builder.query({
      query: ({ classId, recordingId }) => `/class/${classId}/${recordingId}`,
      providesTags: (result, error, { recordingId }) => [
        { type: "Recording", id: recordingId },
      ],
    }),

    createRecordingByClassId: builder.mutation({
      query: ({ classId, body }) => ({
        url: `/class/${classId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Recording", id: "LIST" }],
    }),

    updateRecordingByClassId: builder.mutation({
      query: ({ classId, recordingId, body }) => ({
        url: `/class/${classId}/${recordingId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { classId, recordingId }) => [
        { type: "Recording", id: "LIST" },
        { type: "Recording", id: `CLASS_${classId}` },
        { type: "Recording", id: recordingId },
      ],
    }),

    deleteRecordingByClassId: builder.mutation({
      query: ({ classId, recordingId }) => ({
        url: `/class/${classId}/${recordingId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { classId, recordingId }) => [
        { type: "Recording", id: "LIST" },
        { type: "Recording", id: `CLASS_${classId}` },
        { type: "Recording", id: recordingId },
      ],
    }),
  }),
});

export const {
  useGetAllRecordingsQuery,
  useGetRecordingsByClassIdQuery,
  useGetRecordingByIdQuery,
  useCreateRecordingByClassIdMutation,
  useUpdateRecordingByClassIdMutation,
  useDeleteRecordingByClassIdMutation,
} = recordingApi;