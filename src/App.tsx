// src/App.tsx
import React from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";

// Nav (baseline component)
import NavBar from "./components/NavBar";
import TopNav from "./components/TopNav";

import { useWeek } from "./hooks/useWeek";

// Views (from src/views)
import WeekView from "./views/WeekView";
import InsightsView from "./views/InsightsView";
import LibraryView from "./views/LibraryView";
import SettingsView from "./views/SettingsView";

export default function App() {
  const { settings } = useWeek();

  React.useEffect(() => {
    const theme = settings?.dark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, [settings?.dark]);

  return (
    <div className="whb-app bg-bokeh">

      {/* Main content */}
      <main className="whb-app__main">
        <TopNav />
        <div className="whb-app__content">
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/week" replace />} />

            {/* Primary routes */}
            <Route path="/week" element={<WeekView />} />
            <Route path="/insights" element={<InsightsView />} />
            <Route path="/library" element={<LibraryView />} />
            <Route path="/settings" element={<SettingsView />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<WeekView />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
