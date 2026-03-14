import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  useCreatePaperMutation,
  useGetPaperFormDataQuery,
} from "../api/paperApi";
import { setLastCreatedPaper } from "../api/features/paperSlice";

const PapersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isLoading } = useGetPaperFormDataQuery();
  const [createPaper, { isLoading: isCreating }] = useCreatePaperMutation();

  const grades = useMemo(
    () => (Array.isArray(data?.grades) ? data.grades : []),
    [data]
  );

  const enums = data?.enums || {};
  const paperTypes =
    enums?.paperTypes || [
      "Daily Quiz",
      "Topic wise paper",
      "Model paper",
      "Past paper",
    ];
  const paymentTypes = enums?.paymentTypes || ["free", "paid", "practise"];
  const attemptsAllowed = enums?.attemptsAllowed || [1, 2, 3];
  const answerCounts = useMemo(() => [1, 2, 3, 4, 5, 6], []);

  const [form, setForm] = useState({
    gradeId: "",
    subjectId: "",
    streamId: "",
    streamSubjectId: "",
    paperType: "",
    paperTitle: "",
    timeMinutes: "",
    questionCount: "",
    oneQuestionAnswersCount: 4,
    createdPersonName: "",
    payment: "free",
    amount: "",
    attempts: 1,
  });

  const [errors, setErrors] = useState({});

  const selectedGrade = useMemo(
    () => grades.find((g) => String(g._id) === String(form.gradeId)) || null,
    [grades, form.gradeId]
  );

  const isAL = selectedGrade?.flowType === "al";

  const subjectList = useMemo(
    () => (Array.isArray(selectedGrade?.subjects) ? selectedGrade.subjects : []),
    [selectedGrade]
  );

  const streamList = useMemo(
    () => (Array.isArray(selectedGrade?.streams) ? selectedGrade.streams : []),
    [selectedGrade]
  );

  const selectedStream = useMemo(
    () => streamList.find((s) => String(s._id) === String(form.streamId)) || null,
    [streamList, form.streamId]
  );

  const streamSubjects = useMemo(
    () => (Array.isArray(selectedStream?.subjects) ? selectedStream.subjects : []),
    [selectedStream]
  );

  const getGradeLabel = (grade) => {
    if (!grade) return "";

    if (String(grade.title || "").trim()) return grade.title;

    if (grade.flowType === "al") return `Grade ${grade.grade} A/L`;

    return `Grade ${grade.grade}`;
  };

  const getStreamLabel = (stream) => {
    if (!stream) return "";
    return stream.label || stream.stream || "";
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const onGradeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      gradeId: value,
      subjectId: "",
      streamId: "",
      streamSubjectId: "",
    }));

    setErrors((prev) => ({
      ...prev,
      gradeId: "",
      subjectId: "",
      streamId: "",
      streamSubjectId: "",
    }));
  };

  const onStreamChange = (value) => {
    setForm((prev) => ({
      ...prev,
      streamId: value,
      streamSubjectId: "",
    }));

    setErrors((prev) => ({
      ...prev,
      streamId: "",
      streamSubjectId: "",
    }));
  };

  const validate = () => {
    const e = {};

    if (!form.gradeId) e.gradeId = "Grade is required";

    if (isAL) {
      if (!form.streamId) e.streamId = "Stream is required";
      if (!form.streamSubjectId) e.streamSubjectId = "Stream Subject is required";
    } else {
      if (!form.subjectId) e.subjectId = "Subject is required";
    }

    if (!form.paperType) e.paperType = "Paper Type is required";
    if (!String(form.paperTitle || "").trim()) {
      e.paperTitle = "Paper Title is required";
    }

    const time = Number(form.timeMinutes);
    if (!time || time < 1 || time > 180) {
      e.timeMinutes = "Time must be 1..180 minutes";
    }

    const qc = Number(form.questionCount);
    if (!qc || qc < 1 || qc > 50) {
      e.questionCount = "Question Count must be 1..50";
    }

    const ac = Number(form.oneQuestionAnswersCount);
    if (!ac || ac < 1 || ac > 6) {
      e.oneQuestionAnswersCount = "Answer count must be 1..6";
    }

    if (!String(form.createdPersonName || "").trim()) {
      e.createdPersonName = "Created Person Name is required";
    }

    if (!paymentTypes.includes(form.payment)) {
      e.payment = "Invalid payment";
    }

    if (form.payment === "paid") {
      const amt = Number(form.amount);
      if (!amt || amt <= 0) {
        e.amount = "Amount must be > 0 for paid papers";
      }
    }

    if (!attemptsAllowed.includes(Number(form.attempts))) {
      e.attempts = "Attempts must be 1,2,3";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      gradeId: form.gradeId,
      subjectId: isAL ? null : form.subjectId,
      streamId: isAL ? form.streamId : null,
      streamSubjectId: isAL ? form.streamSubjectId : null,
      paperType: form.paperType,
      paperTitle: String(form.paperTitle || "").trim(),
      timeMinutes: Number(form.timeMinutes),
      questionCount: Number(form.questionCount),
      oneQuestionAnswersCount: Number(form.oneQuestionAnswersCount || 4),
      createdPersonName: String(form.createdPersonName || "").trim(),
      payment: form.payment,
      amount: form.payment === "paid" ? Number(form.amount) : 0,
      attempts: Number(form.attempts),
    };

    try {
      const res = await createPaper(payload).unwrap();
      const createdPaper = res?.paper || null;

      dispatch(setLastCreatedPaper(createdPaper));

      const paperId = createdPaper?._id;
      if (paperId) {
        navigate(`/paper/${paperId}/questions/create`);
        return;
      }

      alert("✅ Paper created!");
    } catch (err) {
      alert(err?.data?.message || "❌ Failed to create paper");
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-3 py-6">
      <div className="w-full max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Paper Creation
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new paper with available grade, subject, timing, payment
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/home")}
            className="inline-flex h-10 w-10 items-center justify-center self-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 sm:self-auto"
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

        <form
          className="border border-gray-200 bg-white p-4 sm:p-6"
          onSubmit={onSubmit}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                Grade
              </label>
              <select
                value={form.gradeId}
                onChange={(e) => onGradeChange(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                disabled={isLoading}
              >
                <option value="">{isLoading ? "Loading..." : "Select Grade"}</option>
                {grades.map((g) => (
                  <option key={g._id} value={g._id}>
                    {getGradeLabel(g)}
                  </option>
                ))}
              </select>
              {errors.gradeId && (
                <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                  {errors.gradeId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                Paper Type
              </label>
              <select
                value={form.paperType}
                onChange={(e) => setField("paperType", e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Select Paper Type</option>
                {paperTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.paperType && (
                <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                  {errors.paperType}
                </p>
              )}
            </div>

            {!isAL ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                  Subject
                </label>
                <select
                  value={form.subjectId}
                  onChange={(e) => setField("subjectId", e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={!form.gradeId}
                >
                  <option value="">
                    {form.gradeId ? "Select Subject" : "Select Grade first"}
                  </option>
                  {subjectList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.subject}
                    </option>
                  ))}
                </select>
                {errors.subjectId && (
                  <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                    {errors.subjectId}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                    Stream
                  </label>
                  <select
                    value={form.streamId}
                    onChange={(e) => onStreamChange(e.target.value)}
                    className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    disabled={!form.gradeId}
                  >
                    <option value="">
                      {form.gradeId ? "Select Stream" : "Select Grade first"}
                    </option>
                    {streamList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {getStreamLabel(s)}
                      </option>
                    ))}
                  </select>
                  {errors.streamId && (
                    <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                      {errors.streamId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                    Stream Subject
                  </label>
                  <select
                    value={form.streamSubjectId}
                    onChange={(e) => setField("streamSubjectId", e.target.value)}
                    className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    disabled={!form.streamId}
                  >
                    <option value="">
                      {form.streamId ? "Select Stream Subject" : "Select Stream first"}
                    </option>
                    {streamSubjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.subject}
                      </option>
                    ))}
                  </select>
                  {errors.streamSubjectId && (
                    <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                      {errors.streamSubjectId}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                Paper Name
              </label>
              <input
                type="text"
                value={form.paperTitle}
                onChange={(e) => setField("paperTitle", e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              {errors.paperTitle && (
                <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                  {errors.paperTitle}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                Time
              </label>
              <input
                type="number"
                value={form.timeMinutes}
                onChange={(e) => setField("timeMinutes", e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                min={1}
                max={180}
              />
              {errors.timeMinutes && (
                <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                  {errors.timeMinutes}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                Question Count
              </label>
              <input
                type="number"
                value={form.questionCount}
                onChange={(e) => setField("questionCount", e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                min={1}
                max={50}
              />
              {errors.questionCount && (
                <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                  {errors.questionCount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                Answer Count
              </label>
              <select
                value={form.oneQuestionAnswersCount}
                onChange={(e) => setField("oneQuestionAnswersCount", e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              >
                {answerCounts.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.oneQuestionAnswersCount && (
                <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                  {errors.oneQuestionAnswersCount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                Created By
              </label>
              <input
                type="text"
                value={form.createdPersonName}
                onChange={(e) => setField("createdPersonName", e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              {errors.createdPersonName && (
                <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                  {errors.createdPersonName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                Payment
              </label>
              <select
                value={form.payment}
                onChange={(e) => {
                  const value = e.target.value;
                  setField("payment", value);
                  if (value !== "paid") setField("amount", "");
                }}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              >
                {paymentTypes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.payment && (
                <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                  {errors.payment}
                </p>
              )}
            </div>

            {form.payment === "paid" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                  Amount
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setField("amount", e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  min={1}
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                    {errors.amount}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center md:text-left">
                Attempts
              </label>
              <select
                value={form.attempts}
                onChange={(e) => setField("attempts", e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              >
                {attemptsAllowed.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              {errors.attempts && (
                <p className="mt-1 text-xs text-red-600 text-center md:text-left">
                  {errors.attempts}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              disabled={isCreating || isLoading}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-8 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isCreating ? "Submitting..." : "Create Paper"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PapersPage;