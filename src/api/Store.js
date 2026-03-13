import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import authReducer from "./features/authSlice";
import { authApi } from "./authApi";

import gradeSubjectReducer from "./features/gradeSubjectSlice";
import { gradeSubjectApi } from "./gradeSubjectApi";

import teacherReducer from "./features/teacherSlice";
import { teacherApi } from "./teacherApi";

import { teacherAssignmentApi } from "./teacherAssignmentApi";

import classUiReducer from "./features/classSlice";
import { classApi } from "./classApi";

import lessonUiReducer from "./features/lessonSlice";
import { lessonApi } from "./lessonApi";

import liveUiReducer from "./features/liveSlice";
import { liveApi } from "./liveApi";

import enrollUiReducer from "./features/enrollSlice";
import { enrollApi } from "./enrollApi";

import paperReducer from "./features/paperSlice";
import { paperApi } from "./paperApi";

import questionUiReducer from "./features/questionSlice";
import { questionApi } from "./questionApi";

import { uploadApi } from "./uploadApi";

import studentReducer from "./features/studentSlice";
import { studentApi } from "./studentApi";

import { recordingApi } from "./recordingApi";

import { adminResultReportApi } from "./adminResultReportApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    gradeSubject: gradeSubjectReducer,
    teacher: teacherReducer,
    classUi: classUiReducer,
    lessonUi: lessonUiReducer,
    liveUi: liveUiReducer,
    enrollUi: enrollUiReducer,
    paper: paperReducer,
    questionUi: questionUiReducer,
    student: studentReducer,

    [authApi.reducerPath]: authApi.reducer,
    [gradeSubjectApi.reducerPath]: gradeSubjectApi.reducer,
    [teacherApi.reducerPath]: teacherApi.reducer,
    [teacherAssignmentApi.reducerPath]: teacherAssignmentApi.reducer,
    [classApi.reducerPath]: classApi.reducer,
    [lessonApi.reducerPath]: lessonApi.reducer,
    [liveApi.reducerPath]: liveApi.reducer,
    [enrollApi.reducerPath]: enrollApi.reducer,
    [paperApi.reducerPath]: paperApi.reducer,
    [questionApi.reducerPath]: questionApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
    [studentApi.reducerPath]: studentApi.reducer,
    [recordingApi.reducerPath]: recordingApi.reducer,
    [adminResultReportApi.reducerPath]: adminResultReportApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      gradeSubjectApi.middleware,
      teacherApi.middleware,
      teacherAssignmentApi.middleware,
      classApi.middleware,
      lessonApi.middleware,
      liveApi.middleware,
      enrollApi.middleware,
      paperApi.middleware,
      questionApi.middleware,
      uploadApi.middleware,
      studentApi.middleware,
      recordingApi.middleware,
      adminResultReportApi.middleware
    ),
});

setupListeners(store.dispatch);