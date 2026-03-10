import React from "react";
import { NavLink } from "react-router-dom";
import { FaEye, FaUsers, FaVideo, FaPlayCircle } from "react-icons/fa";

const LMSBar = () => {
  const menuItemsTop = [
    { icon: FaEye, label: "LMS", path: "/lms/list" },
    { icon: FaUsers, label: "Class", path: "/lms/class" },
    { icon: FaVideo, label: "Live", path: "/lms/live" },
    { icon: FaPlayCircle, label: "Recording", path: "/lms/recording" },
  ];

  return (
    <div className="h-full flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="w-[72px] sm:w-[110px] rounded-3xl border border-gray-200 bg-white shadow-lg px-2 py-4 sm:px-3 sm:py-6">
        <nav className="flex flex-col items-center gap-3 sm:gap-5">
          {menuItemsTop.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    "group w-full flex flex-col items-center justify-center rounded-2xl px-2 py-3 sm:px-3 sm:py-4 transition-all duration-200 border",
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
                        "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-all duration-200",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-600",
                      ].join(" ")}
                    >
                      <Icon className="text-base sm:text-lg" />
                    </div>

                    <span
                      className={[
                        "mt-2 text-[9px] sm:text-xs font-medium leading-tight text-center",
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

export default LMSBar;