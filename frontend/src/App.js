import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import Homepage from './pages/Homepage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import LoginPage from './pages/LoginPage';
import AdminRegisterPage from './pages/admin/AdminRegisterPage';
import ChooseUser from './pages/ChooseUser';
import CoursewareShareView from './pages/shared/CoursewareShareView';
import AssessmentShareView from './pages/shared/AssessmentShareView';

const App = () => {
  const { currentRole } = useSelector(state => state.user);

  return (
    <Router>
      <Routes>
        {/* 公开的分享链接路由 - 任何人都可以访问 */}
        <Route path="/share/courseware/:token" element={<CoursewareShareView />} />
        <Route path="/share/assessment/:token" element={<AssessmentShareView />} />

        {/* 根据用户角色显示不同的路由 */}
        {currentRole === null && (
          <>
            <Route path="/" element={<Homepage />} />
            <Route path="/choose" element={<ChooseUser visitor="normal" />} />
            <Route path="/chooseasguest" element={<ChooseUser visitor="guest" />} />

            <Route path="/Adminlogin" element={<LoginPage role="Admin" />} />
            <Route path="/Studentlogin" element={<LoginPage role="Student" />} />
            <Route path="/Teacherlogin" element={<LoginPage role="Teacher" />} />

            <Route path="/Adminregister" element={<AdminRegisterPage />} />

            <Route path='*' element={<Navigate to="/" />} />
          </>
        )}

        {/* 已登录用户重定向到对应的Dashboard */}
        {currentRole === "Admin" && (
          <Route path="*" element={<AdminDashboard />} />
        )}

        {currentRole === "Student" && (
          <Route path="*" element={<StudentDashboard />} />
        )}

        {currentRole === "Teacher" && (
          <Route path="*" element={<TeacherDashboard />} />
        )}
      </Routes>
    </Router>
  );
};

export default App