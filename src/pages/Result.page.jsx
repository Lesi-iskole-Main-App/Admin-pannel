import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAdminResultReportQuery } from "../api/adminResultReportApi";

const DEFAULT_PAPER_TYPE = "Daily Quiz";

const Input = ({ label, value, onChange, placeholder = "" }) => (
  <div className="w-full">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
    />
  </div>
);

const Select = ({ label, value, onChange, options, placeholder = "Select" }) => (
  <div className="w-full">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
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

const Th = ({ children, className = "" }) => (
  <th
    className={`border-b border-r border-gray-200 bg-[#F8FAFC] px-4 py-3 text-left text-[13px] font-medium text-gray-600 ${className}`}
  >
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td
    className={`border-b border-r border-gray-200 px-4 py-4 align-top text-sm text-gray-700 ${className}`}
  >
    {children}
  </td>
);

const Result = () => {
  const navigate = useNavigate();

  const [paperType, setPaperType] = useState(DEFAULT_PAPER_TYPE);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [completedPaperCount, setCompletedPaperCount] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    paperType: DEFAULT_PAPER_TYPE,
    subject: "",
    grade: "",
    completedPaperCount: "",
  });

  const [selectedSubjectRow, setSelectedSubjectRow] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const { data, isLoading, isFetching, error, refetch } =
    useGetAdminResultReportQuery(appliedFilters);

  const rows = useMemo(() => {
    return Array.isArray(data?.rows) ? data.rows : [];
  }, [data]);

  const rawPaperTypeOptions = useMemo(() => {
    return Array.isArray(data?.filters?.paperTypes) ? data.filters.paperTypes : [];
  }, [data]);

  const paperTypeOptions = useMemo(() => {
    const set = new Set(
      [DEFAULT_PAPER_TYPE, ...rawPaperTypeOptions]
        .map((v) => String(v || "").trim())
        .filter(Boolean)
    );
    return Array.from(set);
  }, [rawPaperTypeOptions]);

  const subjectOptions = useMemo(() => {
    return Array.isArray(data?.filters?.subjects) ? data.filters.subjects : [];
  }, [data]);

  const gradeOptions = useMemo(() => {
    return Array.isArray(data?.filters?.grades) ? data.filters.grades : [];
  }, [data]);

  const errorMessage = useMemo(() => {
    if (!error) return "";
    if ("status" in error) {
      return error?.data?.message || `Request failed (${error.status})`;
    }
    return error?.message || "Something went wrong";
  }, [error]);

  const infoMessage = useMemo(() => {
    return String(data?.message || "").trim();
  }, [data]);

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedFilters({
      paperType: paperType.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      completedPaperCount: completedPaperCount.trim(),
    });
  };

  const handleReset = () => {
    setPaperType(DEFAULT_PAPER_TYPE);
    setSubject("");
    setGrade("");
    setCompletedPaperCount("");
    setAppliedFilters({
      paperType: DEFAULT_PAPER_TYPE,
      subject: "",
      grade: "",
      completedPaperCount: "",
    });
  };

  return (
    <>
      <div className="flex w-full justify-center">
        <div className="min-w-0 w-full max-w-[95vw] px-3 py-4 sm:px-6 sm:py-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Result
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Filter and review highest score result records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    refetch();
                  } catch (err) {
                    console.error("Result page refetch error:", err);
                  }
                }}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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

          {/* Filter Box */}
          <form
            onSubmit={handleSearch}
            className="mt-5 border border-gray-200 bg-white p-4 sm:p-5"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select
                label="Paper Type"
                value={paperType}
                onChange={setPaperType}
                options={paperTypeOptions}
                placeholder="Select Type"
              />

              <Select
                label="Subject"
                value={subject}
                onChange={setSubject}
                options={subjectOptions}
                placeholder="Select Subject"
              />

              <Select
                label="Grade"
                value={grade}
                onChange={setGrade}
                options={gradeOptions}
                placeholder="Select Grade"
              />

              <Input
                label="Completed Paper Count"
                value={completedPaperCount}
                onChange={(v) => setCompletedPaperCount(v.replace(/[^\d]/g, ""))}
                placeholder="Enter number"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Search
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Reset
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Total: {Number(data?.total || rows.length || 0)}
            </div>

            {infoMessage ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {infoMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
          </form>

          {/* Table */}
          <div className="mt-5 overflow-hidden border border-gray-200 bg-white">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1550px] table-fixed border-separate border-spacing-0">
                <thead>
                  <tr>
                    <Th className="w-[18%]">Student Name</Th>
                    <Th className="w-[12%]">Grade</Th>
                    <Th className="w-[10%] text-center">Island Rank</Th>
                    <Th className="w-[12%] text-center">Subjects</Th>
                    <Th className="w-[12%]">Completed Paper Count</Th>
                    <Th className="w-[10%] text-center">Free Paper Count</Th>
                    <Th className="w-[10%] text-center">Practise Paper Count</Th>
                    <Th className="w-[10%] text-center">Paid Paper Count</Th>
                    <Th className="w-[16%] border-r-0 text-center">View Report</Th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {isLoading || isFetching ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-gray-500" colSpan={9}>
                        Loading results...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-gray-500" colSpan={9}>
                        {subject ? "No results found" : "Please first choose subject"}
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/70">
                        <Td className="truncate font-medium text-gray-800">
                          {r.studentName || "-"}
                        </Td>

                        <Td className="truncate">{r.grade || "-"}</Td>

                        <Td className="text-center font-semibold">
                          {r.islandRank || "-"}
                        </Td>

                        <Td className="text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedSubjectRow(r)}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            View
                          </button>
                        </Td>

                        <Td className="truncate">
                          {Number(r.completedPapersCount || 0)}
                        </Td>

                        <Td className="text-center">
                          {Number(r.freePaperCount || 0)}
                        </Td>

                        <Td className="text-center">
                          {Number(r.practisePaperCount || 0)}
                        </Td>

                        <Td className="text-center">
                          {Number(r.paidPaperCount || 0)}
                        </Td>

                        <Td className="border-r-0 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedReport(r)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-blue-700"
                          >
                            View Report
                          </button>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2 border-t border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <span>Showing {rows.length} record(s)</span>
              <span>Highest score result only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Modal */}
      {selectedSubjectRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedSubjectRow.studentName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubjectRow(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4">
              {Array.isArray(selectedSubjectRow.subjects) &&
              selectedSubjectRow.subjects.length > 0 ? (
                <div className="space-y-2">
                  {selectedSubjectRow.subjects.map((sub, index) => (
                    <div
                      key={`${selectedSubjectRow.id}-${sub}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {index + 1}. {sub}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No subjects found</div>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedSubjectRow(null)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-[#F3F4F6]">
          <button
            type="button"
            onClick={() => setSelectedReport(null)}
            className="absolute left-6 top-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl"
            title="Back"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>Back</span>
          </button>

          <div className="flex min-h-screen items-center justify-center px-4 py-16">
            <div className="w-full max-w-3xl rounded-2xl bg-[#F7F7F7] px-6 py-8 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <svg viewBox="0 0 64 64" className="h-12 w-12">
                  <circle cx="32" cy="24" r="12" fill="#F2B07B" />
                  <path d="M20 52c2-10 8-14 12-14s10 4 12 14" fill="#9CA3AF" />
                  <path d="M22 20c2-8 7-12 10-12 5 0 10 4 12 12l-2 5H24z" fill="#6B7280" />
                </svg>
              </div>

              <div className="mt-3 text-center">
                <p className="text-sm font-semibold text-gray-800">
                  Name : {selectedReport.studentName}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  Grade : {selectedReport.grade}
                </p>
              </div>

              <div className="mt-6 overflow-hidden border border-gray-300 bg-white">
                <table className="w-full border-separate border-spacing-0 text-center">
                  <thead>
                    <tr>
                      <th className="border-b border-r border-gray-300 px-3 py-3 text-[12px] font-semibold text-gray-700">
                        Paper Name
                      </th>
                      <th className="border-b border-r border-gray-300 px-3 py-3 text-[12px] font-semibold text-gray-700">
                        Correct Answers
                      </th>
                      <th className="border-b border-r border-gray-300 px-3 py-3 text-[12px] font-semibold text-gray-700">
                        Result Mark
                      </th>
                      <th className="border-b border-gray-300 px-3 py-3 text-[12px] font-semibold text-gray-700">
                        Progress
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {Array.isArray(selectedReport.results) &&
                    selectedReport.results.length > 0 ? (
                      selectedReport.results.map((item, index) => (
                        <tr key={`${selectedReport.id}-${index}`}>
                          <td className="border-b border-r border-gray-300 px-3 py-4 text-[12px] text-gray-700">
                            {item.paperName}
                          </td>
                          <td className="border-b border-r border-gray-300 px-3 py-4 text-[12px] text-gray-700">
                            {item.correctAnswers}
                          </td>
                          <td className="border-b border-r border-gray-300 px-3 py-4 text-[12px] text-gray-700">
                            {item.marks}
                          </td>
                          <td className="border-b border-gray-300 px-3 py-4 text-[12px] text-gray-700">
                            {item.progress}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-6 text-[12px] text-gray-500" colSpan={4}>
                          No result details found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Result;