import { api } from "./api";

export const recordingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllRecordings: builder.query({
      query: () => "/recording",
      providesTags: ["Recording"],
    }),

    createRecordingByClassId: builder.mutation({
      query: ({ classId, body }) => ({
        url: `/recording/${classId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Recording"],
    }),

    updateRecordingByClassId: builder.mutation({
      query: ({ classId, recordingId, body }) => ({
        url: `/recording/${classId}/${recordingId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { recordingId }) => [
        "Recording",
        { type: "Recording", id: recordingId },
      ],
    }),

    deleteRecordingByClassId: builder.mutation({
      query: ({ classId, recordingId }) => ({
        url: `/recording/${classId}/${recordingId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Recording"],
    }),
  }),
});

export const {
  useGetAllRecordingsQuery,
  useCreateRecordingByClassIdMutation,
  useUpdateRecordingByClassIdMutation,
  useDeleteRecordingByClassIdMutation,
} = recordingApi;