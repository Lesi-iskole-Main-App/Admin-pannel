import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  useDeleteClassMutation,
  useGetAllClassesQuery,
  useCreateClassMutation,
  useGetClassByIdQuery,
  useUpdateClassMutation,
} from "../api/classApi";

import { useGetGradesQuery } from "../api/gradeSubjectApi";
import { useGetTeachersQuery } from "../api/teacherAssignmentApi";

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

const isALGrade = (gradeLike) =>
  gradeLike?.flowType === "al" ||
  gradeLike === "al" ||
  Number(gradeLike) === 12 ||
  Number(gradeLike) === 13;

const ClassPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const action = searchParams.get("action");
  const classId = searchParams.get("classId");

  const goList = () =>
    navigate({ pathname: "/lms/class", search: "" }, { replace: true });

  const openCreate = () =>
    navigate({ pathname: "/lms/class", search: "?action=create" });

  const openView = (id) =>
    navigate({
      pathname: "/lms/class",
      search: `?action=view&classId=${encodeURIComponent(id)}`,
    });

  const openUpdate = (id) =>
    navigate({
      pathname: "/lms/class",
      search: `?action=update&classId=${encodeURIComponent(id)}`,
    });

  const { data, isLoading, isError } = useGetAllClassesQuery();
  const [deleteClass, { isLoading: isDeleting }] = useDeleteClassMutation();
  const [createClass, { isLoading: isCreating }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdating }] = useUpdateClassMutation();

  const [currentPage, setCurrentPage] = useState(1);

  const shouldLoadDetails =
    (action === "view" || action === "update") && !!classId;

  const {
    data: classRes,
    isLoading: classLoading,
    isError: classError,
  } = useGetClassByIdQuery(classId, {
    skip: !shouldLoadDetails,
  });

  const {
    data: gradesRes,
    isLoading: gradesLoading,
    isError: gradesError,
  } = useGetGradesQuery(undefined, {
    skip: !(action === "create" || action === "update"),
  });

  const {
    data: teachersRes,
    isLoading: teachersLoading,
    isError: teachersError,
  } = useGetTeachersQuery(
    { status: "approved" },
    { skip: !(action === "create" || action === "update") }
  );

  const allGrades = gradesRes?.grades || [];
  const teachers = teachersRes?.teachers || [];

  const rows = useMemo(() => {
    const list = data?.classes || [];

    return list.map((c) => {
      const teacherNames =
        c?.teacherIds?.length > 0
          ? c.teacherIds.map((t) => t?.name).filter(Boolean).join(", ")
          : "No Teacher";

      const created = c?.createdAt ? new Date(c.createdAt) : null;
      const createdDate = created ? created.toISOString().slice(0, 10) : "-";
      const createdTime = created ? created.toTimeString().slice(0, 5) : "-";

      const gradeDisplay =
        c?.gradeLabel ||
        (c?.gradeId?.flowType === "al"
          ? "A/L"
          : c?.gradeId?.grade
          ? `Grade ${c.gradeId.grade}`
          : "—");

      const subjectDisplay =
        c?.gradeId?.flowType === "al"
          ? [c?.streamName, c?.subjectName].filter(Boolean).join(" / ") || "—"
          : c?.subjectName || "—";

      return {
        _id: c._id,
        className: c.className || "—",
        batchNumber: c.batchNumber || "—",
        grade: gradeDisplay,
        subject: subjectDisplay,
        teacherName: teacherNames,
        createdDate,
        createdTime,
        imageUrl: c.imageUrl || "",
      };
    });
  }, [data]);

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

  const [uploading, setUploading] = useState(false);

  const uploadClassImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
    const token = localStorage.getItem("token") || "";

    const res = await fetch(`${BACKEND_URL}/api/upload/class-image`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      body: formData,
      credentials: "include",
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Upload failed");
    return json;
  };

  const emptyForm = {
    className: "",
    batchNumber: "",
    gradeId: "",
    subjectId: "",
    streamId: "",
    streamSubjectId: "",
    teacherIds: [],
    imageUrl: "",
    imagePublicId: "",
  };

  const [form, setForm] = useState(emptyForm);

  const selectedGrade = useMemo(() => {
    return allGrades.find((g) => String(g?._id) === String(form.gradeId));
  }, [allGrades, form.gradeId]);

  const isAL = isALGrade(selectedGrade);

  const subjects = useMemo(() => {
    return Array.isArray(selectedGrade?.subjects) ? selectedGrade.subjects : [];
  }, [selectedGrade]);

  const streams = useMemo(() => {
    return Array.isArray(selectedGrade?.streams) ? selectedGrade.streams : [];
  }, [selectedGrade]);

  const selectedStream = useMemo(() => {
    return streams.find((s) => String(s?._id) === String(form.streamId));
  }, [streams, form.streamId]);

  const streamSubjects = useMemo(() => {
    return Array.isArray(selectedStream?.subjects) ? selectedStream.subjects : [];
  }, [selectedStream]);

  useEffect(() => {
    if (!form.gradeId) return;

    if (!isAL) {
      const validSubjectIds = new Set(subjects.map((s) => String(s?._id)));

      if (form.subjectId && !validSubjectIds.has(String(form.subjectId))) {
        setForm((p) => ({ ...p, subjectId: "" }));
      }

      if (form.streamId || form.streamSubjectId) {
        setForm((p) => ({
          ...p,
          streamId: "",
          streamSubjectId: "",
        }));
      }

      return;
    }

    const validStreamIds = new Set(streams.map((s) => String(s?._id)));

    if (form.streamId && !validStreamIds.has(String(form.streamId))) {
      setForm((p) => ({
        ...p,
        streamId: "",
        streamSubjectId: "",
      }));
    }

    if (form.subjectId) {
      setForm((p) => ({ ...p, subjectId: "" }));
    }
  }, [form.gradeId, isAL, subjects, streams]);

  useEffect(() => {
    if (!isAL) return;

    const validStreamSubjectIds = new Set(
      streamSubjects.map((s) => String(s?._id))
    );

    if (
      form.streamSubjectId &&
      !validStreamSubjectIds.has(String(form.streamSubjectId))
    ) {
      setForm((p) => ({ ...p, streamSubjectId: "" }));
    }
  }, [isAL, streamSubjects, form.streamSubjectId]);

  useEffect(() => {
    if (action === "create") {
      setForm(emptyForm);
    }
  }, [action]);

  useEffect(() => {
    if (action !== "update") return;
    const c = classRes?.class;
    if (!c) return;

    setForm({
      className: c?.className || "",
      batchNumber: c?.batchNumber || "",
      gradeId: c?.gradeId?._id || c?.gradeId || "",
      subjectId: c?.subjectId || "",
      streamId: c?.streamId || "",
      streamSubjectId: c?.streamSubjectId || "",
      teacherIds: (c?.teacherIds || []).map((t) => t?._id).filter(Boolean),
      imageUrl: c?.imageUrl || "",
      imagePublicId: c?.imagePublicId || "",
    });
  }, [action, classRes]);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      await deleteClass(id).unwrap();
    } catch (e) {
      alert(e?.data?.message || "Delete failed");
    }
  };

  const validateForm = () => {
    if (!form.className || !form.batchNumber || !form.gradeId) {
      alert("className, batchNumber and grade are required");
      return false;
    }

    if (isAL) {
      if (!form.streamId || !form.streamSubjectId) {
        alert("For A/L classes, stream and subject are required");
        return false;
      }
    } else {
      if (!form.subjectId) {
        alert("For other grades, subject is required");
        return false;
      }
    }

    return true;
  };

  const buildPayload = () => {
    const payload = {
      className: form.className,
      batchNumber: form.batchNumber,
      gradeId: form.gradeId,
      teacherIds: form.teacherIds || [],
      imageUrl: form.imageUrl,
      imagePublicId: form.imagePublicId,
      subjectId: null,
      streamId: null,
      streamSubjectId: null,
    };

    if (isAL) {
      payload.streamId = form.streamId;
      payload.streamSubjectId = form.streamSubjectId;
    } else {
      payload.subjectId = form.subjectId;
    }

    return payload;
  };

  const submitCreate = async () => {
    if (!validateForm()) return;

    try {
      await createClass(buildPayload()).unwrap();
      goList();
      setCurrentPage(1);
    } catch (e) {
      alert(e?.data?.message || "Create failed");
    }
  };

  const submitUpdate = async () => {
    if (!classId) return;
    if (!validateForm()) return;

    try {
      await updateClass({
        classId,
        body: buildPayload(),
      }).unwrap();
      goList();
    } catch (e) {
      alert(e?.data?.message || "Update failed");
    }
  };

  const ImageUploader = ({ inputId }) => {
    const onPickFile = async (file) => {
      if (!file) return;
      if (!file.type?.startsWith("image/")) {
        alert("Only image files allowed");
        return;
      }

      try {
        setUploading(true);
        const up = await uploadClassImage(file);

        setForm((p) => ({
          ...p,
          imageUrl: up.url || "",
          imagePublicId: up.publicId || "",
        }));
      } catch (err) {
        alert(err?.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Class Image
        </label>

        <div
          className="mt-2 w-full cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-4 text-center transition hover:border-blue-400"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            onPickFile(file);
          }}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <div className="text-sm font-medium text-gray-700">
            {uploading ? "Uploading..." : "Drop image here or click to upload"}
          </div>

          {form.imageUrl ? (
            <div className="mt-3 flex items-center justify-center gap-3">
              <img
                src={form.imageUrl}
                alt="preview"
                className="h-16 w-16 rounded-lg border object-cover"
              />
              <div className="text-left">
                <div className="text-[11px] font-medium text-gray-700">
                  Uploaded
                </div>
                <div className="max-w-[320px] break-all text-[10px] text-gray-500">
                  {form.imageUrl}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            onPickFile(file);
            e.target.value = "";
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex w-full justify-center ">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Class Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage classes, batch numbers, subjects, teachers, and class images.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
              onClick={openCreate}
            >
              + Add Class
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
          <ModalShell title="View Class" onClose={goList}>
            {!classId ? (
              <div className="text-sm text-red-600">Missing classId</div>
            ) : classLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : classError ? (
              <div className="text-sm text-red-600">Failed to load class</div>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-sm font-medium text-gray-700">Class Name</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {classRes?.class?.className || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Batch Number</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {classRes?.class?.batchNumber || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Grade</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {classRes?.class?.gradeLabel ||
                      (classRes?.class?.gradeId?.flowType === "al"
                        ? "A/L"
                        : classRes?.class?.gradeId?.grade
                        ? `Grade ${classRes.class.gradeId.grade}`
                        : "—")}
                  </div>
                </div>

                {classRes?.class?.gradeId?.flowType === "al" && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Stream</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {classRes?.class?.streamName || "—"}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-gray-700">Subject</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {classRes?.class?.subjectName || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Teachers</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {(classRes?.class?.teacherIds || [])
                      .map((t) => t?.name)
                      .filter(Boolean)
                      .join(", ") || "No Teacher"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Image</div>
                  {classRes?.class?.imageUrl ? (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={classRes.class.imageUrl}
                        alt="class"
                        className="h-16 w-16 rounded-lg border object-cover"
                      />
                      <a
                        href={classRes.class.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-[11px] text-blue-600 underline"
                      >
                        {classRes.class.imageUrl}
                      </a>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-gray-400">No image</div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    onClick={() => openUpdate(classId)}
                  >
                    Update
                  </button>
                </div>
              </div>
            )}
          </ModalShell>
        )}

        {action === "update" && (
          <ModalShell title="Update Class" onClose={goList}>
            {!classId ? (
              <div className="text-sm text-red-600">Missing classId</div>
            ) : classLoading || gradesLoading || teachersLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : classError ? (
              <div className="text-sm text-red-600">Failed to load class</div>
            ) : gradesError ? (
              <div className="text-sm text-red-600">Failed to load grades</div>
            ) : teachersError ? (
              <div className="text-sm text-red-600">Failed to load teachers</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class Name
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.className}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, className: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Batch Number
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.batchNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, batchNumber: e.target.value }))
                    }
                    placeholder="Enter batch number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Grade
                  </label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.gradeId}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        gradeId: e.target.value,
                        subjectId: "",
                        streamId: "",
                        streamSubjectId: "",
                      }))
                    }
                  >
                    <option value="">Select Grade</option>
                    {allGrades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g?.flowType === "al"
                          ? g?.title || "A/L"
                          : g?.grade
                          ? `Grade ${g.grade}`
                          : g?.title || "—"}
                      </option>
                    ))}
                  </select>
                </div>

                {!isAL ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.subjectId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, subjectId: e.target.value }))
                      }
                      disabled={!form.gradeId}
                    >
                      <option value="">
                        {form.gradeId ? "Select Subject" : "Select grade first"}
                      </option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.subject}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Stream
                      </label>
                      <select
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={form.streamId}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            streamId: e.target.value,
                            streamSubjectId: "",
                          }))
                        }
                        disabled={!form.gradeId}
                      >
                        <option value="">
                          {form.gradeId ? "Select Stream" : "Select grade first"}
                        </option>
                        {streams.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.stream}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <select
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={form.streamSubjectId}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            streamSubjectId: e.target.value,
                          }))
                        }
                        disabled={!form.streamId}
                      >
                        <option value="">
                          {form.streamId ? "Select Subject" : "Select stream first"}
                        </option>
                        {streamSubjects.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.subject}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teachers
                  </label>
                  <select
                    multiple
                    className="mt-2 min-h-[120px] w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.teacherIds}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions).map(
                        (o) => o.value
                      );
                      setForm((p) => ({ ...p, teacherIds: values }));
                    }}
                  >
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <ImageUploader inputId="class-image-input-update" />

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
                    disabled={isUpdating || uploading}
                  >
                    {uploading ? "Uploading..." : isUpdating ? "Updating..." : "Update"}
                  </button>
                </div>
              </div>
            )}
          </ModalShell>
        )}

        {action === "create" && (
          <ModalShell title="Create Class" onClose={goList}>
            {gradesLoading || teachersLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : gradesError ? (
              <div className="text-sm text-red-600">Failed to load grades</div>
            ) : teachersError ? (
              <div className="text-sm text-red-600">Failed to load teachers</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class Name
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.className}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, className: e.target.value }))
                    }
                    placeholder="Enter class name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Batch Number
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.batchNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, batchNumber: e.target.value }))
                    }
                    placeholder="Enter batch number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Grade
                  </label>
                  <select
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.gradeId}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        gradeId: e.target.value,
                        subjectId: "",
                        streamId: "",
                        streamSubjectId: "",
                      }))
                    }
                  >
                    <option value="">Select Grade</option>
                    {allGrades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g?.flowType === "al"
                          ? g?.title || "A/L"
                          : g?.grade
                          ? `Grade ${g.grade}`
                          : g?.title || "—"}
                      </option>
                    ))}
                  </select>
                </div>

                {!isAL ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      value={form.subjectId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, subjectId: e.target.value }))
                      }
                      disabled={!form.gradeId}
                    >
                      <option value="">
                        {form.gradeId ? "Select Subject" : "Select grade first"}
                      </option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.subject}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Stream
                      </label>
                      <select
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={form.streamId}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            streamId: e.target.value,
                            streamSubjectId: "",
                          }))
                        }
                        disabled={!form.gradeId}
                      >
                        <option value="">
                          {form.gradeId ? "Select Stream" : "Select grade first"}
                        </option>
                        {streams.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.stream}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <select
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={form.streamSubjectId}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            streamSubjectId: e.target.value,
                          }))
                        }
                        disabled={!form.streamId}
                      >
                        <option value="">
                          {form.streamId ? "Select Subject" : "Select stream first"}
                        </option>
                        {streamSubjects.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.subject}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teachers
                  </label>
                  <select
                    multiple
                    className="mt-2 min-h-[120px] w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.teacherIds}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions).map(
                        (o) => o.value
                      );
                      setForm((p) => ({ ...p, teacherIds: values }));
                    }}
                  >
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <ImageUploader inputId="class-image-input-create" />

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
                    disabled={isCreating || uploading}
                  >
                    {uploading ? "Uploading..." : isCreating ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            )}
          </ModalShell>
        )}

        <div className="mt-5 overflow-hidden border border-gray-200 bg-white">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1320px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#F8FAFC] text-left text-[13px] font-medium text-gray-600">
                  <th className="w-[14%] border-b border-r border-gray-200 px-4 py-3">Class Name</th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">Batch Number</th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">Grade</th>
                  <th className="w-[14%] border-b border-r border-gray-200 px-4 py-3">Subject</th>
                  <th className="w-[18%] border-b border-r border-gray-200 px-4 py-3">Teacher Name</th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">Image</th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">Created Date</th>
                  <th className="w-[8%] border-b border-r border-gray-200 px-4 py-3">Time</th>
                  <th className="w-[10%] border-b border-gray-200 px-4 py-3 text-center">Operation</th>
                </tr>
              </thead>

              <tbody className="bg-white text-sm text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-red-600">
                      Failed to load classes
                    </td>
                  </tr>
                ) : totalRows === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No class records found
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/70">
                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate font-medium text-gray-800">{r.className}</div>
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
                        <div className="truncate">{r.teacherName}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        {r.imageUrl ? (
                          <div className="flex items-center">
                            <img
                              src={r.imageUrl}
                              alt="class"
                              className="h-10 w-10 rounded-lg border object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No image</span>
                        )}
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.createdDate}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{r.createdTime}</div>
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <IconButton title="View" onClick={() => openView(r._id)}>
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

                          <IconButton title="Update" onClick={() => openUpdate(r._id)}>
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
                            onClick={() => onDelete(r._id)}
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

export default ClassPage;