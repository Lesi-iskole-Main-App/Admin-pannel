import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetGradesQuery,
  useCreateGradeMutation,
  useDeleteGradeMutation,

  useGetSubjectsByGradeQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,

  useGetStreamsByGradeQuery,

  useGetStreamSubjectsQuery,
  useCreateStreamSubjectMutation,
  useUpdateStreamSubjectMutation,
  useDeleteStreamSubjectMutation,
} from "../api/gradeSubjectApi";

const ROWS_PER_PAGE = 20;

const AL_STREAM_ORDER = [
  "physical_science",
  "biological_science",
  "commerce",
  "arts",
  "technology",
  "common",
];

const AL_STREAM_LABELS = {
  physical_science: "Physical Science",
  biological_science: "Biological Science",
  commerce: "Commerce",
  arts: "Arts",
  technology: "Technology",
  common: "Common",
};

const getStreamLabel = (value) =>
  AL_STREAM_LABELS[String(value || "").trim()] || String(value || "").trim();

const sortStreams = (streams = []) => {
  const orderMap = new Map(AL_STREAM_ORDER.map((x, i) => [x, i]));
  return [...streams].sort((a, b) => {
    const aRank = orderMap.has(a?.stream) ? orderMap.get(a.stream) : 999;
    const bRank = orderMap.has(b?.stream) ? orderMap.get(b.stream) : 999;
    if (aRank !== bRank) return aRank - bRank;
    return String(a?.stream || "").localeCompare(String(b?.stream || ""));
  });
};

const uniqueSubjects = (items = []) => {
  const used = new Set();
  const out = [];

  for (const item of items) {
    const subject = String(item?.subject || "").trim();
    const key = subject.toLowerCase();
    if (!subject || used.has(key)) continue;
    used.add(key);
    out.push(subject);
  }

  return out.sort((a, b) => a.localeCompare(b));
};

