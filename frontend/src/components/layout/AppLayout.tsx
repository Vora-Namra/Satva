import { NavLink, Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ROUTES } from "../../constants/routes";
import { logout } from "../../features/auth/authSlice";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";

const navItems = [
  { to: ROUTES.dashboard, label: "Dashboard" },
  { to: ROUTES.hospitals, label: "Hospitals" },
  { to: ROUTES.doctors, label: "Doctors" },
  { to: ROUTES.staff, label: "Staff" },
  { to: ROUTES.patients, label: "Patients" },
  { to: ROUTES.appointments, label: "Appointments" },
];

export function AppLayout() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Satva</div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div>
            <strong>{user?.email}</strong>
            <span>{user?.role}</span>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={toggleTheme}>
              {theme === "light" ? "Dark" : "Light"}
            </button>
            <button type="button" onClick={() => dispatch(logout())}>
              Logout
            </button>
          </div>
        </header>
        <section className="page-content">
          <Outlet />
        </section>
      </div>
      <ToastContainer position="top-right" autoClose={2500} />
    </div>
  );
}
