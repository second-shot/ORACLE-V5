import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { ControlPanel } from "./components/ControlPanel.jsx";
import Entry from "./pages/Entry.jsx";
import Run from "./pages/Run.jsx";
import Home from "./pages/Home.jsx";
import OutputPage from "./pages/OutputPage.jsx";
import Missions from "./pages/Missions.jsx";

function Shell() {
  return (
    <>
      <header className="oracle-header">
        <NavLink to="/" className="oracle-wordmark" aria-label="Oracle home">
          ORACLE
        </NavLink>
        <span className="oracle-version">V5</span>
        <nav className="oracle-nav" aria-label="Main navigation">
          <NavLink
            to="/run"
            className={({ isActive }) =>
              `oracle-nav__btn${isActive ? " oracle-nav__btn--active" : ""}`
            }
          >
            Run
          </NavLink>
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `oracle-nav__btn${isActive ? " oracle-nav__btn--active" : ""}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/missions"
            className={({ isActive }) =>
              `oracle-nav__btn${isActive ? " oracle-nav__btn--active" : ""}`
            }
          >
            Missions
          </NavLink>
          <NavLink
            to="/panel"
            className={({ isActive }) =>
              `oracle-nav__btn${isActive ? " oracle-nav__btn--active" : ""}`
            }
          >
            Panel
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/run" element={<Run />} />
        <Route path="/home" element={<Home />} />
        <Route path="/output/:id" element={<OutputPage />} />
        <Route path="/missions" element={<Missions />} />
        <Route
          path="/panel"
          element={
            <main className="oracle-shell">
              <ControlPanel />
            </main>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/*" element={<Shell />} />
      </Routes>
    </BrowserRouter>
  );
}
