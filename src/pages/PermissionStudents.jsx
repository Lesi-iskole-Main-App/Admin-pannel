import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useApproveEnrollMutation,
  useGetPendingEnrollRequestOptionsQuery,
  useGetPendingEnrollRequestsQuery,
  useRejectEnrollMutation,
} from "../api/enrollApi";

const Select = ({ label, value, onChange, options, placeholder = "Select" }) => (
  <div className="w-full">
    <label className="text-xs font-semibold text-gray-600">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    >
      <option value="">{placeholder}</option>
      {options.map((op) => (
        <option key={String(op.value ?? op)} value={String(op.value ?? op)}>
          {String(op.label ?? op)}
        </option>
      ))}
    </select>
  </div>
);

const Input = ({ label, value, onChange, placeholder = "" }) => (
  <div className="w-full">
    <label className="text-xs font-semibold text-gray-600">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    />
  </div>
);

const PendingRequestCard = ({
  row,
  onApprove,
  onReject,
  approving,
  rejecting,
}) => {
  const cd = row?.classDetails || {};
  const isAL = cd?.flowType === "al";
  const gradeText = isAL ? "A/L" : cd?.grade ? `Grade ${cd.grade}` : "-";
  const streamText = isAL ? cd?.streamLabel || cd?.stream || "-" : "-";
  const batchText = cd?.batchNumber || "-";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">
            {row.studentName || "-"}
          </div>
          <div className="mt-1 truncate text-xs text-gray-600">
            {row.studentPhone || "-"}
          </div>
        </div>

        <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[10px] font-semibold text-yellow-700">
          Pending
        </span>
      </div>

      <div className="mt-4 space-y-2 text-xs text-gray-700">
        <div>
          <span className="font-semibold text-gray-800">Class:</span>{" "}
          {cd.className || "-"}
        </div>

        <div>
          <span className="font-semibold text-gray-800">Batch:</span>{" "}
          {batchText}
        </div>

        <div>
          <span className="font-semibold text-gray-800">Grade:</span>{" "}
          {gradeText}
        </div>

        {isAL ? (
          <div>
            <span className="font-semibold text-gray-800">Stream:</span>{" "}
            {streamText}
          </div>
        ) : null}

        <div>
          <span className="font-semibold text-gray-800">Subject:</span>{" "}
          {cd.subject || "-"}
        </div>

        <div>
          <span className="font-semibold text-gray-800">Requested:</span>{" "}
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onReject(row._id)}
          disabled={rejecting}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>

        <button
          type="button"
          onClick={() => onApprove(row._id)}
          disabled={approving}
          className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          Approve
        </button>
      </div>
    </div>
  );
};

const PageNumberButton = ({ active = false, onClick, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-3 text-xs font-medium transition ${
      active
        ? "border-blue-600 bg-blue-600 text-white"
        : "border-gray-300 text-gray-700 hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

const PermissionStudents = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    level: "",
    grade: "",
    stream: "",
    phonenumber: "",
    batchNumber: "",
    page: 1,
    limit: 12,
  });

  const { data: optionsData } = useGetPendingEnrollRequestOptionsQuery();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPendingEnrollRequestsQuery(filters);

  const [approveEnroll, { isLoading: approving }] = useApproveEnrollMutation();
  const [rejectEnroll, { isLoading: rejecting }] = useRejectEnrollMutation();

  const rows = data?.requests || [];
  const total = Number(data?.total || 0);
  const page = Number(data?.page || filters.page || 1);
  const limit = Number(data?.limit || filters.limit || 12);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const levelOptions = optionsData?.levels || [];
  const batchOptions = optionsData?.batchNumbers || [];

  const gradeOptions = useMemo(() => {
    const all = optionsData?.grades || [];
    if (!filters.level || filters.level === "al") return [];
    return all.filter((g) => String(g.level) === String(filters.level));
  }, [optionsData?.grades, filters.level]);

  const streamOptions = useMemo(() => {
    if (filters.level !== "al") return [];
    return optionsData?.streams || [];
  }, [optionsData?.streams, filters.level]);

  const errorText =
    error?.data?.message || error?.error || "Failed to load pending requests";

  const onApprove = async (id) => {
    try {
      await approveEnroll(id).unwrap();
      refetch();
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Approve failed"));
    }
  };

  const onReject = async (id) => {
    const ok = window.confirm("Reject this student request?");
    if (!ok) return;

    try {
      await rejectEnroll(id).unwrap();
      refetch();
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Reject failed"));
    }
  };

  const goPage = (nextPage) => {
    const safePage = Math.max(1, Math.min(totalPages, nextPage));
    setFilters((p) => ({ ...p, page: safePage }));
  };

  const visiblePageNumbers = useMemo(() => {
    const nums = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 2);

    for (let i = start; i <= end; i += 1) nums.push(i);

    if (nums.length < 3) {
      let current = start - 1;
      while (current >= 1 && nums.length < 3) {
        nums.unshift(current);
        current -= 1;
      }
    }

    return nums;
  }, [page, totalPages]);

  return (
    <div className="flex w-full justify-center">
      <div className="min-w-0 w-full max-w-[96vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Requested Class Cards
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Only student class requests are shown here as cards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
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

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Input
              label="Phone Number"
              value={filters.phonenumber}
              onChange={(v) =>
                setFilters((p) => ({
                  ...p,
                  phonenumber: v,
                  page: 1,
                }))
              }
              placeholder="+94760431068"
            />

            <Select
              label="Batch Number"
              value={filters.batchNumber}
              onChange={(v) =>
                setFilters((p) => ({
                  ...p,
                  batchNumber: v,
                  page: 1,
                }))
              }
              options={batchOptions}
              placeholder="Select batch"
            />

            <Select
              label="Level"
              value={filters.level}
              onChange={(v) =>
                setFilters((p) => ({
                  ...p,
                  level: v,
                  grade: "",
                  stream: "",
                  page: 1,
                }))
              }
              options={levelOptions}
              placeholder="Select level"
            />

            <Select
              label="Grade"
              value={filters.grade}
              onChange={(v) =>
                setFilters((p) => ({
                  ...p,
                  grade: v,
                  page: 1,
                }))
              }
              options={gradeOptions}
              placeholder={
                filters.level && filters.level !== "al"
                  ? "Select grade"
                  : "Select level first"
              }
            />

            <Select
              label="Stream"
              value={filters.stream}
              onChange={(v) =>
                setFilters((p) => ({
                  ...p,
                  stream: v,
                  page: 1,
                }))
              }
              options={streamOptions}
              placeholder={
                filters.level === "al" ? "Select stream" : "A/L only"
              }
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                setFilters({
                  level: "",
                  grade: "",
                  stream: "",
                  phonenumber: "",
                  batchNumber: "",
                  page: 1,
                  limit: 12,
                })
              }
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            {isLoading ? "Loading..." : `Total requested cards: ${total}`}
            {isError ? (
              <span className="ml-2 font-semibold text-red-600">
                | {errorText}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
              Loading...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
              <div className="text-red-600">{errorText}</div>
              <div className="mt-3">
                <button
                  onClick={refetch}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
              No requested class cards
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {rows.map((row) => (
                  <PendingRequestCard
                    key={row._id}
                    row={row}
                    onApprove={onApprove}
                    onReject={onReject}
                    approving={approving}
                    rejecting={rejecting}
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Page {page} of {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goPage(Math.max(1, page - 1))}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Prev
                  </button>

                  {visiblePageNumbers.map((n) => (
                    <PageNumberButton
                      key={n}
                      active={n === page}
                      onClick={() => goPage(n)}
                    >
                      {n}
                    </PageNumberButton>
                  ))}

                  <button
                    onClick={() => goPage(Math.min(totalPages, page + 1))}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionStudents;