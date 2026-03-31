import React, { memo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TeacherBar from "../compoments/Teacherbar";

function TeacherLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F6F6]">
      {/* LEFT */}
      <div className="flex h-full w-[56px] shrink-0 justify-start pl-5 sm:w-[110px] sm:pl-0">
        <TeacherBar />
      </div>

      {/* RIGHT */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto p-4">
          <div key={location.pathname} className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TeacherLayout);