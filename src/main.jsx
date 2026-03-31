import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { store } from "./api/Store";
import "./index.css";

// auth pages
import SignUpPage from "./pages/signup.page";
import SignInPage from "./pages/signin.page";
import OTPPage from "./pages/OTP.page";
import ForgotPassword from "./pages/Forgotpassword";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// main pages
import HomePage from "./pages/home.page";
import GradeSubjectPage from "./pages/Grade.Subject.page";
import Result from "./pages/Result.page";

// paper module
import PaperLayout from "./layout/PaperLayout";
import PapersPage from "./pages/papers.page";
import ViewPaperPage from "./pages/ViewPaperPage";
import QuestionPage from "./pages/Quesion.page";
import CreatePaperQuestionsPage from "./compoments/CreateQuestionCard";
import ViewPaperQuestionsPage from "./pages/ViewPaperQuestionsPage";

// recording page
import RecordingPage from "./pages/Recording.page";

// teacher module
import TeacherLayout from "./layout/TeacherLayout";
import TeacherPage from "./pages/Teacher.page";
import ViewTeacherPage from "./pages/ViewTeacher.page";
import PermissonTeachers from "./pages/PermissionTeachers";

// student module
import StudentLayout from "./layout/StudentLayout";
import StudentsPage from "./pages/students.page";
import PermissionStudents from "./pages/PermissionStudents";

// lms module
import LMSLayout from "./layout/LMSLayout";
import LMSPage from "./pages/lms.page";
import ClassPage from "./pages/class.page";
import LivePage from "./pages/Live.page";

// route guards
import AdminRoute from "./compoments/AdminRoute";
import ProtectedRoute from "./compoments/ProtectedRoute";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignUpPage />} />
          <Route path="/otp" element={<OTPPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/grade-subject"
            element={
              <ProtectedRoute>
                <GradeSubjectPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <Result />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/list" replace />} />
            <Route path="list" element={<StudentsPage key="student-list" />} />
            <Route
              path="permission"
              element={
                <AdminRoute>
                  <PermissionStudents key="student-permission" />
                </AdminRoute>
              }
            />
          </Route>

          <Route
            path="/paper"
            element={
              <ProtectedRoute>
                <PaperLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/paper/papers" replace />} />
            <Route path="papers" element={<PapersPage key="paper-papers" />} />
            <Route path="view" element={<ViewPaperPage key="paper-view" />} />
            <Route
              path=":paperId/questions/create"
              element={<CreatePaperQuestionsPage key="paper-create-question" />}
            />
            <Route
              path=":paperId/questions/view"
              element={<ViewPaperQuestionsPage key="paper-view-question" />}
            />
            <Route path="question" element={<QuestionPage key="paper-question" />} />
          </Route>

          <Route
            path="/teacher"
            element={
              <ProtectedRoute>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/teacher/list" replace />} />
            <Route path="list" element={<TeacherPage key="teacher-list" />} />
            <Route path="view" element={<ViewTeacherPage key="teacher-view" />} />
            <Route
              path="permission"
              element={
                <AdminRoute>
                  <PermissonTeachers key="teacher-permission" />
                </AdminRoute>
              }
            />
          </Route>

          <Route
            path="/lms"
            element={
              <ProtectedRoute>
                <LMSLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/lms/list" replace />} />
            <Route path="list" element={<LMSPage key="lms-list" />} />

            <Route
              path="class"
              element={
                <AdminRoute>
                  <ClassPage key="lms-class" />
                </AdminRoute>
              }
            />

            <Route
              path="live"
              element={
                <AdminRoute>
                  <LivePage key="lms-live" />
                </AdminRoute>
              }
            />

            <Route
              path="recording"
              element={
                <AdminRoute>
                  <RecordingPage key="lms-recording" />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);