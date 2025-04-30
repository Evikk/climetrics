import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import NavBar from "./components/NavBar";

import HomePage from "./pages/HomePage";
import AlertsPage from "./pages/AlertsPage";
import CurrentStatePage from "./pages/CurrentStatePage";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/current-state" element={<CurrentStatePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
