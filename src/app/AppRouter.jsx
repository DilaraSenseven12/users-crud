import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./AppLayout";

import UsersPage from "../pages/UsersPage/UsersPage";
import UserDetailPage from "../pages/UserDetailPage/UserDetailPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
      </Route>
    </Routes>
  );
}
