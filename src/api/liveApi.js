import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const liveApi = createApi({
  reducerPath: "liveApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/live`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Live"],
  endpoints: (builder) => ({
    getAllLives: builder.query({
      query: () => ({
        url: "/",
        method: "GET",
      }),
      providesTags: (res) =>
        res?.lives
          ? [
              ...res.lives.map((x) => ({ type: "Live", id: x._id })),
              { type: "Live", id: "LIST" },
            ]
          : [{ type: "Live", id: "LIST" }],
    }),

    getLiveById: builder.query({
      query: ({ classId, liveId }) => ({
        url: `/class/${classId}/${liveId}`,
        method: "GET",
      }),
      providesTags: (res, err, arg) => [
        { type: "Live", id: arg?.liveId || "UNKNOWN" },
      ],
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
      invalidatesTags: (res, err, arg) => [
        { type: "Live", id: arg?.liveId },
        { type: "Live", id: "LIST" },
      ],
    }),

    deleteLive: builder.mutation({
      query: ({ classId, liveId }) => ({
        url: `/class/${classId}/${liveId}`,
        method: "DELETE",
      }),
      invalidatesTags: (res, err, arg) => [
        { type: "Live", id: arg?.liveId },
        { type: "Live", id: "LIST" },
      ],
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