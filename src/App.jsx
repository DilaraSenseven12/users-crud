import AppRouter from "./app/AppRouter";
import AppHeader from "./components/AppHeader/AppHeader";

export default function App() {
  return (
    <div className="app-shell">
      <AppHeader />

      <main className="app-main">
        <div className="app-container">
          <AppRouter />
        </div>
      </main>
    </div>
  );
}
