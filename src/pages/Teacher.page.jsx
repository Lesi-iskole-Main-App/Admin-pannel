import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetTeachersQuery,
  useGetTeacherFormDataQuery,
  useAssignTeacherMutation,
  useReplaceTeacherAssignmentsMutation,
} from "../api/teacherAssignmentApi";

const emptyRowId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const buildClassLabel = (cls) => {
  const parts = [
    cls?.className || "",
    cls?.batchNumber ? `Batch ${cls.batchNumber}` : "",
    cls?.gradeLabel || "",
    cls?.stream || "",
    cls?.subjectName || "",
  ].filter(Boolean);

  return parts.join(" • ");
};

const TeacherPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editTeacherId = searchParams.get("teacherId") || "";
  const isEditMode = !!editTeacherId;

  const [selectedTeacherId, setSelectedTeacherId] = useState(editTeacherId || "");
  const [rows, setRows] = useState([{ id: emptyRowId(), classId: "" }]);

  const {
    data: teachersData,
    isLoading: teachersLoading,
    isError: teachersError,
    error: teachersErrObj,
    refetch: refetchTeachers,
  } = useGetTeachersQuery({ status: "approved" });

  const teachers = teachersData?.teachers || [];

  const {
    data: formData,
    isLoading: formLoading,
    isError: formError,
    error: formErrObj,
    refetch: refetchForm,
  } = useGetTeacherFormDataQuery(selectedTeacherId, { skip: !selectedTeacherId });

  const teacher = formData?.teacher || null;
  const availableClasses = formData?.availableClasses || [];
  const assignedClasses = formData?.assignedClasses || [];

  useEffect(() => {
    setSelectedTeacherId(editTeacherId || "");
  }, [editTeacherId]);

  useEffect(() => {
    if (!selectedTeacherId) {
      setRows([{ id: emptyRowId(), classId: "" }]);
      return;
    }

    if (isEditMode) {
      if (assignedClasses.length > 0) {
        setRows(
          assignedClasses.map((c) => ({
            id: emptyRowId(),
            classId: c._id,
          }))
        );
      } else {
        setRows([{ id: emptyRowId(), classId: "" }]);
      }
      return;
    }

    setRows([{ id: emptyRowId(), classId: "" }]);
  }, [selectedTeacherId, isEditMode, assignedClasses]);

  const [assignTeacher, { isLoading: assigning }] = useAssignTeacherMutation();
  const [replaceTeacherAssignments, { isLoading: replacing }] =
    useReplaceTeacherAssignmentsMutation();

  const busy = assigning || replacing;

  const selectedClassIds = useMemo(
    () =>
      rows
        .map((r) => String(r.classId || "").trim())
        .filter(Boolean),
    [rows]
  );

  const uniqueClassIds = Array.from(new Set(selectedClassIds));

  const selectedClassObjects = useMemo(() => {
    const map = new Map(availableClasses.map((c) => [String(c._id), c]));
    return uniqueClassIds.map((id) => map.get(String(id))).filter(Boolean);
  }, [uniqueClassIds, availableClasses]);

  const addRow = () => {
    setRows((prev) => [...prev, { id: emptyRowId(), classId: "" }]);
  };

  const removeRow = (rowId) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== rowId);
      return next.length ? next : [{ id: emptyRowId(), classId: "" }];
    });
  };

  const updateRow = (rowId, classId) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, classId } : r))
    );
  };

  const clearEdit = () => {
    navigate("/teacher/list");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTeacherId) return alert("Select teacher");
    if (uniqueClassIds.length === 0) return alert("Select at least one class");

    try {
      const payload = { classIds: uniqueClassIds };

      if (isEditMode) {
        await replaceTeacherAssignments({
          teacherId: selectedTeacherId,
          body: payload,
        }).unwrap();

        alert("Teacher classes updated successfully");
      } else {
        await assignTeacher({
          teacherId: selectedTeacherId,
          body: payload,
        }).unwrap();

        alert("Teacher classes assigned successfully");
      }

      refetchForm();
      navigate("/teacher/view");
    } catch (err) {
      alert(String(err?.data?.message || err?.error || "Assignment failed"));
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-3 py-6">
      <div className="w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Teacher Assignment Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Assign multiple classes to teachers. Class grade, stream and subject
              are auto-used from your existing class data.
            </p>
          </div>

          <div className="flex items-center gap-2 self-center sm:self-auto">
            {isEditMode && (
              <button
                type="button"
                onClick={clearEdit}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Clear Edit
              </button>
            )}

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

        <div className="border border-gray-200 bg-white p-4 sm:p-6">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teacher Name
                </label>

                <div className="mt-2 flex gap-2">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    disabled={isEditMode}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50"
                  >
                    <option value="">
                      {teachersLoading ? "Loading..." : "Select Teacher"}
                    </option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={refetchTeachers}
                    className="rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>

                {teachersError && (
                  <div className="mt-2 text-xs text-red-600">
                    {String(
                      teachersErrObj?.data?.message ||
                        teachersErrObj?.error ||
                        "Failed"
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={teacher?.whatsapp || teacher?.phonenumber || ""}
                  readOnly
                  placeholder={formLoading ? "Loading..." : "Auto fill"}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm outline-none"
                />
                {formError && (
                  <div className="mt-2 text-xs text-red-600">
                    {String(
                      formErrObj?.data?.message || formErrObj?.error || "Failed"
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    Classes
                  </div>
                  <div className="text-xs text-gray-500">
                    Select one or more classes for this teacher
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addRow}
                  disabled={!selectedTeacherId || formLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  Add Class
                </button>
              </div>

              <div className="space-y-4">
                {rows.map((row, index) => {
                  const selectedClass = availableClasses.find(
                    (c) => String(c._id) === String(row.classId)
                  );

                  return (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Class {index + 1}
                          </label>
                          <select
                            value={row.classId}
                            onChange={(e) => updateRow(row.id, e.target.value)}
                            disabled={!selectedTeacherId || formLoading}
                            className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50"
                          >
                            <option value="">Select Class</option>
                            {availableClasses.map((cls) => (
                              <option key={cls._id} value={cls._id}>
                                {buildClassLabel(cls)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {selectedClass && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                            {selectedClass.gradeLabel}
                          </span>

                          {!!selectedClass.stream && (
                            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                              {selectedClass.stream}
                            </span>
                          )}

                          {!!selectedClass.subjectName && (
                            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                              {selectedClass.subjectName}
                            </span>
                          )}

                          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {selectedClass.className}
                            {selectedClass.batchNumber
                              ? ` • Batch ${selectedClass.batchNumber}`
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedClassObjects.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-3 text-sm font-semibold text-gray-800">
                  Selected Class Summary
                </div>

                <div className="space-y-3">
                  {selectedClassObjects.map((cls) => (
                    <div
                      key={cls._id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {cls.className}
                        {cls.batchNumber ? ` • Batch ${cls.batchNumber}` : ""}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                          {cls.gradeLabel}
                        </span>

                        {!!cls.stream && (
                          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                            {cls.stream}
                          </span>
                        )}

                        {!!cls.subjectName && (
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            {cls.subjectName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-8 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {busy
                  ? "Submitting..."
                  : isEditMode
                  ? "Update Teacher Classes"
                  : "Assign Teacher Classes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;