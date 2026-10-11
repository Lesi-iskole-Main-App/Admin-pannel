import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const storedToken = () => {
  try { return localStorage.getItem("token") || ""; }
  catch { return ""; }
};

const request = fetchBaseQuery({
  baseUrl: `${BACKEND_URL}/api/recording`,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = storedToken() || getState()?.auth?.token;
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Auth state and local storage can briefly hold different tokens after login.
// Retry a rejected call only with a distinct token, as on the lesson page.
const requestWithAuthFallback = async (args, api, extraOptions) => {
  const tokenSent = storedToken() || api.getState()?.auth?.token || "";
  const first = await request(args, api, extraOptions);
  if (first.error?.status !== 401 && first.error?.status !== 403) return first;
  const alternate = [storedToken(), api.getState()?.auth?.token || ""]
    .find((token) => token && token !== tokenSent);
  if (!alternate) return first;
  const options = typeof args === "string" ? { url: args } : args;
  return request({ ...options, headers: {
    ...(options.headers || {}), Authorization: `Bearer ${alternate}`,
  } }, api, extraOptions);
};

export const recordingApi = createApi({
  reducerPath: "recordingApi",
  baseQuery: requestWithAuthFallback,
  tagTypes: ["Recording"],
  endpoints: (builder) => ({
    getAllRecordings: builder.query({
      query: () => "/",
      providesTags: [{ type: "Recording", id: "ALL" }],
    }),
    getRecordingsByClassId: builder.query({
      query: (classId) => `/class/${encodeURIComponent(classId)}`,
      transformResponse: (response) => response?.recordings || [],
      providesTags: (result, error, classId) => [
        { type: "Recording", id: String(classId) },
      ],
    }),
    createRecordingByClassId: builder.mutation({
      query: ({ classId, body }) => ({
        url: `/class/${encodeURIComponent(classId)}`, method: "POST", body,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "Recording", id: String(classId) },
        { type: "Recording", id: "ALL" },
      ],
    }),
    updateRecordingByClassId: builder.mutation({
      query: ({ classId, recordingId, body }) => ({
        url: `/class/${encodeURIComponent(classId)}/${encodeURIComponent(recordingId)}`,
        method: "PATCH", body,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "Recording", id: String(classId) },
        { type: "Recording", id: "ALL" },
      ],
    }),
    deleteRecordingByClassId: builder.mutation({
      query: ({ classId, recordingId }) => ({
        url: `/class/${encodeURIComponent(classId)}/${encodeURIComponent(recordingId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "Recording", id: String(classId) },
        { type: "Recording", id: "ALL" },
      ],
    }),
    reorderRecordingsByClassId: builder.mutation({
      query: ({ classId, recordingIds }) => ({
        url: `/class/${encodeURIComponent(classId)}/order`,
        method: "PATCH", body: { recordingIds },
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: "Recording", id: String(classId) },
        { type: "Recording", id: "ALL" },
      ],
    }),
  }),
});

export const {
  useGetAllRecordingsQuery,
  useGetRecordingsByClassIdQuery,
  useCreateRecordingByClassIdMutation,
  useUpdateRecordingByClassIdMutation,
  useDeleteRecordingByClassIdMutation,
  useReorderRecordingsByClassIdMutation,
} = recordingApi;

// Keep common names usable by any existing admin component that imports them.
export const useCreateRecordingMutation = useCreateRecordingByClassIdMutation;
export const useUpdateRecordingMutation = useUpdateRecordingByClassIdMutation;
export const useDeleteRecordingMutation = useDeleteRecordingByClassIdMutation;
