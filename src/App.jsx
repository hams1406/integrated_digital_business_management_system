import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Employee from "./pages/Employee";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Layout from "./Layout";

// PROTECTED ROUTE
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN PAGE */}
        <Route path="/" element={<Login />} />

        {/* PROTECTED PAGES WITH COMMON LAYOUT */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/employee"
            element={<Employee />}
          />

          <Route
            path="/sales"
            element={<Sales />}
          />

          <Route
            path="/inventory"
            element={<Inventory />}
          />

          <Route
            path="/finance"
            element={<Finance />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/ai"
            element={<AIAssistant />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Route>

        {/* UNKNOWN URL */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;