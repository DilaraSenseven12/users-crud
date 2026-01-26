import { Outlet } from "react-router-dom";
import AppHeader from "../components/AppHeader/AppHeader";

export default function AppLayout() {
  return (
    <div className="app-shell">

      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
