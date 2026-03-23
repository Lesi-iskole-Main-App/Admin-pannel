import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  useCreateLiveMutation,
  useDeleteLiveMutation,
  useGetAllLivesQuery,
  useGetLiveByIdQuery,
  useUpdateLiveMutation,
} from "../api/liveApi";

import { useGetAllClassesQuery } from "../api/classApi";

const ROWS_PER_PAGE = 20;

const ModalShell = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />
      <div className="relative w-[95vw] max-w-[760px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#F8FAFC] px-4 py-4 sm:px-6">
          <div className="text-base font-semibold text-gray-800">{title}</div>
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

const IconButton = ({ onClick, title, children, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
};

const toLocalDatetimeInput = (dateValue) => {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${mins}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
};

const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toTimeString().slice(0, 5);
};

const getClassDisplay = (c) => {
  if (!c) return "—";

  const gradeText =
    c?.gradeLabel ||
    (c?.gradeId?.flowType === "al"
      ? "A/L"
      : c?.gradeId?.grade
      ? `Grade ${c.gradeId.grade}`
      : "—");

  const subjectText =
    c?.gradeId?.flowType === "al"
      ? [c?.subjectName, c?.streamName].filter(Boolean).join(" / ") || "—"
      : c?.subjectName || "—";

  return `${c?.className || "—"} | ${c?.batchNumber || "—"} | ${gradeText} | ${subjectText}`;
};

const emptyForm = {
  classId: "",
  title: "",
  scheduledAt: "",
  zoomLinks: [""],
  isActive: true,
};

const LivePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const action = searchParams.get("action");
  const classId = searchParams.get("classId");
  const liveId = searchParams.get("liveId");

  const goList = () =>
    navigate({ pathname: "/lms/live", search: "" }, { replace: true });

  const openCreate = () =>
    navigate({ pathname: "/lms/live", search: "?action=create" });

  const openView = (row) =>
    navigate({
      pathname: "/lms/live",
      search: `?action=view&classId=${encodeURIComponent(
        row.classId
      )}&liveId=${encodeURIComponent(row._id)}`,
    });

  const openUpdate = (row) =>
    navigate({
      pathname: "/lms/live",
      search: `?action=update&classId=${encodeURIComponent(
        row.classId
      )}&liveId=${encodeURIComponent(row._id)}`,
    });

  const {
    data: livesRes,
    isLoading,
    isError,
  } = useGetAllLivesQuery();

  const {
    data: classesRes,
    isLoading: classesLoading,
    isError: classesError,
  } = useGetAllClassesQuery(undefined, {
    skip: !(action === "create" || action === "update"),
  });

  const [createLive, { isLoading: isCreating }] = useCreateLiveMutation();
  const [updateLive, { isLoading: isUpdating }] = useUpdateLiveMutation();
  const [deleteLive, { isLoading: isDeleting }] = useDeleteLiveMutation();

  const shouldLoadDetails =
    (action === "view" || action === "update") && !!classId && !!liveId;

  const {
    data: liveRes,
    isLoading: liveLoading,
    isError: liveError,
  } = useGetLiveByIdQuery(
    { classId, liveId },
    {
      skip: !shouldLoadDetails,
    }
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(emptyForm);

  const classes = classesRes?.classes || [];

  const rows = useMemo(() => {
    const list = livesRes?.lives || [];

    return list.map((l) => {
      const classDetails = l?.classDetails || {};
      const teacherNames = Array.isArray(classDetails?.teachers)
        ? classDetails.teachers.filter(Boolean).join(", ")
        : "No Teacher";

      const zoomLinks = Array.isArray(l?.zoomLinks)
        ? l.zoomLinks.filter(Boolean)
        : l?.zoomLink
        ? [l.zoomLink]
        : [];

      return {
        _id: l?._id,
        classId: l?.classId?._id || l?.classId || "",
        title: l?.title || "—",
        scheduledAt: l?.scheduledAt || "",
        createdAt: l?.createdAt || "",
        className: classDetails?.className || "—",
        batchNumber: classDetails?.batchNumber || "—",
        grade:
          classDetails?.grade === 12 || classDetails?.grade === 13
            ? "A/L"
            : classDetails?.grade
            ? `Grade ${classDetails.grade}`
            : "—",
        subject:
          classDetails?.grade === 12 || classDetails?.grade === 13
            ? [classDetails?.subject, ...(classDetails?.streams || [])]
                .filter(Boolean)
                .join(" / ")
            : classDetails?.subject || "—",
        teacherNames: teacherNames || "No Teacher",
        zoomLinks,
        firstZoomLink: zoomLinks[0] || "",
        isActive: Boolean(l?.isActive),
        scheduledDate: formatDate(l?.scheduledAt),
        scheduledTime: formatTime(l?.scheduledAt),
        createdDate: formatDate(l?.createdAt),
        createdTime: formatTime(l?.createdAt),
      };
    });
  }, [livesRes]);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return rows.slice(start, start + ROWS_PER_PAGE);
  }, [rows, currentPage]);

  const startRecord =
    totalRows === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endRecord =
    totalRows === 0 ? 0 : Math.min(currentPage * ROWS_PER_PAGE, totalRows);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  useEffect(() => {
    if (action === "create") {
      setForm(emptyForm);
    }
  }, [action]);

  useEffect(() => {
    if (action !== "update") return;
    const live = liveRes?.live;
    if (!live) return;

    const normalizedZoomLinks =
      Array.isArray(live?.zoomLinks) && live.zoomLinks.length > 0
        ? live.zoomLinks
        : live?.zoomLink
        ? [live.zoomLink]
        : [""];

    setForm({
      classId: live?.classId?._id || live?.classId || "",
      title: live?.title || "",
      scheduledAt: toLocalDatetimeInput(live?.scheduledAt),
      zoomLinks: normalizedZoomLinks,
      isActive: live?.isActive !== undefined ? Boolean(live.isActive) : true,
    });
  }, [action, liveRes]);

  const setZoomLinkAt = (index, value) => {
    setForm((prev) => {
      const next = [...prev.zoomLinks];
      next[index] = value;
      return { ...prev, zoomLinks: next };
    });
  };

  const addZoomLinkField = () => {
    setForm((prev) => ({
      ...prev,
      zoomLinks: [...prev.zoomLinks, ""],
    }));
  };

  const removeZoomLinkField = (index) => {
    setForm((prev) => {
      const next = prev.zoomLinks.filter((_, i) => i !== index);
      return {
        ...prev,
        zoomLinks: next.length > 0 ? next : [""],
      };
    });
  };

  const normalizePayload = () => {
    const cleanedZoomLinks = (form.zoomLinks || [])
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    return {
      classId: form.classId,
      title: String(form.title || "").trim(),
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : "",
      zoomLinks: cleanedZoomLinks,
      isActive: Boolean(form.isActive),
    };
  };

  const validateForm = () => {
    const payload = normalizePayload();

    if (!payload.classId) {
      alert("class is required");
      return false;
    }

    if (!payload.title) {
      alert("title is required");
      return false;
    }

    if (!payload.scheduledAt) {
      alert("scheduledAt is required");
      return false;
    }

    if (Number.isNaN(new Date(payload.scheduledAt).getTime())) {
      alert("scheduledAt is invalid");
      return false;
    }

    if (!payload.zoomLinks.length) {
      alert("At least one zoom link is required");
      return false;
    }

    return true;
  };

  const submitCreate = async () => {
    if (!validateForm()) return;

    try {
      const payload = normalizePayload();
      await createLive({
        classId: payload.classId,
        title: payload.title,
        scheduledAt: payload.scheduledAt,
        zoomLinks: payload.zoomLinks,
        isActive: payload.isActive,
      }).unwrap();

      goList();
      setCurrentPage(1);
    } catch (e) {
      alert(e?.data?.message || "Create failed");
    }
  };

  const submitUpdate = async () => {
    if (!classId || !liveId) return;
    if (!validateForm()) return;

    try {
      const payload = normalizePayload();

      await updateLive({
        classId,
        liveId,
        body: {
          title: payload.title,
          scheduledAt: payload.scheduledAt,
          zoomLinks: payload.zoomLinks,
          isActive: payload.isActive,
        },
      }).unwrap();

      goList();
    } catch (e) {
      alert(e?.data?.message || "Update failed");
    }
  };

  const onDelete = async (row) => {
    if (!row?.classId || !row?._id) return;
    if (!window.confirm("Delete this live class?")) return;

    try {
      await deleteLive({
        classId: row.classId,
        liveId: row._id,
      }).unwrap();
    } catch (e) {
      alert(e?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="flex w-full justify-center">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Live Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage live classes, scheduled date and time, class selection, and zoom links.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
              onClick={openCreate}
            >
              + Add Live
            </button>

            <button
              type="button"
              onClick={() => navigate("/home")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700"
              title="Home"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </button>
          </div>
        </div>

        {action === "view" && (
          <ModalShell title="View Live Class" onClose={goList}>
            {!classId || !liveId ? (
              <div className="text-sm text-red-600">Missing classId or liveId</div>
            ) : liveLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : liveError ? (
              <div className="text-sm text-red-600">Failed to load live class</div>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-sm font-medium text-gray-700">Title</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {liveRes?.live?.title || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Class</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {liveRes?.live?.classDetails?.className || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Batch Number
                  </div>
                  <div className="mt-1 text-sm text-gray-900">
                    {liveRes?.live?.classDetails?.batchNumber || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Grade</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {liveRes?.live?.classDetails?.grade
                      ? liveRes?.live?.classDetails?.grade === 12 ||
                        liveRes?.live?.classDetails?.grade === 13
                        ? "A/L"
                        : `Grade ${liveRes.live.classDetails.grade}`
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Subject</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {liveRes?.live?.classDetails?.subject || "—"}
                  </div>
                </div>

                {Array.isArray(liveRes?.live?.classDetails?.streams) &&
                  liveRes.live.classDetails.streams.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Related Streams
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        {liveRes.live.classDetails.streams.join(", ")}
                      </div>
                    </div>
                  )}

                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Teachers
                  </div>
                  <div className="mt-1 text-sm text-gray-900">
                    {(liveRes?.live?.classDetails?.teachers || [])
                      .filter(Boolean)
                      .join(", ") || "No Teacher"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Scheduled Date
                  </div>
                  <div className="mt-1 text-sm text-gray-900">
                    {formatDate(liveRes?.live?.scheduledAt)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Scheduled Time
                  </div>
                  <div className="mt-1 text-sm text-gray-900">
                    {formatTime(liveRes?.live?.scheduledAt)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Status</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {liveRes?.live?.isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Zoom Links
                  </div>
                  <div className="mt-2 space-y-2">
                    {(liveRes?.live?.zoomLinks || [])
                      .filter(Boolean)
                      .map((link, idx) => (
                        <a
                          key={`${link}-${idx}`}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block break-all text-[12px] text-blue-600 underline"
                        >
                          {link}
                        </a>
                      ))}

                    {(!liveRes?.live?.zoomLinks ||
                      liveRes.live.zoomLinks.length === 0) && (
                      <div className="text-sm text-gray-400">No zoom links</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    onClick={() =>
                      openUpdate({
                        _id: liveId,
                        classId,
                      })
                    }
                  >
                    Update
                  </button>
                </div>
              </div>
            )}
          </ModalShell>
        )}

        {(action === "create" || action === "update") && (
          <ModalShell
            title={action === "create" ? "Create Live Class" : "Update Live Class"}
            onClose={goList}
          >
            {classesLoading || (action === "update" && liveLoading) ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : classesError ? (
              <div className="text-sm text-red-600">Failed to load classes</div>
            ) : action === "update" && liveError ? (
              <div className="text-sm text-red-600">Failed to load live class</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class
                  </label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.classId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, classId: e.target.value }))
                    }
                    disabled={action === "update"}
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {getClassDisplay(c)}
                      </option>
                    ))}
                  </select>
                  {action === "update" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Class cannot be changed during update because the live route uses classId.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Live Title
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Enter live title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.scheduledAt}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, scheduledAt: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Zoom Links
                    </label>

                    <button
                      type="button"
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                      onClick={addZoomLinkField}
                    >
                      + Add Link
                    </button>
                  </div>

                  <div className="mt-2 space-y-2">
                    {form.zoomLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                          value={link}
                          onChange={(e) => setZoomLinkAt(index, e.target.value)}
                          placeholder={`Zoom Link ${index + 1}`}
                        />

                        <button
                          type="button"
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 transition hover:bg-red-100"
                          onClick={() => removeZoomLinkField(index)}
                          disabled={form.zoomLinks.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="live-is-active"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, isActive: e.target.checked }))
                    }
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="live-is-active"
                    className="text-sm font-medium text-gray-700"
                  >
                    Active
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    onClick={goList}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    onClick={action === "create" ? submitCreate : submitUpdate}
                    disabled={isCreating || isUpdating}
                  >
                    {action === "create"
                      ? isCreating
                        ? "Creating..."
                        : "Create"
                      : isUpdating
                      ? "Updating..."
                      : "Update"}
                  </button>
                </div>
              </div>
            )}
          </ModalShell>
        )}

        <div className="mt-5 overflow-hidden border border-gray-200 bg-white">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1600px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#F8FAFC] text-left text-[13px] font-medium text-gray-600">
                  <th className="w-[15%] border-b border-r border-gray-200 px-4 py-3">
                    Title
                  </th>
                  <th className="w-[13%] border-b border-r border-gray-200 px-4 py-3">
                    Class
                  </th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">
                    Batch
                  </th>
                  <th className="w-[9%] border-b border-r border-gray-200 px-4 py-3">
                    Grade
                  </th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Subject
                  </th>
                  <th className="w-[15%] border-b border-r border-gray-200 px-4 py-3">
                    Teacher Name
                  </th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Zoom Link
                  </th>
                  <th className="w-[8%] border-b border-r border-gray-200 px-4 py-3">
                    Date
                  </th>
                  <th className="w-[7%] border-b border-r border-gray-200 px-4 py-3">
                    Time
                  </th>
                  <th className="w-[7%] border-b border-r border-gray-200 px-4 py-3">
                    Status
                  </th>
                  <th className="w-[10%] border-b border-gray-200 px-4 py-3 text-center">
                    Operation
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white text-sm text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-red-600">
                      Failed to load live classes
                    </td>
                  </tr>
                ) : totalRows === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      No live class records found
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/70">
                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate font-medium text-gray-800">
                          {r.title}
                        </div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.className}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.batchNumber}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.grade}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.subject}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.teacherNames}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        {r.firstZoomLink ? (
                          <a
                            href={r.firstZoomLink}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-blue-600 underline"
                          >
                            {r.firstZoomLink}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No link</span>
                        )}
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.scheduledDate}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.scheduledTime}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            r.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {r.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <IconButton title="View" onClick={() => openView(r)}>
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </IconButton>

                          <IconButton title="Update" onClick={() => openUpdate(r)}>
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </IconButton>

                          <IconButton
                            title="Delete"
                            onClick={() => onDelete(r)}
                            disabled={isDeleting}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {startRecord} to {endRecord} of {totalRows}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToFirstPage}
                disabled={currentPage === 1 || totalRows === 0}
                className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-gray-200 px-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {"<<"}
              </button>

              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPage === 1 || totalRows === 0}
                className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-gray-200 px-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {"<"}
              </button>

              <span className="px-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalRows === 0}
                className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-gray-200 px-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {">"}
              </button>

              <button
                type="button"
                onClick={goToLastPage}
                disabled={currentPage === totalPages || totalRows === 0}
                className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-gray-200 px-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {">>"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePage;