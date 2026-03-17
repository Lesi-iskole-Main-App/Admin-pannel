import { api } from "./api";

export const classApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllClasses: builder.query({
      query: () => "/class",
      providesTags: ["Class"],
    }),

    getClassById: builder.query({
      query: (classId) => `/class/${classId}`,
      providesTags: (result, error, classId) => [{ type: "Class", id: classId }],
    }),

    createClass: builder.mutation({
      query: (body) => ({
        url: "/class",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Class", "Live", "Lesson", "Recording"],
    }),

    updateClass: builder.mutation({
      query: ({ classId, body }) => ({
        url: `/class/${classId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { classId }) => [
        "Class",
        "Live",
        "Lesson",
        "Recording",
        { type: "Class", id: classId },
      ],
    }),

    deleteClass: builder.mutation({
      query: (classId) => ({
        url: `/class/${classId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Class", "Live", "Lesson", "Recording"],
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