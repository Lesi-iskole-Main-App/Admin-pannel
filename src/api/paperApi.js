import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const paperApi = createApi({
  reducerPath: "paperApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/paper`,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Paper", "PaperFormData"],
  endpoints: (builder) => ({
    getPaperFormData: builder.query({
      query: () => ({ url: "/form-data", method: "GET" }),
      providesTags: ["PaperFormData"],
    }),

    getPapers: builder.query({
      query: () => ({ url: "/", method: "GET" }),
      providesTags: (res) =>
        res?.papers
          ? [
              { type: "Paper", id: "LIST" },
              ...res.papers.map((p) => ({ type: "Paper", id: p._id })),
            ]
          : [{ type: "Paper", id: "LIST" }],
    }),

    createPaper: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: [{ type: "Paper", id: "LIST" }],
    }),

    updatePaper: builder.mutation({
      query: ({ paperId, patch }) => ({
        url: `/${paperId}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (res, err, arg) => [
        { type: "Paper", id: arg.paperId },
        { type: "Paper", id: "LIST" },
      ],
    }),

    deletePaper: builder.mutation({
      query: (paperId) => ({ url: `/${paperId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Paper", id: "LIST" }],
    }),

    publishPaper: builder.mutation({
      query: (paperId) => ({ url: `/${paperId}/publish`, method: "POST" }),
      invalidatesTags: (res, err, paperId) => [
        { type: "Paper", id: paperId },
        { type: "Paper", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPaperFormDataQuery,
  useGetPapersQuery,
  useCreatePaperMutation,
  useUpdatePaperMutation,
  useDeletePaperMutation,
  usePublishPaperMutation,
} = paperApi;