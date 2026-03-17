import { api } from "./api";

export const liveApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllLives: builder.query({
      query: () => "/live",
      providesTags: ["Live"],
    }),

    getLiveById: builder.query({
      query: ({ classId, liveId }) => `/live/${classId}/${liveId}`,
      providesTags: (result, error, { liveId }) => [{ type: "Live", id: liveId }],
    }),

    createLive: builder.mutation({
      query: ({ classId, ...body }) => ({
        url: `/live/${classId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Live"],
    }),

    updateLive: builder.mutation({
      query: ({ classId, liveId, body }) => ({
        url: `/live/${classId}/${liveId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { liveId }) => [
        "Live",
        { type: "Live", id: liveId },
      ],
    }),

    deleteLive: builder.mutation({
      query: ({ classId, liveId }) => ({
        url: `/live/${classId}/${liveId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Live"],
    }),
  }),
});

export const {
  useGetAllLivesQuery,
  useGetLiveByIdQuery,
  useCreateLiveMutation,
  useUpdateLiveMutation,
  useDeleteLiveMutation,
} = liveApi;