import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const storedToken = () => {
  try { return localStorage.getItem("token") || ""; }
  catch { return ""; }
};

const request = fetchBaseQuery({
  baseUrl: `${BACKEND_URL}/api/lesson`,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = storedToken() || getState()?.auth?.token;
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// A login/refresh can update one token store before the other. Retry an auth
// rejection once using the other token; never retry a successful mutation.
const requestWithAuthFallback = async (args, api, extraOptions) => {
  const tokenSent = storedToken() || api.getState()?.auth?.token || "";
  const result = await request(args, api, extraOptions);
  if (result.error?.status !== 401 && result.error?.status !== 403) return result;
  const currentStorage = storedToken();
  const currentRedux = api.getState()?.auth?.token || "";
  const alternate = [currentStorage, currentRedux].find((token) =>
    token && token !== tokenSent);
  if (!alternate) return result;
  const options = typeof args === "string" ? { url: args } : args;
  return request({ ...options, headers: {
    ...(options.headers || {}), Authorization: `Bearer ${alternate}`,
  } }, api, extraOptions);
};

export const lessonApi = createApi({
  reducerPath: "lessonApi",
  baseQuery: requestWithAuthFallback,
  tagTypes: ["Lesson", "Catalog"],
  endpoints: (builder) => ({
    getCatalogAdmin: builder.query({
      query: (classId) => `/catalog/admin/class/${classId}`,
      providesTags: ["Catalog"],
    }),
    addCatalogVideo: builder.mutation({
      query: (body) => ({ url: "/catalog/admin/video", method: "POST", body }),
      invalidatesTags: ["Catalog", { type: "Lesson", id: "LIST" }],
    }),
    editCatalogVideo: builder.mutation({
      query: ({ id, body }) => ({ url: `/catalog/admin/video/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Catalog", { type: "Lesson", id: "LIST" }],
    }),
    archiveCatalogVideo: builder.mutation({
      query: (id) => ({ url: `/catalog/admin/video/${id}`, method: "DELETE" }),
      invalidatesTags: ["Catalog", { type: "Lesson", id: "LIST" }],
    }),
    renameCatalogLesson: builder.mutation({
      query: (body) => ({ url: "/catalog/admin/lesson", method: "PATCH", body }),
      invalidatesTags: ["Catalog"],
    }),
    renameCatalogSub: builder.mutation({
      query: (body) => ({ url: "/catalog/admin/sublesson", method: "PATCH", body }),
      invalidatesTags: ["Catalog"],
    }),
    archiveCatalogLesson: builder.mutation({
      query: (body) => ({ url: "/catalog/admin/lesson", method: "DELETE", body }),
      invalidatesTags: ["Catalog", { type: "Lesson", id: "LIST" }],
    }),
    archiveCatalogSub: builder.mutation({
      query: (body) => ({ url: "/catalog/admin/sublesson", method: "DELETE", body }),
      invalidatesTags: ["Catalog", { type: "Lesson", id: "LIST" }],
    }),
    reorderCatalog: builder.mutation({
      query: (body) => ({ url: "/catalog/admin/order", method: "PATCH", body }),
      invalidatesTags: ["Catalog"],
    }),
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
  useGetCatalogAdminQuery,
  useAddCatalogVideoMutation,
  useEditCatalogVideoMutation,
  useArchiveCatalogVideoMutation,
  useRenameCatalogLessonMutation,
  useRenameCatalogSubMutation,
  useArchiveCatalogLessonMutation,
  useArchiveCatalogSubMutation,
  useReorderCatalogMutation,
  useGetAllLessonsQuery,
  useGetLessonsByClassIdQuery,
  useGetLessonByIdQuery,
  useCreateLessonMutation,
  useUpdateLessonByIdMutation,
  useDeleteLessonByIdMutation,
} = lessonApi;
