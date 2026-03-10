import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useGetAllRecordingsQuery,
  useCreateRecordingByClassIdMutation,
  useUpdateRecordingByClassIdMutation,
  useDeleteRecordingByClassIdMutation,
} from "../api/recordingApi";

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
      <div className="relative w-[95vw] max-w-[720px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
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

const RecordingPage = () => {
  const navigate = useNavigate();

  const {
    data: recordingsRes,
    isLoading: recordingsLoading,
    isError: recordingsError,
  } = useGetAllRecordingsQuery();

  const {
    data: classesRes,
    isLoading: classesLoading,
    isError: classesError,
  } = useGetAllClassesQuery();

  const [createRecordingByClassId, { isLoading: isCreating }] =
    useCreateRecordingByClassIdMutation();

  const [updateRecordingByClassId, { isLoading: isUpdating }] =
    useUpdateRecordingByClassIdMutation();

  const [deleteRecordingByClassId, { isLoading: isDeleting }] =
    useDeleteRecordingByClassIdMutation();

  const classes = classesRes?.classes || [];
  const recordings = recordingsRes?.recordings || [];

  const [modal, setModal] = useState({
    open: false,
    mode: "create",
    recordingId: null,
  });

  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({
    classId: "",
    grade: "",
    subject: "",
    teacherName: "",
    recordingUrl: "",
    title: "",
    description: "",
    date: "",
    time: "",
  });

  const openCreate = () =>
    setModal({ open: true, mode: "create", recordingId: null });

  const openEdit = (recording) =>
    setModal({
      open: true,
      mode: "edit",
      recordingId: recording?._id || null,
    });

  const closeModal = () =>
    setModal({ open: false, mode: "create", recordingId: null });

  const selectedClass = useMemo(() => {
    return classes.find((c) => String(c?._id) === String(form.classId));
  }, [classes, form.classId]);

  const autoInfo = useMemo(() => {
    if (!selectedClass) return { grade: "", subject: "", teacherName: "" };

    const grade = selectedClass?.gradeNo
      ? `Grade ${selectedClass.gradeNo}`
      : selectedClass?.gradeId?.grade
      ? `Grade ${selectedClass.gradeId.grade}`
      : selectedClass?.grade
      ? `Grade ${selectedClass.grade}`
      : "";

    const subject =
      selectedClass?.subjectName ||
      selectedClass?.subjectId?.subject ||
      selectedClass?.streamSubjectId?.subject ||
      selectedClass?.subject ||
      "";

    const teacherName =
      (selectedClass?.teacherIds || [])
        .map((t) => t?.name)
        .filter(Boolean)
        .join(", ") || "No Teacher";

    return { grade, subject, teacherName };
  }, [selectedClass]);

  useEffect(() => {
    if (!form.classId) {
      setForm((p) => ({ ...p, grade: "", subject: "", teacherName: "" }));
      return;
    }

    setForm((p) => ({
      ...p,
      grade: autoInfo.grade,
      subject: autoInfo.subject,
      teacherName: autoInfo.teacherName,
    }));
  }, [form.classId, autoInfo.grade, autoInfo.subject, autoInfo.teacherName]);

  useEffect(() => {
    if (!modal.open) return;

    if (modal.mode === "create") {
      setForm({
        classId: "",
        grade: "",
        subject: "",
        teacherName: "",
        recordingUrl: "",
        title: "",
        description: "",
        date: "",
        time: "",
      });
    }
  }, [modal.open, modal.mode]);

  useEffect(() => {
    if (!modal.open || modal.mode !== "edit") return;

    const recording = recordings.find(
      (r) => String(r?._id) === String(modal.recordingId)
    );

    if (!recording) return;

    const classId =
      typeof recording?.classId === "object"
        ? recording?.classId?._id
        : recording?.classId || "";

    const grade = recording?.classDetails?.grade
      ? `Grade ${recording.classDetails.grade}`
      : "";

    const subject = recording?.classDetails?.subject || "";

    const teacherName =
      (recording?.classDetails?.teachers || []).join(", ") || "No Teacher";

    setForm({
      classId,
      grade,
      subject,
      teacherName,
      recordingUrl: recording?.recordingUrl || "",
      title: recording?.title || "",
      description: recording?.description || "",
      date: recording?.date || "",
      time: recording?.time || "",
    });
  }, [modal.open, modal.mode, modal.recordingId, recordings]);

  const rows = useMemo(() => {
    return recordings.map((r) => {
      const className = r?.classDetails?.className || "—";
      const grade = r?.classDetails?.grade
        ? `Grade ${r.classDetails.grade}`
        : "—";
      const subject = r?.classDetails?.subject || "—";
      const teacher =
        (r?.classDetails?.teachers || []).join(", ") || "No Teacher";

      return {
        _id: r._id,
        classId: typeof r?.classId === "object" ? r?.classId?._id : r?.classId,
        className,
        grade,
        subject,
        teacher,
        recordingUrl: r.recordingUrl || "",
        recordingName: r.title || "—",
        description: r.description || "—",
        date: r.date || "—",
        time: r.time || "—",
        raw: r,
      };
    });
  }, [recordings]);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
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

  const validate = () => {
    if (!form.classId) {
      alert("Please select a class");
      return false;
    }
    if (!form.title || !form.date || !form.time || !form.recordingUrl) {
      alert("Recording name, date, time and recording link are required");
      return false;
    }
    return true;
  };

  const submitCreate = async () => {
    if (!validate()) return;

    try {
      await createRecordingByClassId({
        classId: form.classId,
        body: {
          title: form.title,
          date: form.date,
          time: form.time,
          description: form.description || "",
          recordingUrl: form.recordingUrl || "",
        },
      }).unwrap();

      closeModal();
      setCurrentPage(1);
    } catch (e) {
      alert(e?.data?.message || "Create failed");
    }
  };

  const submitUpdate = async () => {
    if (!validate()) return;
    if (!modal.recordingId) return;

    try {
      await updateRecordingByClassId({
        classId: form.classId,
        recordingId: modal.recordingId,
        body: {
          title: form.title,
          date: form.date,
          time: form.time,
          description: form.description || "",
          recordingUrl: form.recordingUrl || "",
        },
      }).unwrap();

      closeModal();
    } catch (e) {
      alert(e?.data?.message || "Update failed");
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm("Delete this recording?")) return;

    try {
      await deleteRecordingByClassId({
        classId: row.classId,
        recordingId: row._id,
      }).unwrap();
    } catch (e) {
      alert(e?.data?.message || "Delete failed");
    }
  };

  const formLoading = classesLoading || recordingsLoading;

  return (
    <div className="flex w-full justify-center">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Recording Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage class recording links, details, and schedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
              onClick={openCreate}
            >
              + Add Recording
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

        {modal.open && (
          <ModalShell
            title={
              modal.mode === "create" ? "Create Recording" : "Edit Recording"
            }
            onClose={closeModal}
          >
            {formLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : classesError ? (
              <div className="text-sm text-red-600">Failed to load classes</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class Name <span className="text-red-600">*</span>
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
                        {c.className}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Grade
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={form.grade}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={form.subject}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teacher Name
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                      value={form.teacherName}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Recording Link <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.recordingUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, recordingUrl: e.target.value }))
                    }
                    placeholder="https://youtube.com/... or video link"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Recording Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Enter recording name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="mt-2 min-h-[90px] w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date <span className="text-red-600">*</span>
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
                      Time <span className="text-red-600">*</span>
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
                    onClick={closeModal}
                  >
                    Cancel
                  </button>

                  {modal.mode === "create" ? (
                    <button
                      type="button"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      onClick={submitCreate}
                      disabled={isCreating}
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      onClick={submitUpdate}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "Update"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </ModalShell>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1300px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#F8FAFC] text-left text-[13px] font-medium text-gray-600">
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Class Name
                  </th>
                  <th className="w-[8%] border-b border-r border-gray-200 px-4 py-3">
                    Grade
                  </th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">
                    Subject
                  </th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Teacher Name
                  </th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">
                    Recording Link
                  </th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Recording Name
                  </th>
                  <th className="w-[16%] border-b border-r border-gray-200 px-4 py-3">
                    Description
                  </th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">
                    Date
                  </th>
                  <th className="w-[6%] border-b border-r border-gray-200 px-4 py-3">
                    Time
                  </th>
                  <th className="w-[10%] border-b border-gray-200 px-4 py-3 text-center">
                    Operation
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white text-sm text-gray-700">
                {recordingsLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : recordingsError ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-red-600">
                      Failed to load recordings
                    </td>
                  </tr>
                ) : totalRows === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      No recording records found
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
                        <div className="truncate">{r.grade}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.subject}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.teacher}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        {r.recordingUrl ? (
                          <a
                            href={r.recordingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate font-medium text-blue-600 hover:underline"
                          >
                            Open Link
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.recordingName}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.description}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.date}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.time}</div>
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <IconButton title="Edit" onClick={() => openEdit(r.raw)}>
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

export default RecordingPage;