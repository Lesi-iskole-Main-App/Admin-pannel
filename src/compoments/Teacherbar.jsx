import React, { memo } from "react";
import { NavLink } from "react-router-dom";
import { FaChalkboardTeacher, FaEye, FaUserShield } from "react-icons/fa";

const MENU_ITEMS = [
  { icon: FaChalkboardTeacher, label: "Teachers", path: "/teacher/list" },
  { icon: FaEye, label: "View Teacher", path: "/teacher/view" },
  { icon: FaUserShield, label: "Permission", path: "/teacher/permission" },
];

const TeacherBar = () => {
  return (
    <div className="h-full flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="w-[72px] sm:w-[110px] rounded-3xl border border-gray-200 bg-white shadow-lg px-2 py-4 sm:px-3 sm:py-6">
        <nav className="flex flex-col items-center gap-3 sm:gap-5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  [
                    "group w-full flex flex-col items-center justify-center rounded-2xl border px-2 py-3 transition-all duration-200 sm:px-3 sm:py-4",
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-600 shadow-sm"
                      : "border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-blue-600",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200 sm:h-12 sm:w-12",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-600",
                      ].join(" ")}
                    >
                      <Icon className="text-base sm:text-lg" />
                    </div>

                    <span
                      className={[
                        "mt-2 text-center text-[9px] font-medium leading-tight sm:text-xs",
                        isActive
                          ? "text-blue-700"
                          : "text-gray-600 group-hover:text-blue-600",
                      ].join(" ")}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default memo(TeacherBar);