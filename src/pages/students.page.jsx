import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useGetStudentOptionsQuery,
  useGetStudentsQuery,
  useBanStudentMutation,
  useUnbanStudentMutation,
} from "../api/studentApi";
import {
  setStudentFilters,
  resetStudentFilters,
} from "../api/features/studentSlice";

const levelsToGrades = {
  primary: Array.from({ length: 5 }, (_, i) => String(i + 1)),
  secondary: Array.from({ length: 6 }, (_, i) => String(i + 6)),
  al: ["12", "13"],
};

const Modal = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>

        {footer ? (
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, placeholder = "" }) => (
  <div className="w-full">
    <label className="text-xs font-semibold text-gray-600">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    />
  </div>
);

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

const Th = ({ children, className = "" }) => (
  <th
    className={`border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 ${className}`}
  >
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td
    className={`border-b border-r border-gray-200 px-4 py-4 align-middle text-sm text-gray-700 ${className}`}
  >
    {children}
  </td>
);

const statusBadge = (statusKey) => {
  const active = String(statusKey || "").toLowerCase() === "active";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
};

const getErrorText = (error) => {
  if (!error) return "";
  return error?.data?.message || error?.error || "Failed to load students";
};

const StudentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const filters = useSelector((s) => s.student.filters);

  const { data: optData } = useGetStudentOptionsQuery();
  const districts = optData?.districts || [];
  const classes = optData?.classes || [];
  const levelOptions = optData?.levels || ["primary", "secondary", "al"];

  const gradeOptions = useMemo(() => {
    const lv = String(filters.level || "").trim();
    if (lv) return levelsToGrades[lv] || [];
    return (optData?.grades || []).map((g) => String(g));
  }, [filters.level, optData?.grades]);

  const { data, isLoading, isFetching, error } = useGetStudentsQuery(filters);

  const rows = data?.rows || [];
  const total = data?.total || 0;

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [banStudent, { isLoading: banning }] = useBanStudentMutation();
  const [unbanStudent, { isLoading: unbanning }] = useUnbanStudentMutation();

  useEffect(() => {
    if (
      filters.level &&
      filters.grade &&
      !gradeOptions.includes(String(filters.grade))
    ) {
      dispatch(setStudentFilters({ grade: "" }));
    }
  }, [filters.level, filters.grade, gradeOptions, dispatch]);

  const onSearch = (e) => {
    e.preventDefault();
    dispatch(setStudentFilters({ page: 1 }));
  };

  const onReset = () => {
    dispatch(resetStudentFilters());
  };

  const openBanModal = (row) => {
    setSelected(row);
    setBanModalOpen(true);
  };

  const doBanToggle = async () => {
    if (!selected?._id) return;

    try {
      if (selected?.isActive === false) {
        await unbanStudent(selected._id).unwrap();
      } else {
        await banStudent(selected._id).unwrap();
      }
      setBanModalOpen(false);
    } catch (err) {
      console.error("doBanToggle error:", err);
    }
  };

  const page = Number(data?.page || filters.page || 1);
  const limit = Number(data?.limit || filters.limit || 20);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const errorText = getErrorText(error);

  const goPage = (p) => {
    const next = Math.max(1, Math.min(totalPages, p));
    dispatch(setStudentFilters({ page: next }));
  };

  return (
    <div className="flex w-full justify-center ">
      <div className="w-full max-w-[96vw] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Student Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View registered students and manage their access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/home")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
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
          onSubmit={onSearch}
          className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(v) => dispatch(setStudentFilters({ status: v }))}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              placeholder="Select status"
            />

            <Input
              label="Phone Number"
              value={filters.phonenumber}
              onChange={(v) =>
                dispatch(setStudentFilters({ phonenumber: v }))
              }
              placeholder="0771234567"
            />

            <Select
              label="District"
              value={filters.district}
              onChange={(v) => dispatch(setStudentFilters({ district: v }))}
              options={districts}
              placeholder="Select district"
            />

            <Select
              label="Level"
              value={filters.level}
              onChange={(v) =>
                dispatch(setStudentFilters({ level: v, grade: "" }))
              }
              options={levelOptions.map((x) => ({
                value: x,
                label: x.toUpperCase(),
              }))}
              placeholder="Select level"
            />

            <Select
              label="Grade"
              value={filters.grade}
              onChange={(v) => dispatch(setStudentFilters({ grade: v }))}
              options={gradeOptions}
              placeholder={filters.level ? "Select grade" : "Select level first"}
            />

            <Select
              label="Class Name"
              value={filters.classId}
              onChange={(v) => dispatch(setStudentFilters({ classId: v }))}
              options={classes.map((c) => ({
                value: c.id,
                label: c.className,
              }))}
              placeholder="Select class"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Search
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            {isLoading || isFetching ? "Loading..." : `Total students: ${total}`}
            {error ? (
              <span className="ml-2 font-semibold text-red-600">
                | {errorText}
              </span>
            ) : null}
          </div>
        </form>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1400px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr>
                  <Th className="w-[15%]">Student Name</Th>
                  <Th className="w-[14%]">Phone Number</Th>
                  <Th className="w-[10%]">District</Th>
                  <Th className="w-[10%]">Town</Th>
                  <Th className="w-[15%]">Address</Th>
                  <Th className="w-[8%]">Level</Th>
                  <Th className="w-[7%]">Grade</Th>
                  <Th className="w-[13%]">Class Name</Th>
                  <Th className="w-[8%]">Status</Th>
                  <Th className="w-[10%] border-r-0 text-center">Operation</Th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {error ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-10 text-center text-sm font-medium text-red-600"
                    >
                      {errorText}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No students found
                    </td>
                  </tr>
                ) : (
                  rows.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <Td className="truncate font-semibold text-gray-900">
                        {s.name || "-"}
                      </Td>

                      <Td className="truncate">{s.phonenumber || "-"}</Td>

                      <Td className="truncate">{s.district || "-"}</Td>

                      <Td className="truncate">{s.town || "-"}</Td>

                      <Td className="truncate">{s.address || "-"}</Td>

                      <Td className="truncate">{s.selectedLevel || "-"}</Td>

                      <Td className="truncate">
                        {s.selectedGradeNumber ? String(s.selectedGradeNumber) : "-"}
                      </Td>

                      <Td>
                        {Array.isArray(s.classNames) && s.classNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {s.classNames.map((name, idx) => (
                              <span
                                key={`${name}-${idx}`}
                                className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </Td>

                      <Td>{statusBadge(s.statusKey)}</Td>

                      <Td className="border-r-0 text-center">
                        <button
                          type="button"
                          onClick={() => openBanModal(s)}
                          className={`inline-flex min-w-[82px] justify-center rounded-xl px-3 py-2 text-xs font-semibold text-white transition ${
                            s.isActive === false
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-purple-600 hover:bg-purple-700"
                          }`}
                        >
                          {s.isActive === false ? "Unban" : "Ban"}
                        </button>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Page {page} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goPage(1)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                First
              </button>

              <button
                onClick={() => goPage(page - 1)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Prev
              </button>

              <button
                onClick={() => goPage(page + 1)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </button>

              <button
                onClick={() => goPage(totalPages)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        </div>

        <Modal
          open={banModalOpen}
          title={selected?.isActive === false ? "Unban Student" : "Ban Student"}
          onClose={() => setBanModalOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBanModalOpen(false)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={doBanToggle}
                disabled={banning || unbanning}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  selected?.isActive === false
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {banning || unbanning
                  ? "Processing..."
                  : selected?.isActive === false
                  ? "Unban"
                  : "Ban"}
              </button>
            </div>
          }
        >
          <div className="text-sm text-gray-700">
            {selected?.isActive === false
              ? "Are you sure you want to unban this student?"
              : "Are you sure you want to ban this student? After banning, the student cannot access protected routes because isActive becomes false."}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default StudentsPage;