import { api } from "./api";

export const lessonApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllLessons: builder.query({
      query: () => "/lesson",
      providesTags: ["Lesson"],
    }),

    createLesson: builder.mutation({
      query: (body) => ({
        url: "/lesson",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Lesson"],
    }),

    updateLessonById: builder.mutation({
      query: ({ lessonId, body }) => ({
        url: `/lesson/${lessonId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { lessonId }) => [
        "Lesson",
        { type: "Lesson", id: lessonId },
      ],
    }),

    deleteLessonById: builder.mutation({
      query: (lessonId) => ({
        url: `/lesson/${lessonId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Lesson"],
    }),
  }),
});

export const {
  useGetAllLessonsQuery,
  useCreateLessonMutation,
  useUpdateLessonByIdMutation,
  useDeleteLessonByIdMutation,
} = lessonApi;