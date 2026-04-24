import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';

// 路由懒加载 - 优化首屏加载性能
const Homepage = lazy(() => import('./pages/Homepage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminRegisterPage = lazy(() => import('./pages/admin/AdminRegisterPage'));
const ChooseUser = lazy(() => import('./pages/ChooseUser'));
const CoursewareShareView = lazy(() => import('./pages/shared/CoursewareShareView'));
const AssessmentShareView = lazy(() => import('./pages/shared/AssessmentShareView'));

// 全屏加载指示器
const FullScreenLoader = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: 2
    }}
  >
    <CircularProgress size={48} />
    <Typography variant="body1" color="text.secondary">
      加载中...
    </Typography>
  </Box>
);

// 路由保护组件 - 根据角色显示不同内容
const RoleBasedRoute = ({ role, children, fallback }) => {
  const { currentRole } = useSelector(state => state.user);

  if (currentRole === role) {
    return children;
  }
  return fallback;
};

const App = () => {
  const { currentRole } = useSelector(state => state.user);

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            {/* 公开的分享链接路由 - 任何人都可以访问 */}
            <Route path="/share/courseware/:token" element={<CoursewareShareView />} />
            <Route path="/share/assessment/:token" element={<AssessmentShareView />} />

            {/* 未登录用户路由 */}
            {currentRole === null && (
              <>
                <Route path="/" element={<Homepage />} />
                <Route path="/choose" element={<ChooseUser visitor="normal" />} />
                <Route path="/chooseasguest" element={<ChooseUser visitor="guest" />} />
                <Route path="/Adminlogin" element={<LoginPage role="Admin" />} />
                <Route path="/Studentlogin" element={<LoginPage role="Student" />} />
                <Route path="/Teacherlogin" element={<LoginPage role="Teacher" />} />
                <Route path="/Adminregister" element={<AdminRegisterPage />} />
                <Route path='*' element={<Navigate to="/" replace />} />
              </>
            )}

            {/* 已登录用户路由 - 重定向到对应 Dashboard */}
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
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
