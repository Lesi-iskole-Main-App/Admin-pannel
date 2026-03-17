import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetPapersQuery, usePublishPaperMutation } from "../api/paperApi";

const ROWS_PER_PAGE = 20;

const fmt = (v) => String(v ?? "").trim();

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

const badgeClass = (status) => {
  if (status === "publish") return "bg-green-50 text-green-700 border-green-200";
  if (status === "complete") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-yellow-50 text-yellow-700 border-yellow-200";
};

const statusLabel = (status) => {
  if (status === "publish") return "Published";
  if (status === "complete") return "Complete";
  return "In Progress";
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

export default function QuestionPage() {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, refetch } = useGetPapersQuery();
  const [publishPaper, { isLoading: isPublishing }] = usePublishPaperMutation();

  const papers = useMemo(() => {
    const list = Array.isArray(data?.papers) ? data.papers : [];
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data]);

  const [currentPage, setCurrentPage] = useState(1);

  const totalRows = papers.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedPapers = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return papers.slice(start, end);
  }, [papers, currentPage]);

  const startRecord = totalRows === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endRecord =
    totalRows === 0 ? 0 : Math.min(currentPage * ROWS_PER_PAGE, totalRows);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  const onView = (paperId) => navigate(`/paper/${paperId}/questions/view`);
  const onEditQuestions = (paperId) => navigate(`/paper/${paperId}/questions/create`);

  const onPublish = async (paperId) => {
    try {
      await publishPaper(paperId).unwrap();
      await refetch();
      alert("Paper published");
    } catch (e) {
      alert(e?.data?.message || "Publish failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full justify-center">
        <div className="min-w-0 w-full max-w-[95vw] px-3 py-8 sm:px-6 sm:py-10">
          <div className="border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Paper Question Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage paper questions, completion, and publishing.
              {isFetching ? (
                <span className="ml-2 text-xs text-gray-400">Refreshing...</span>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                refetch();
                setCurrentPage(1);
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Refresh
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
            <table className="w-full min-w-[1450px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr className="bg-white text-left text-[13px] font-medium text-gray-600">
                  <th className="w-[18%] border-b border-r border-gray-200 px-4 py-3">
                    Paper Name
                  </th>
                  <th className="w-[8%] border-b border-r border-gray-200 px-4 py-3">
                    Grade
                  </th>
                  <th className="w-[14%] border-b border-r border-gray-200 px-4 py-3">
                    Subject / Stream
                  </th>
                  <th className="w-[8%] border-b border-r border-gray-200 px-4 py-3">
                    Time
                  </th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">
                    Question Count
                  </th>
                  <th className="w-[12%] border-b border-r border-gray-200 px-4 py-3">
                    Complete Questions
                  </th>
                  <th className="w-[10%] border-b border-r border-gray-200 px-4 py-3">
                    Paper Status
                  </th>
                  <th className="w-[20%] border-b border-gray-200 px-4 py-3 text-center">
                    Operation
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white text-sm text-gray-700">
                {paginatedPapers.map((p) => {
                  const paperId = p?._id;
                  const name = fmt(p?.paperTitle) || "-";
                  const grade = p?.meta?.gradeLabel || "-";
                  const subject = fmt(p?.meta?.subject);
                  const stream = fmt(p?.meta?.stream);
                  const subjectStream = stream
                    ? `${stream} / ${subject || "-"}`
                    : subject || "-";

                  const time = Number(p?.timeMinutes || 0);
                  const questionCount = Number(p?.questionCount || 0);

                  const currentCount = Number(p?.progress?.currentCount || 0);
                  const requiredCount = Number(
                    p?.progress?.requiredCount || questionCount || 0
                  );

                  const status = fmt(p?.status) || "in_progress";

                  return (
                    <tr key={paperId} className="hover:bg-gray-50/70">
                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate font-medium text-gray-800">{name}</div>
                        <div className="mt-1">
                          <span
                            className={[
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              payBadgeClass(p?.payment),
                            ].join(" ")}
                          >
                            {payLabel(p?.payment, p?.amount)}
                          </span>
                        </div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{grade}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{subjectStream}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{time ? `${time} min` : "-"}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">{questionCount || "-"}</div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <div className="truncate">
                          <span className="font-medium text-gray-800">{currentCount}</span>
                          <span className="text-gray-500"> / {requiredCount}</span>
                        </div>
                      </td>

                      <td className="border-b border-r border-gray-200 px-4 py-4 align-middle">
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                            badgeClass(status),
                          ].join(" ")}
                        >
                          {statusLabel(status)}
                        </span>
                      </td>

                      <td className="border-b border-gray-200 px-4 py-4 align-middle">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <IconButton title="View" onClick={() => onView(paperId)}>
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

                          {status !== "publish" && (
                            <button
                              type="button"
                              onClick={() => onEditQuestions(paperId)}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                            >
                              {status === "complete" ? "Edit Questions" : "Add Questions"}
                            </button>
                          )}

                          {status === "complete" && (
                            <button
                              type="button"
                              disabled={isPublishing}
                              onClick={() => onPublish(paperId)}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
                            >
                              {isPublishing ? "Publishing..." : "Publish"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {papers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      No papers found.
                    </td>
                  </tr>
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
}