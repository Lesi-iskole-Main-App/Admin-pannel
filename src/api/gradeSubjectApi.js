import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const gradeSubjectApi = createApi({
  reducerPath: "gradeSubjectApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/grade`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Grades", "Subjects", "Streams", "StreamSubjects"],
  endpoints: (builder) => ({
    getGrades: builder.query({
      query: () => "/grades",
      providesTags: (result) =>
        result?.grades
          ? [
              { type: "Grades", id: "LIST" },
              ...result.grades.map((g) => ({ type: "Grades", id: g._id })),
            ]
          : [{ type: "Grades", id: "LIST" }],
    }),

    createGrade: builder.mutation({
      query: (payload) => ({
        url: "/grade",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "Grades", id: "LIST" }],
    }),

    deleteGrade: builder.mutation({
      query: ({ gradeId }) => ({
        url: `/grade/${gradeId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Grades", id: "LIST" }],
    }),

    getSubjectsByGrade: builder.query({
      query: (gradeId) => `/subjects/${gradeId}`,
      providesTags: (result, err, gradeId) => [
        { type: "Subjects", id: `LIST-${gradeId}` },
      ],
    }),

    createSubject: builder.mutation({
      query: (payload) => ({
        url: "/subject",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (res, err, arg) => [
        { type: "Subjects", id: `LIST-${arg.gradeId}` },
      ],
    }),

    updateSubject: builder.mutation({
      query: ({ gradeId, subjectId, subject }) => ({
        url: `/subject/${gradeId}/${subjectId}`,
        method: "PATCH",
        body: { subject },
      }),
      invalidatesTags: (res, err, arg) => [
        { type: "Subjects", id: `LIST-${arg.gradeId}` },
      ],
    }),

    deleteSubject: builder.mutation({
      query: ({ gradeId, subjectId }) => ({
        url: `/subject/${gradeId}/${subjectId}`,
        method: "DELETE",
      }),
      invalidatesTags: (res, err, arg) => [
        { type: "Subjects", id: `LIST-${arg.gradeId}` },
      ],
    }),

    getStreamsByGrade: builder.query({
      query: (gradeId) => `/streams/admin/${gradeId}`,
      providesTags: (result, err, gradeId) => [
        { type: "Streams", id: `LIST-${gradeId}` },
      ],
    }),

    getStreamSubjects: builder.query({
      query: ({ gradeId, streamId }) =>
        `/stream/subjects/${gradeId}/${streamId}`,
      providesTags: (result, err, arg) => [
        { type: "StreamSubjects", id: `LIST-${arg.gradeId}-${arg.streamId}` },
      ],
    }),

    createStreamSubject: builder.mutation({
      query: (payload) => ({
        url: "/stream/subject",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (res, err, arg) => [
        { type: "StreamSubjects", id: `LIST-${arg.gradeId}-${arg.streamId}` },
        { type: "Streams", id: `LIST-${arg.gradeId}` },
      ],
    }),

    updateStreamSubject: builder.mutation({
      query: ({ gradeId, streamId, subjectId, subject }) => ({
        url: `/stream/subject/${gradeId}/${streamId}/${subjectId}`,
        method: "PATCH",
        body: { subject },
      }),
      invalidatesTags: (res, err, arg) => [
        { type: "StreamSubjects", id: `LIST-${arg.gradeId}-${arg.streamId}` },
        { type: "Streams", id: `LIST-${arg.gradeId}` },
      ],
    }),

    deleteStreamSubject: builder.mutation({
      query: ({ gradeId, streamId, subjectId }) => ({
        url: `/stream/subject/${gradeId}/${streamId}/${subjectId}`,
        method: "DELETE",
      }),
      invalidatesTags: (res, err, arg) => [
        { type: "StreamSubjects", id: `LIST-${arg.gradeId}-${arg.streamId}` },
        { type: "Streams", id: `LIST-${arg.gradeId}` },
      ],
    }),
  }),
});

export const {
  useGetGradesQuery,
  useCreateGradeMutation,
  useDeleteGradeMutation,

  useGetSubjectsByGradeQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,

  useGetStreamsByGradeQuery,

  useGetStreamSubjectsQuery,
  useCreateStreamSubjectMutation,
  useUpdateStreamSubjectMutation,
  useDeleteStreamSubjectMutation,
} = gradeSubjectApi;