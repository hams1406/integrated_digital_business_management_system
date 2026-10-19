import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  // Get logged-in user
  const user = JSON.parse(localStorage.getItem("user"));

  const username = user?.username || "Admin";
  const role = user?.role || "Admin";

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  return (
    <>
      {/* TOP SYSTEM INFORMATION */}
      <div className="top-system-bar">
        <div className="top-system-left">
          <span className="top-label">SYSTEM OVERVIEW</span>

          <span className="top-status">
            <span className="online-dot"></span>
            System Online
          </span>

          <span className="top-status">
            🗄️ Database Connected
          </span>

          <span className="top-status">
            🤖 AI Assistant Ready
          </span>

          <span className="top-status">
            🔐 Secure Session
          </span>
        </div>

        <div className="top-system-right">
          <span>Business Management Platform</span>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <header className="navbar">

        <div className="navbar-left">
          <h2 className="navbar-title">
            Integrated Digital Business Management System
          </h2>
        </div>

        <div className="navbar-right">

          <div className="navbar-user">

            <div className="user-icon">
              👤
            </div>

            <div className="user-info">
              <strong>{username}</strong>
              <small>{role}</small>
            </div>

          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            style={{
              marginLeft: "15px",
              padding: "9px 15px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            🚪 Logout
          </button>

        </div>

      </header>
    </>
  );
}

export default Navbar;