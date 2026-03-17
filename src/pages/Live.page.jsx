import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useGetAllClassesQuery } from "../api/classApi";
import {
  useGetAllLivesQuery,
  useCreateLiveMutation,
  useUpdateLiveMutation,
  useDeleteLiveMutation,
  useGetLiveByIdQuery,
} from "../api/liveApi";

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

const toDateInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
};

const toTimeInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toTimeString().slice(0, 5);
};

const buildScheduledAt = (date, time) => {
  if (!date || !time) return "";
  const dt = new Date(`${date}T${time}:00`);
  return dt.toISOString();
};

const getNormalizedZoomLinks = (live) => {
  if (!live) return [""];

  if (Array.isArray(live.zoomLinks) && live.zoomLinks.length > 0) {
    const cleaned = live.zoomLinks
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    return cleaned.length ? cleaned : [""];
  }

  if (live.zoomLink) {
    return [String(live.zoomLink).trim()];
  }

  return [""];
};

const LivePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const action = searchParams.get("action");
  const liveId = searchParams.get("liveId");
  const classIdFromQuery = searchParams.get("classId");

  const goList = () => navigate("/lms/live", { replace: true });

  const {
    data: classRes,
    isLoading: classLoading,
    isError: classError,
  } = useGetAllClassesQuery();

  const classes = classRes?.classes || [];

  const {
    data: liveRes,
    isLoading: liveLoading,
    isError: liveError,
  } = useGetAllLivesQuery();

  const lives = liveRes?.lives || [];

  const [createLive, { isLoading: creating }] = useCreateLiveMutation();
  const [updateLive, { isLoading: updating }] = useUpdateLiveMutation();
  const [deleteLive, { isLoading: deleting }] = useDeleteLiveMutation();

  const {
    data: liveByIdRes,
    isLoading: liveByIdLoading,
    isError: liveByIdError,
  } = useGetLiveByIdQuery(
    { classId: classIdFromQuery, liveId },
    {
      skip:
        !(action === "update" || action === "view") ||
        !liveId ||
        !classIdFromQuery,
    }
  );

  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({
    classId: "",
    zoomLinks: [""],
    date: "",
    time: "",
  });

  const selectedClass = useMemo(() => {
    return classes.find((c) => String(c?._id) === String(form.classId));
  }, [classes, form.classId]);

  const teacherName = useMemo(() => {
    const names =
      (selectedClass?.teacherIds || []).map((t) => t?.name).filter(Boolean) || [];
    return names.join(", ") || "—";
  }, [selectedClass]);

  const gradeName = useMemo(() => {
    if (selectedClass?.gradeNo) return `Grade ${selectedClass.gradeNo}`;
    if (selectedClass?.grade) return `Grade ${selectedClass.grade}`;
    if (selectedClass?.gradeId?.grade) return `Grade ${selectedClass.gradeId.grade}`;
    return "—";
  }, [selectedClass]);

  const subjectName = useMemo(() => {
    return (
      selectedClass?.subjectName ||
      selectedClass?.subjectId?.subject ||
      selectedClass?.streamSubjectId?.subject ||
      selectedClass?.subject ||
      "—"
    );
  }, [selectedClass]);

  const batchNumber = useMemo(() => {
    return selectedClass?.batchNumber || "—";
  }, [selectedClass]);

  useEffect(() => {
    if (action === "create") {
      setForm({ classId: "", zoomLinks: [""], date: "", time: "" });
    }
  }, [action]);

  useEffect(() => {
    if (action !== "update") return;
    const live = liveByIdRes?.live;
    if (!live) return;

    setForm({
      classId: String(live?.classId?._id || live?.classId || ""),
      zoomLinks: getNormalizedZoomLinks(live),
      date: toDateInput(live?.scheduledAt),
      time: toTimeInput(live?.scheduledAt),
    });
  }, [action, liveByIdRes]);

  const rows = useMemo(() => {
    return lives.map((l) => {
      const dt = l?.scheduledAt ? new Date(l.scheduledAt) : null;
      const date =
        dt && !Number.isNaN(dt.getTime()) ? dt.toISOString().slice(0, 10) : "—";
      const time =
        dt && !Number.isNaN(dt.getTime()) ? dt.toTimeString().slice(0, 5) : "—";

      const details = l?.classDetails || {};
      const zoomLinks = getNormalizedZoomLinks(l);

      return {
        _id: l._id,
        classId: l?.classId?._id || l?.classId || "",
        className: details?.className || "—",
        batchNumber: details?.batchNumber || "—",
        teacherName: (details?.teachers || []).join(", ") || "—",
        grade: details?.grade ? `Grade ${details.grade}` : "—",
        subject: details?.subject || "—",
        zoomLinks,
        date,
        time,
      };
    });
  }, [lives]);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return rows.slice(start, end);
  }, [rows, currentPage]);

  const startRecord =
    totalRows === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endRecord =
    totalRows === 0 ? 0 : Math.min(currentPage * ROWS_PER_PAGE, totalRows);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  const openCreate = () => navigate("/lms/live?action=create");
  const openUpdate = (id, classId) =>
    navigate(`/lms/live?action=update&liveId=${id}&classId=${classId}`);

  const onDelete = async (liveId, classId) => {
    if (!window.confirm("Delete this live session?")) return;
    try {
      await deleteLive({ classId, liveId }).unwrap();
    } catch (e) {
      alert(e?.data?.message || "Delete failed");
    }
  };

  const handleZoomLinkChange = (index, value) => {
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
        zoomLinks: next.length ? next : [""],
      };
    });
  };

  const cleanedZoomLinks = useMemo(() => {
    return (form.zoomLinks || []).map((x) => String(x || "").trim()).filter(Boolean);
  }, [form.zoomLinks]);

  const submitCreate = async () => {
    if (!form.classId || !form.date || !form.time || cleanedZoomLinks.length === 0) {
      alert("class, at least one zoom link, date, time are required");
      return;
    }

    try {
      await createLive({
        classId: form.classId,
        title: `${selectedClass?.className || "Live"}`,
        scheduledAt: buildScheduledAt(form.date, form.time),
        zoomLinks: cleanedZoomLinks,
      }).unwrap();

      goList();
      setCurrentPage(1);
    } catch (e) {
      alert(e?.data?.message || "Create failed");
    }
  };

  const submitUpdate = async () => {
    if (!liveId || !classIdFromQuery) return;

    if (!form.classId || !form.date || !form.time || cleanedZoomLinks.length === 0) {
      alert("class, at least one zoom link, date, time are required");
      return;
    }

    try {
      await updateLive({
        classId: classIdFromQuery,
        liveId,
        body: {
          title: `${selectedClass?.className || "Live"}`,
          scheduledAt: buildScheduledAt(form.date, form.time),
          zoomLinks: cleanedZoomLinks,
        },
      }).unwrap();

      goList();
    } catch (e) {
      alert(e?.data?.message || "Update failed");
    }
  };

  return (
    <div className="flex w-full justify-center">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Live Session Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage live classes, meeting links, schedules, and class batches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
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

        {action === "create" && (
          <ModalShell title="Create Live Session" onClose={goList}>
            {classLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : classError ? (
              <div className="text-sm text-red-600">Failed to load classes</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class Name
                  </label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.classId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, classId: e.target.value }))
                    }
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.className} {c.batchNumber ? `- ${c.batchNumber}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Batch Number
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={batchNumber}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teacher Name
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={teacherName}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Grade
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={gradeName}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={subjectName}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
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

                  {form.zoomLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={link}
                        onChange={(e) =>
                          handleZoomLinkChange(index, e.target.value)
                        }
                        placeholder={`Enter zoom link ${index + 1}`}
                      />

                      <button
                        type="button"
                        onClick={() => removeZoomLinkField(index)}
                        disabled={form.zoomLinks.length === 1}
                        className="inline-flex h-10 min-w-[42px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Time
                    </label>
                    <input
                      type="time"
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.time}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, time: e.target.value }))
                      }
                    />
                  </div>
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
                    onClick={submitCreate}
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            )}
          </ModalShell>
        )}

        {action === "update" && (
          <ModalShell title="Update Live Session" onClose={goList}>
            {!liveId || !classIdFromQuery ? (
              <div className="text-sm text-red-600">Missing liveId or classId</div>
            ) : liveByIdLoading || classLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : liveByIdError ? (
              <div className="text-sm text-red-600">Failed to load live</div>
            ) : classError ? (
              <div className="text-sm text-red-600">Failed to load classes</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class Name
                  </label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                    value={form.classId}
                    disabled
                    onChange={(e) =>
                      setForm((p) => ({ ...p, classId: e.target.value }))
                    }
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.className} {c.batchNumber ? `- ${c.batchNumber}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Batch Number
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={batchNumber}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teacher Name
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={teacherName}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Grade
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={gradeName}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={subjectName}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
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

                  {form.zoomLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={link}
                        onChange={(e) =>
                          handleZoomLinkChange(index, e.target.value)
                        }
                        placeholder={`Enter zoom link ${index + 1}`}
                      />

                      <button
                        type="button"
                        onClick={() => removeZoomLinkField(index)}
                        disabled={form.zoomLinks.length === 1}
                        className="inline-flex h-10 min-w-[42px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Time
                    </label>
                    <input
                      type="time"
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.time}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, time: e.target.value }))
                      }
                    />
                  </div>
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
                    onClick={submitUpdate}
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Update"}
                  </button>
                </div>
              </div>
            )}
          </ModalShell>
        )}

        <div className="mt-5 overflow-hidden border border-gray-200 bg-white">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1360px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#F8FAFC] text-left text-[13px] font-medium text-gray-600">
                  <th className="w-[14%] border-b border-r border-gray-200 px-4 py-3">
                    Class Name
                  </th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Batch Number
                  </th>
                  <th className="w-[16%] border-b border-r border-gray-200 px-4 py-3">
                    Teacher Name
                  </th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">
                    Grade
                  </th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Subject
                  </th>
                  <th className="w-[18%] border-b border-r border-gray-200 px-4 py-3">
                    Zoom Links
                  </th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">
                    Date
                  </th>
                  <th className="w-[8%] border-b border-r border-gray-200 px-4 py-3">
                    Time
                  </th>
                  <th className="w-[10%] border-b border-gray-200 px-4 py-3 text-center">
                    Operation
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white text-sm text-gray-700">
                {liveLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : liveError ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-red-600">
                      Failed to load lives
                    </td>
                  </tr>
                ) : totalRows === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No live records found
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/70">
                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate font-medium text-gray-800">
                          {r.className}
                        </div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.batchNumber}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.teacherName}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.grade}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.subject}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        {r.zoomLinks?.length ? (
                          <div className="flex flex-col gap-1">
                            {r.zoomLinks.map((link, idx) => (
                              <a
                                key={`${r._id}-${idx}`}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate font-medium text-blue-600 hover:underline"
                              >
                                Open Link {idx + 1}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.date}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.time}</div>
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <IconButton
                            title="Edit"
                            onClick={() => openUpdate(r._id, r.classId)}
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
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </IconButton>

                          <IconButton
                            title="Delete"
                            onClick={() => onDelete(r._id, r.classId)}
                            disabled={deleting}
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