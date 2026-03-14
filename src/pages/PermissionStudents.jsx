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
      className="mt-1 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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

const PendingCard = ({ row, onApprove, onReject, approving, rejecting }) => {
  const cd = row?.classDetails || {};
  const gradeText =
    cd?.flowType === "al" ? "A/L" : cd?.grade ? `Grade ${cd.grade}` : "-";
  const streamText =
    cd?.flowType === "al" ? cd?.streamLabel || cd?.stream || "-" : "-";

  return (
    <div className="border border-gray-200 bg-white rounded-xl">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-medium text-gray-900">
              {row.studentName}
            </div>
            <div className="mt-1 truncate text-sm text-gray-600">
              {row.studentEmail}
            </div>
            <div className="mt-1 truncate text-sm text-gray-600">
              {row.studentPhone}
            </div>
          </div>

          <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[11px] font-medium text-yellow-700">
            Pending
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <div>
            <span className="font-medium text-gray-800">Class:</span>{" "}
            {cd.className || "-"}
          </div>

          <div>
            <span className="font-medium text-gray-800">Grade:</span>{" "}
            {gradeText}
          </div>

          {cd?.flowType === "al" ? (
            <div>
              <span className="font-medium text-gray-800">Stream:</span>{" "}
              {streamText}
            </div>
          ) : null}

          <div>
            <span className="font-medium text-gray-800">Subject:</span>{" "}
            {cd.subject || "-"}
          </div>

          <div>
            <span className="font-medium text-gray-800">Requested:</span>{" "}
            {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
          </div>
        </div>

        <div className="mt-auto flex justify-end gap-2 pt-5">
          <button
            onClick={() => onReject(row._id)}
            disabled={rejecting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>

          <button
            onClick={() => onApprove(row._id)}
            disabled={approving}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionBlock = ({ title, rows, onApprove, onReject, approving, rejecting }) => {
  if (!rows.length) return null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {rows.length} requests
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <PendingCard
            key={r._id}
            row={r}
            onApprove={onApprove}
            onReject={onReject}
            approving={approving}
            rejecting={rejecting}
          />
        ))}
      </div>
    </div>
  );
};

const PageNumberButton = ({ active = false, onClick, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-3 font-medium transition ${
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

  const gradeOptions = useMemo(() => {
    const all = optionsData?.grades || [];
    if (!filters.level || filters.level === "al") return [];
    return all.filter((g) => String(g.level) === String(filters.level));
  }, [optionsData?.grades, filters.level]);

  const streamOptions = useMemo(() => {
    if (filters.level !== "al") return [];
    return optionsData?.streams || [];
  }, [optionsData?.streams, filters.level]);

  const groupedSections = useMemo(() => {
    if (!rows.length) return [];

    if (filters.level === "al") {
      const groups = new Map();

      for (const row of rows) {
        const cd = row?.classDetails || {};
        const key = String(cd.stream || "common");
        const label = cd.streamLabel || cd.stream || "Common";

        if (!groups.has(key)) {
          groups.set(key, { title: label, rows: [] });
        }

        groups.get(key).rows.push(row);
      }

      return Array.from(groups.values()).sort((a, b) =>
        String(a.title).localeCompare(String(b.title))
      );
    }

    const groups = new Map();

    for (const row of rows) {
      const cd = row?.classDetails || {};
      const gradeNo = Number(cd.grade || 0);
      const title = gradeNo ? `Grade ${gradeNo}` : "Other";

      if (!groups.has(title)) {
        groups.set(title, { title, rows: [] });
      }

      groups.get(title).rows.push(row);
    }

    return Array.from(groups.values()).sort((a, b) => {
      const aNo = Number(String(a.title).replace(/\D/g, "")) || 0;
      const bNo = Number(String(b.title).replace(/\D/g, "")) || 0;
      return aNo - bNo;
    });
  }, [rows, filters.level]);

  const errorText =
    error?.data?.message || error?.error || "Failed to load pending requests";

  const onApprove = async (id) => {
    try {
      await approveEnroll(id).unwrap();
    } catch (e) {
      alert(String(e?.data?.message || e?.error || "Approve failed"));
    }
  };

  const onReject = async (id) => {
    const ok = window.confirm("Reject this student request?");
    if (!ok) return;

    try {
      await rejectEnroll(id).unwrap();
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

    for (let i = start; i <= end; i += 1) {
      nums.push(i);
    }

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
    <div className="flex w-full justify-center ">
      <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Student Enrollment Requests
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Select level first. Then choose grade. For A/L, choose stream.
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Level"
              value={filters.level}
              onChange={(v) =>
                setFilters({
                  level: v,
                  grade: "",
                  stream: "",
                  page: 1,
                  limit,
                })
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

            <Select
              label="Per Page"
              value={String(filters.limit)}
              onChange={(v) =>
                setFilters((p) => ({
                  ...p,
                  limit: Number(v) || 12,
                  page: 1,
                }))
              }
              options={[
                { value: 12, label: "12" },
                { value: 24, label: "24" },
                { value: 48, label: "48" },
              ]}
              placeholder="Select limit"
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
            {isLoading ? "Loading..." : `Total pending requests: ${total}`}
            {isError ? (
              <span className="ml-2 font-semibold text-red-600">
                | {errorText}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <div className="border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
              Loading...
            </div>
          ) : isError ? (
            <div className="border border-gray-200 bg-white px-6 py-10 text-center">
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
            <div className="border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
              No pending requests
            </div>
          ) : (
            <>
              {groupedSections.map((section) => (
                <SectionBlock
                  key={section.title}
                  title={section.title}
                  rows={section.rows}
                  onApprove={onApprove}
                  onReject={onReject}
                  approving={approving}
                  rejecting={rejecting}
                />
              ))}

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