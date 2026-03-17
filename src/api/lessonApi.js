import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const lessonApi = createApi({
  reducerPath: "lessonApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/lesson`,
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
  tagTypes: ["Lesson"],
  endpoints: (builder) => ({
    getAllLessons: builder.query({
      query: () => `/`,
      providesTags: (result) =>
        result?.lessons
          ? [
              { type: "Lesson", id: "LIST" },
              ...result.lessons.map((l) => ({ type: "Lesson", id: l._id })),
            ]
          : [{ type: "Lesson", id: "LIST" }],
    }),

    getLessonsByClassId: builder.query({
      query: (classId) => `/class/${classId}`,
      transformResponse: (response) => response?.lessons || [],
      providesTags: (result, error, classId) =>
        Array.isArray(result)
          ? [
              { type: "Lesson", id: `CLASS_${classId}` },
              ...result.map((l) => ({ type: "Lesson", id: l._id })),
            ]
          : [{ type: "Lesson", id: `CLASS_${classId}` }],
    }),

    getLessonById: builder.query({
      query: (lessonId) => `/${lessonId}`,
      providesTags: (result, error, lessonId) => [
        { type: "Lesson", id: lessonId },
      ],
    }),

    createLesson: builder.mutation({
      query: (body) => ({
        url: `/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Lesson", id: "LIST" }],
    }),

    updateLessonById: builder.mutation({
      query: ({ lessonId, body }) => ({
        url: `/${lessonId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { lessonId }) => [
        { type: "Lesson", id: "LIST" },
        { type: "Lesson", id: lessonId },
      ],
    }),

    deleteLessonById: builder.mutation({
      query: (lessonId) => ({
        url: `/${lessonId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Lesson", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllLessonsQuery,
  useGetLessonsByClassIdQuery,
  useGetLessonByIdQuery,
  useCreateLessonMutation,
  useUpdateLessonByIdMutation,
  useDeleteLessonByIdMutation,
} = lessonApi;