/* ---------------------- PROFESSIONAL MODAL ---------------------- */
const Modal = ({ open, title, children, onClose, maxWidth = "max-w-lg" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-3">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#F8FAFC] px-4 py-4 sm:px-6">
          <div className="text-base font-semibold text-gray-800">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

const gradeOptions = Array.from({ length: 11 }, (_, i) => i + 1);

/* -------------------- Modal: Grade 1–11 Subjects -------------------- */
function GradeSubjectsModal({ open, grade, onClose }) {
  const gradeId = grade?._id;
  const enabled = open && gradeId;

  const { data, isLoading } = useGetSubjectsByGradeQuery(gradeId, {
    skip: !enabled,
  });

  const subjects = data?.subjects || [];

  const [createSubject] = useCreateSubjectMutation();
  const [updateSubject] = useUpdateSubjectMutation();
  const [deleteSubject] = useDeleteSubjectMutation();

  const [newSubject, setNewSubject] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const add = async () => {
    const name = newSubject.trim();
    if (!name) return;

    try {
      await createSubject({ gradeId, subject: name }).unwrap();
      setNewSubject("");
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  const startEdit = (s) => {
    setEditId(s._id);
    setEditValue(s.subject);
  };

  const saveEdit = async () => {
    const name = editValue.trim();
    if (!name) return;

    try {
      await updateSubject({
        gradeId,
        subjectId: editId,
        subject: name,
      }).unwrap();
      setEditId(null);
      setEditValue("");
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  const remove = async (subjectId) => {
    const ok = window.confirm("Delete subject?");
    if (!ok) return;

    try {
      await deleteSubject({ gradeId, subjectId }).unwrap();
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  return (
    <Modal
      open={open}
      title={`${grade?.title || `Grade ${grade?.grade}`} Subjects`}
      onClose={onClose}
    >
      <div className="flex gap-2">
        <input
          className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="New subject"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
        />
        <button
          onClick={add}
          className="rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : subjects.length === 0 ? (
          <div className="text-sm text-gray-500">No subjects</div>
        ) : (
          subjects.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between gap-2 border border-gray-200 bg-white px-3 py-2"
            >
              {editId === s._id ? (
                <input
                  className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              ) : (
                <span className="text-sm font-medium text-gray-800">
                  {s.subject}
                </span>
              )}

              <div className="flex gap-2">
                {editId === s._id ? (
                  <button
                    onClick={saveEdit}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(s)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                  >
                    Edit
                  </button>
                )}

                <button
                  onClick={() => remove(s._id)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

/* -------------------- Modal: A/L Stream Subjects -------------------- */
function ALStreamSubjectsModal({ open, grade, onClose }) {
  const gradeId = grade?._id;
  const enabled = open && gradeId;

  const { data: streamsData, isLoading: streamsLoading } = useGetStreamsByGradeQuery(
    gradeId,
    { skip: !enabled }
  );

  const streams = useMemo(
    () => sortStreams(streamsData?.streams || []),
    [streamsData]
  );

  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [selectedExistingSubject, setSelectedExistingSubject] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (open && streams.length > 0 && !selectedStreamId) {
      setSelectedStreamId(streams[0]._id);
    }

    if (!open) {
      setSelectedStreamId("");
      setNewSubject("");
      setSelectedExistingSubject("");
      setEditId(null);
      setEditValue("");
    }
  }, [open, streams, selectedStreamId]);

  useEffect(() => {
    setNewSubject("");
    setSelectedExistingSubject("");
    setEditId(null);
    setEditValue("");
  }, [selectedStreamId]);

  const selectedStream = useMemo(
    () => streams.find((s) => s._id === selectedStreamId) || null,
    [streams, selectedStreamId]
  );

  const { data: streamSubjectsData, isLoading: streamSubjectsLoading } =
    useGetStreamSubjectsQuery(
      { gradeId, streamId: selectedStreamId },
      { skip: !enabled || !selectedStreamId }
    );

  const subjects = streamSubjectsData?.subjects || [];

  const [createStreamSubject] = useCreateStreamSubjectMutation();
  const [updateStreamSubject] = useUpdateStreamSubjectMutation();
  const [deleteStreamSubject] = useDeleteStreamSubjectMutation();

  const assignableSubjects = useMemo(() => {
    const currentKeys = new Set(
      (subjects || []).map((s) => String(s?.subject || "").trim().toLowerCase())
    );

    const fromOtherStreams = [];

    for (const st of streams) {
      if (st._id === selectedStreamId) continue;

      for (const sub of st?.subjects || []) {
        const subject = String(sub?.subject || "").trim();
        const key = subject.toLowerCase();
        if (!subject || currentKeys.has(key)) continue;
        fromOtherStreams.push({ subject });
      }
    }

    return uniqueSubjects(fromOtherStreams);
  }, [streams, selectedStreamId, subjects]);

  const addNewSubject = async () => {
    if (!selectedStreamId) {
      alert("Select a stream");
      return;
    }

    const name = newSubject.trim();
    if (!name) return;

    try {
      await createStreamSubject({
        gradeId,
        streamId: selectedStreamId,
        subject: name,
      }).unwrap();
      setNewSubject("");
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  const assignExistingSubject = async () => {
    if (!selectedStreamId) {
      alert("Select a stream");
      return;
    }

    const subject = String(selectedExistingSubject || "").trim();
    if (!subject) {
      alert("Select existing subject");
      return;
    }

    try {
      await createStreamSubject({
        gradeId,
        streamId: selectedStreamId,
        subject,
      }).unwrap();
      setSelectedExistingSubject("");
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  const startEdit = (s) => {
    setEditId(s._id);
    setEditValue(s.subject);
  };

  const saveEdit = async () => {
    const name = editValue.trim();
    if (!name) return;

    try {
      await updateStreamSubject({
        gradeId,
        streamId: selectedStreamId,
        subjectId: editId,
        subject: name,
      }).unwrap();
      setEditId(null);
      setEditValue("");
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  const remove = async (subjectId) => {
    const ok = window.confirm("Delete stream subject?");
    if (!ok) return;

    try {
      await deleteStreamSubject({
        gradeId,
        streamId: selectedStreamId,
        subjectId,
      }).unwrap();
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  return (
    <Modal open={open} title="A/L Stream Subjects" onClose={onClose} maxWidth="max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Select Stream
        </label>

        {streamsLoading ? (
          <div className="mt-2 text-sm text-gray-500">Loading streams...</div>
        ) : (
          <select
            className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            value={selectedStreamId}
            onChange={(e) => setSelectedStreamId(e.target.value)}
          >
            <option value="">Select Stream</option>
            {streams.map((st) => (
              <option key={st._id} value={st._id}>
                {getStreamLabel(st.stream)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="block text-sm font-medium text-gray-700">
            Create New Subject
          </label>
          <input
            className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Type new subject"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            disabled={!selectedStreamId}
          />
          <button
            type="button"
            onClick={addNewSubject}
            disabled={!selectedStreamId}
            className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Add New Subject
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="block text-sm font-medium text-gray-700">
            Assign Existing Subject From Other Stream
          </label>
          <select
            className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            value={selectedExistingSubject}
            onChange={(e) => setSelectedExistingSubject(e.target.value)}
            disabled={!selectedStreamId}
          >
            <option value="">Select existing subject</option>
            {assignableSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={assignExistingSubject}
            disabled={!selectedStreamId}
            className="mt-3 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            Assign Subject
          </button>
        </div>
      </div>

      {selectedStream && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Selected Stream: <span className="font-semibold">{getStreamLabel(selectedStream.stream)}</span>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {!selectedStreamId ? (
          <div className="text-sm text-gray-500">
            Select a stream to view subjects
          </div>
        ) : streamSubjectsLoading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : subjects.length === 0 ? (
          <div className="text-sm text-gray-500">No subjects</div>
        ) : (
          subjects.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between gap-2 border border-gray-200 bg-white px-3 py-2"
            >
              {editId === s._id ? (
                <input
                  className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              ) : (
                <span className="text-sm font-medium text-gray-800">
                  {s.subject}
                </span>
              )}

              <div className="flex gap-2">
                {editId === s._id ? (
                  <button
                    onClick={saveEdit}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(s)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                  >
                    Edit
                  </button>
                )}

                <button
                  onClick={() => remove(s._id)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

/* --------------------- Main Page --------------------- */
const GradeSubjectPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useGetGradesQuery();

  const grades = data?.grades || [];

  const [createGrade] = useCreateGradeMutation();
  const [deleteGrade] = useDeleteGradeMutation();
  const [createSubject] = useCreateSubjectMutation();

  const [topOpen, setTopOpen] = useState(false);
  const [topGradeNumber, setTopGradeNumber] = useState("");
  const [topName, setTopName] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addGradeDoc, setAddGradeDoc] = useState(null);
  const [addValue, setAddValue] = useState("");

  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [alSubjectsOpen, setAlSubjectsOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);

  const [page1, setPage1] = useState(1);

  const grade1to11 = useMemo(
    () =>
      grades
        .filter((g) => g.flowType === "normal")
        .sort((a, b) => Number(a.grade) - Number(b.grade)),
    [grades]
  );

  const alGrade = useMemo(
    () => grades.find((g) => g.flowType === "al") || null,
    [grades]
  );

  const totalPages1 = Math.max(1, Math.ceil(grade1to11.length / ROWS_PER_PAGE));

  const rows1 = useMemo(() => {
    const start = (page1 - 1) * ROWS_PER_PAGE;
    return grade1to11.slice(start, start + ROWS_PER_PAGE);
  }, [grade1to11, page1]);

  const submitTop = async () => {
    const raw = String(topGradeNumber || "").trim();

    if (!raw) {
      alert("Select grade");
      return;
    }

    try {
      if (raw === "al") {
        await createGrade({ grade: "al", flowType: "al" }).unwrap();
        setTopOpen(false);
        setTopGradeNumber("");
        setTopName("");
        return;
      }

      const g = Number(raw);
      if (!g || g < 1 || g > 11) {
        alert("Select valid grade");
        return;
      }

      let gradeDoc = grades.find(
        (x) => x.flowType === "normal" && Number(x.grade) === g
      );

      if (!gradeDoc) {
        const res = await createGrade({
          grade: g,
          flowType: "normal",
        }).unwrap();
        gradeDoc = res?.grade;
        await refetch();
      }

      if (!gradeDoc?._id) {
        alert("Grade create failed");
        return;
      }

      const name = topName.trim();
      if (!name) {
        alert("Subject required");
        return;
      }

      await createSubject({ gradeId: gradeDoc._id, subject: name }).unwrap();

      setTopOpen(false);
      setTopGradeNumber("");
      setTopName("");
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  const openAddForRow = (g) => {
    setAddGradeDoc(g);
    setAddValue("");
    setAddOpen(true);
  };

  const submitAddForRow = async () => {
    if (!addGradeDoc) return;

    const name = addValue.trim();
    if (!name) {
      alert("Subject required");
      return;
    }

    try {
      await createSubject({
        gradeId: addGradeDoc._id,
        subject: name,
      }).unwrap();

      setAddOpen(false);
      setAddGradeDoc(null);
      setAddValue("");
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  const removeGrade = async (g) => {
    const ok = window.confirm(`Delete ${g?.title || `Grade ${g?.grade}`}?`);
    if (!ok) return;

    try {
      await deleteGrade({ gradeId: g._id }).unwrap();
      await refetch();
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Failed"));
    }
  };

  return (
    <div className="flex w-full justify-center ">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Grade & Subject Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage grades, subjects, and A/L stream subjects.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTopOpen(true)}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              + Add Grade
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

        {/* TABLE 1 */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800">Grades 1 - 11</h2>

          <div className="mt-3 overflow-hidden border border-gray-200 bg-white">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px] table-fixed border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#F8FAFC] text-left text-[13px] font-medium text-gray-600">
                    <th className="w-[35%] border-b border-r border-gray-200 px-4 py-3">
                      Grade
                    </th>
                    <th className="w-[25%] border-b border-r border-gray-200 px-4 py-3 text-center">
                      Subject
                    </th>
                    <th className="w-[40%] border-b border-gray-200 px-4 py-3 text-center">
                      Operation
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white text-sm text-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : rows1.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        No grades
                      </td>
                    </tr>
                  ) : (
                    rows1.map((g) => (
                      <tr key={g._id} className="hover:bg-gray-50/70">
                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                          <div className="truncate font-medium text-gray-800">
                            {g.title || `Grade ${g.grade}`}
                          </div>
                        </td>

                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle text-center">
                          <button
                            onClick={() => {
                              setSelectedGrade(g);
                              setSubjectsOpen(true);
                            }}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                          >
                            View
                          </button>
                        </td>

                        <td className="border-b border-gray-200 px-4 py-4 align-middle">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              onClick={() => openAddForRow(g)}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
                            >
                              Add Subject
                            </button>
                            <button
                              onClick={() => removeGrade(g)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                            >
                              Delete Grade
                            </button>
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
                {grade1to11.length === 0
                  ? "0 to 0 of 0"
                  : `${(page1 - 1) * ROWS_PER_PAGE + 1} to ${Math.min(
                      page1 * ROWS_PER_PAGE,
                      grade1to11.length
                    )} of ${grade1to11.length}`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage1(1)}
                  disabled={page1 === 1}
                  className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-gray-200 px-2 disabled:opacity-50"
                >
                  {"<<"}
                </button>
                <button
                  type="button"
                  onClick={() => setPage1((p) => Math.max(1, p - 1))}
                  disabled={page1 === 1}
                  className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-gray-200 px-2 disabled:opacity-50"
                >
                  {"<"}
                </button>
                <span className="px-2 text-sm font-medium text-gray-700">
                  Page {page1} of {totalPages1}
                </span>
                <button
                  type="button"
                  onClick={() => setPage1((p) => Math.min(totalPages1, p + 1))}
                  disabled={page1 === totalPages1}
                  className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-gray-200 px-2 disabled:opacity-50"
                >
                  {">"}
                </button>
                <button
                  type="button"
                  onClick={() => setPage1(totalPages1)}
                  disabled={page1 === totalPages1}
                  className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-gray-200 px-2 disabled:opacity-50"
                >
                  {">>"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE 2 */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800">A/L Flow</h2>

          <div className="mt-3 overflow-hidden border border-gray-200 bg-white">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1100px] table-fixed border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#F8FAFC] text-left text-[13px] font-medium text-gray-600">
                    <th className="w-[20%] border-b border-r border-gray-200 px-4 py-3">
                      Flow
                    </th>
                    <th className="w-[35%] border-b border-r border-gray-200 px-4 py-3">
                      Streams
                    </th>
                    <th className="w-[20%] border-b border-r border-gray-200 px-4 py-3 text-center">
                      Subjects
                    </th>
                    <th className="w-[25%] border-b border-gray-200 px-4 py-3 text-center">
                      Operation
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white text-sm text-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : !alGrade ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        A/L flow not created yet
                      </td>
                    </tr>
                  ) : (
                    <ALRow
                      grade={alGrade}
                      onManageSubjects={() => {
                        setSelectedGrade(alGrade);
                        setAlSubjectsOpen(true);
                      }}
                      onDelete={() => removeGrade(alGrade)}
                    />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TOP ADD MODAL */}
        <Modal
          open={topOpen}
          title="Add Grade / A/L Flow"
          onClose={() => {
            setTopOpen(false);
            setTopGradeNumber("");
            setTopName("");
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Grade
              </label>
              <select
                value={topGradeNumber}
                onChange={(e) => setTopGradeNumber(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Select Grade</option>
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
                <option value="al">A/L</option>
              </select>
            </div>

            {topGradeNumber && topGradeNumber !== "al" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subject Name
                </label>
                <input
                  value={topName}
                  onChange={(e) => setTopName(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. Science"
                />
              </div>
            )}

            {topGradeNumber === "al" && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                A/L will be created as one single flow with predefined streams:
                <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  <div>• Physical Science</div>
                  <div>• Biological Science</div>
                  <div>• Commerce</div>
                  <div>• Arts</div>
                  <div>• Technology</div>
                  <div>• Common</div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                onClick={() => {
                  setTopOpen(false);
                  setTopGradeNumber("");
                  setTopName("");
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                onClick={submitTop}
              >
                Save
              </button>
            </div>
          </div>
        </Modal>

        {/* ADD SUBJECT MODAL */}
        <Modal
          open={addOpen}
          title={
            addGradeDoc
              ? `Add Subject (${addGradeDoc.title || `Grade ${addGradeDoc.grade}`})`
              : "Add"
          }
          onClose={() => {
            setAddOpen(false);
            setAddGradeDoc(null);
            setAddValue("");
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject Name
              </label>
              <input
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="e.g. Science"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                onClick={() => {
                  setAddOpen(false);
                  setAddGradeDoc(null);
                  setAddValue("");
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                onClick={submitAddForRow}
              >
                Add
              </button>
            </div>
          </div>
        </Modal>

        {/* VIEW MODALS */}
        <GradeSubjectsModal
          open={subjectsOpen}
          grade={selectedGrade}
          onClose={() => {
            setSubjectsOpen(false);
            setSelectedGrade(null);
          }}
        />

        <ALStreamSubjectsModal
          open={alSubjectsOpen}
          grade={selectedGrade}
          onClose={() => {
            setAlSubjectsOpen(false);
            setSelectedGrade(null);
          }}
        />
      </div>
    </div>
  );
};

/* --------------------- A/L ROW --------------------- */
function ALRow({ grade, onManageSubjects, onDelete }) {
  const { data, isLoading } = useGetStreamsByGradeQuery(grade._id);
  const streams = useMemo(() => sortStreams(data?.streams || []), [data]);

  return (
    <tr className="hover:bg-gray-50/70">
      <td className="border-b border-r border-gray-200 px-4 py-4 align-top">
        <div className="truncate font-medium text-gray-800">
          {grade?.title || "A/L"}
        </div>
      </td>

      <td className="border-b border-r border-gray-200 px-4 py-4 align-top">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : streams.length === 0 ? (
          <div className="text-sm text-gray-500">No streams</div>
        ) : (
          <div className="space-y-2">
            {streams.map((st) => (
              <div
                key={st._id}
                className="flex items-center justify-between gap-2 border border-gray-200 bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-gray-800">
                  {getStreamLabel(st.stream)}
                </span>

                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                  {(st.subjects || []).length} subject
                  {(st.subjects || []).length === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </td>

      <td className="border-b border-r border-gray-200 px-4 py-4 align-top text-center">
        <button
          onClick={onManageSubjects}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
        >
          View
        </button>
      </td>

      <td className="border-b border-gray-200 px-4 py-4 align-top">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={onManageSubjects}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
          >
            Manage Subjects
          </button>

        
        </div>
      </td>
    </tr>
  );
}

export default GradeSubjectPage;