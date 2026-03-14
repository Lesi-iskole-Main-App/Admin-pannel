import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useDeletePaperMutation,
  useGetPaperFormDataQuery,
  useGetPapersQuery,
  useUpdatePaperMutation,
} from "../api/paperApi";

const ROWS_PER_PAGE = 20;

const fmtDate = (d) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "-";
  return x.toLocaleString();
};

const fmtMoney = (n) => {
  const v = Number(n || 0);
  return `Rs. ${v.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const payLabel = (payment, amount) => {
  const p = String(payment || "").toLowerCase();

  if (p === "paid") return `PAID (${fmtMoney(amount)})`;
  if (p === "practise") return "PRACTISE";
  return "FREE";
};

const payBadgeClass = (payment) => {
  const p = String(payment || "").toLowerCase();

  if (p === "paid") return "bg-red-50 text-red-700 border-red-200";
  if (p === "practise") return "bg-purple-50 text-purple-700 border-purple-200";
  return "bg-green-50 text-green-700 border-green-200";
};

const getGradeLabel = (paper) => {
  const gradeValue = Number(paper?.meta?.grade || 0);
  const hasStream = Boolean(paper?.meta?.stream);

  if (hasStream || gradeValue === 12 || gradeValue === 13) return "A/L";
  if (gradeValue >= 1 && gradeValue <= 11) return `Grade ${gradeValue}`;
  return "-";
};

const getSubjectLabel = (paper) => {
  const meta = paper?.meta || {};
  if (meta?.stream) {
    return `${meta.stream} - ${meta.subject || "-"}`;
  }
  return meta?.subject || "-";
};

const ModalShell = ({ open, title, children, onClose, maxWidth = "max-w-xl" }) => {
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

const ViewPaperPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useGetPapersQuery();
  const { data: formData } = useGetPaperFormDataQuery();

  const [deletePaper] = useDeletePaperMutation();
  const [updatePaper, { isLoading: saving }] = useUpdatePaperMutation();

  const papers = useMemo(
    () => (Array.isArray(data?.papers) ? data.papers : []),
    [data]
  );

  const rows = useMemo(() => {
    return papers.map((p) => ({
      _id: p._id,
      raw: p,
      name: p.paperTitle,
      grade: getGradeLabel(p),
      subject: getSubjectLabel(p),
      time: p.timeMinutes ? `${p.timeMinutes} Minutes` : "-",
      questionCount: p.questionCount ?? "-",
      createdBy: p.createdPersonName || "-",
      createdAt: fmtDate(p.createdAt),
      payment: p.payment,
      amount: p.amount,
    }));
  }, [papers]);

  const [currentPage, setCurrentPage] = useState(1);

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

  const startRecord = totalRows === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endRecord =
    totalRows === 0 ? 0 : Math.min(currentPage * ROWS_PER_PAGE, totalRows);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const enums = formData?.enums || {};
  const paperTypes = enums.paperTypes || [
    "Daily Quiz",
    "Topic wise paper",
    "Model paper",
    "Past paper",
  ];
  const paymentTypes = enums.paymentTypes || ["free", "paid", "practise"];
  const attemptsAllowed = enums.attemptsAllowed || [1, 2, 3];

  const [form, setForm] = useState({
    paperType: "",
    paperTitle: "",
    timeMinutes: "",
    questionCount: "",
    oneQuestionAnswersCount: 5,
    createdPersonName: "",
    payment: "free",
    amount: "",
    attempts: 1,
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  const openView = (paper) => {
    setSelected(paper);
    setViewOpen(true);
  };

  const openEdit = (paper) => {
    setSelected(paper);
    setForm({
      paperType: paper.paperType || "",
      paperTitle: paper.paperTitle || "",
      timeMinutes: paper.timeMinutes ?? "",
      questionCount: paper.questionCount ?? "",
      oneQuestionAnswersCount: paper.oneQuestionAnswersCount ?? 4,
      createdPersonName: paper.createdPersonName || "",
      payment: paper.payment || "free",
      amount: String((paper.payment === "paid" ? paper.amount : "") ?? ""),
      attempts: paper.attempts ?? 1,
      isActive: paper.isActive !== false,
    });
    setErrors({});
    setEditOpen(true);
  };

  const validate = () => {
    const e = {};

    if (!form.paperType) e.paperType = "Paper Type is required";
    if (!String(form.paperTitle || "").trim())
      e.paperTitle = "Paper Title is required";

    const t = Number(form.timeMinutes);
    if (!t || t < 1 || t > 180) e.timeMinutes = "Time must be 1..180 minutes";

    const qc = Number(form.questionCount);
    if (!qc || qc < 1 || qc > 50)
      e.questionCount = "Question Count must be 1..50";

    const oq = Number(form.oneQuestionAnswersCount);
    if (!oq || oq < 1 || oq > 6)
      e.oneQuestionAnswersCount = "Answers per question must be 1..6";

    if (!String(form.createdPersonName || "").trim())
      e.createdPersonName = "Created Person Name is required";

    if (!paymentTypes.includes(String(form.payment))) e.payment = "Invalid payment";

    if (String(form.payment) === "paid") {
      const a = Number(form.amount);
      if (!a || a <= 0) e.amount = "Amount must be > 0 for paid papers";
    }

    const att = Number(form.attempts);
    if (!attemptsAllowed.includes(att)) e.attempts = "Attempts must be 1,2,3";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const onDelete = async (paperId) => {
    if (!window.confirm("Delete this paper?")) return;
    try {
      await deletePaper(paperId).unwrap();
      alert("✅ Paper deleted");
    } catch (err) {
      alert(err?.data?.message || "❌ Failed to delete");
    }
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    if (!selected?._id) return;
    if (!validate()) return;

    try {
      const patch = {
        paperType: form.paperType,
        paperTitle: String(form.paperTitle).trim(),
        timeMinutes: Number(form.timeMinutes),
        questionCount: Number(form.questionCount),
        oneQuestionAnswersCount: Number(form.oneQuestionAnswersCount),
        createdPersonName: String(form.createdPersonName).trim(),
        payment: form.payment,
        amount: form.payment === "paid" ? Number(form.amount) : 0,
        attempts: Number(form.attempts),
        isActive: Boolean(form.isActive),
      };

      await updatePaper({ paperId: selected._id, patch }).unwrap();
      alert("✅ Paper updated");
      setEditOpen(false);
    } catch (err) {
      alert(err?.data?.message || "❌ Failed to update");
    }
  };

  return (
    <div className="flex w-full justify-center ">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Paper Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage paper details
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Refresh View
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

        <div className="mt-5 overflow-hidden border border-gray-200 bg-white">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1350px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#F8FAFC] text-left text-[13px] font-medium text-gray-600">
                  <th className="w-[6%] border-b border-r border-gray-200 px-4 py-3">
                    ID
                  </th>
                  <th className="w-[18%] border-b border-r border-gray-200 px-4 py-3">
                    Paper Name
                  </th>
                  <th className="w-[8%] border-b border-r border-gray-200 px-4 py-3">
                    Grade
                  </th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Subject
                  </th>
                  <th className="w-[8%] border-b border-r border-gray-200 px-4 py-3">
                    Time
                  </th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">
                    Question Count
                  </th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Created By
                  </th>
                  <th className="w-[14%] border-b border-r border-gray-200 px-4 py-3">
                    Created Date & Time
                  </th>
                  <th className="w-[12%] border-b border-gray-200 px-4 py-3 text-center">
                    Operation
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white text-sm text-gray-700">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : totalRows === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No papers found
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((p, idx) => {
                    const displayIndex = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;

                    return (
                      <tr key={p._id} className="hover:bg-gray-50/70">
                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                          <div className="truncate">{String(displayIndex)}</div>
                        </td>

                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                          <div className="truncate font-medium text-gray-800">
                            {p.name}
                          </div>
                          <div className="mt-1">
                            <span
                              className={[
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                payBadgeClass(p.payment),
                              ].join(" ")}
                            >
                              {payLabel(p.payment, p.amount)}
                            </span>
                          </div>
                        </td>

                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                          <div className="truncate">{p.grade}</div>
                        </td>

                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                          <div className="truncate">{p.subject}</div>
                        </td>

                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                          <div className="truncate">{p.time}</div>
                        </td>

                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                          <div className="truncate">{p.questionCount}</div>
                        </td>

                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                          <div className="truncate">{p.createdBy}</div>
                        </td>

                        <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                          <div className="truncate">{p.createdAt}</div>
                        </td>

                        <td className="border-b border-gray-200 px-4 py-4 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <IconButton
                              title="View"
                              onClick={() => openView(p.raw)}
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
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </IconButton>

                            <IconButton
                              title="Edit"
                              onClick={() => openEdit(p.raw)}
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
                              onClick={() => onDelete(p._id)}
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
                    );
                  })
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

        <ModalShell
          open={viewOpen}
          title="Paper Details"
          onClose={() => {
            setViewOpen(false);
            setSelected(null);
          }}
        >
          {!selected ? (
            <p className="text-center text-sm text-gray-500">No data</p>
          ) : (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-gray-700">Paper Title</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {selected.paperTitle}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Paper Type</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {selected.paperType}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Grade</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {getGradeLabel(selected)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Subject</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {getSubjectLabel(selected)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Time</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {selected.timeMinutes} Minutes
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Question Count
                  </div>
                  <div className="mt-1 text-sm text-gray-900">
                    {selected.questionCount}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Answers per Question
                  </div>
                  <div className="mt-1 text-sm text-gray-900">
                    {selected.oneQuestionAnswersCount}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Payment</div>
                  <div className="mt-1">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        payBadgeClass(selected.payment),
                      ].join(" ")}
                    >
                      {payLabel(selected.payment, selected.amount)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Attempts</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {selected.attempts}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Created By</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {selected.createdPersonName}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm font-medium text-gray-700">Created At</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {fmtDate(selected.createdAt)}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewOpen(false);
                    openEdit(selected);
                  }}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </ModalShell>

        <ModalShell
          open={editOpen}
          title="Edit Paper"
          onClose={() => {
            setEditOpen(false);
            setSelected(null);
          }}
          maxWidth="max-w-2xl"
        >
          {!selected ? (
            <p className="text-center text-sm text-gray-500">No data</p>
          ) : (
            <form className="space-y-4" onSubmit={onSaveEdit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Paper Type
                  </label>
                  <select
                    value={form.paperType}
                    onChange={(e) => setField("paperType", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Select Paper Type</option>
                    {paperTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.paperType && (
                    <p className="mt-1 text-xs text-red-600">{errors.paperType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Paper Name
                  </label>
                  <input
                    type="text"
                    placeholder="Please enter paper name"
                    value={form.paperTitle}
                    onChange={(e) => setField("paperTitle", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {errors.paperTitle && (
                    <p className="mt-1 text-xs text-red-600">{errors.paperTitle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 20 minutes"
                    min={1}
                    max={180}
                    value={form.timeMinutes}
                    onChange={(e) => setField("timeMinutes", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {errors.timeMinutes && (
                    <p className="mt-1 text-xs text-red-600">{errors.timeMinutes}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Question Count
                  </label>
                  <input
                    type="number"
                    placeholder="Question count"
                    min={1}
                    max={50}
                    value={form.questionCount}
                    onChange={(e) => setField("questionCount", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {errors.questionCount && (
                    <p className="mt-1 text-xs text-red-600">{errors.questionCount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Answers per Question
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={form.oneQuestionAnswersCount}
                    onChange={(e) =>
                      setField("oneQuestionAnswersCount", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {errors.oneQuestionAnswersCount && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.oneQuestionAnswersCount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Created By
                  </label>
                  <input
                    type="text"
                    placeholder="Please enter creator name"
                    value={form.createdPersonName}
                    onChange={(e) => setField("createdPersonName", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {errors.createdPersonName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.createdPersonName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment
                  </label>
                  <select
                    value={form.payment}
                    onChange={(e) => {
                      const v = e.target.value;
                      setField("payment", v);
                      if (v !== "paid") setField("amount", "");
                    }}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {paymentTypes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.payment && (
                    <p className="mt-1 text-xs text-red-600">{errors.payment}</p>
                  )}
                </div>

                {form.payment === "paid" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      min={1}
                      value={form.amount}
                      onChange={(e) => setField("amount", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Attempts
                  </label>
                  <select
                    value={form.attempts}
                    onChange={(e) => setField("attempts", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {attemptsAllowed.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  {errors.attempts && (
                    <p className="mt-1 text-xs text-red-600">{errors.attempts}</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          )}
        </ModalShell>
      </div>
    </div>
  );
};

export default ViewPaperPage;