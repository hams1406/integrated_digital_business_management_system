import { useState } from "react";

function Settings() {
  const [profile, setProfile] = useState({
    name: "Admin",
    email: "admin@company.com",
    phone: "9876543210",
  });

  const [password, setPassword] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    system: true,
    reports: true,
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    alert("Profile settings saved!");
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();

    if (!password.current || !password.newPassword || !password.confirm) {
      alert("Please fill all password fields.");
      return;
    }

    if (password.newPassword !== password.confirm) {
      alert("New passwords do not match!");
      return;
    }

    if (password.newPassword.length < 8) {
      alert("Password must contain at least 8 characters.");
      return;
    }

    alert(
      "Password form validated. Connect the backend API to change your password."
    );
  };

  const handleNotificationSave = () => {
    localStorage.setItem(
      "notificationSettings",
      JSON.stringify(notifications)
    );

    alert("Notification preferences saved!");
  };

  const cardStyle = {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    minWidth: 0,
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    marginTop: "8px",
    marginBottom: "18px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "14px",
  };

  const buttonStyle = {
    padding: "11px 18px",
    background: "#51318b",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const fieldLabelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#273449",
  };

  const notificationItems = [
    {
      key: "email",
      title: "Email Notifications",
      description: "Receive important updates via email",
    },
    {
      key: "system",
      title: "System Notifications",
      description: "Show system notifications in the dashboard",
    },
    {
      key: "reports",
      title: "Report Notifications",
      description: "Receive reports and summaries via email",
    },
  ];

  return (
    <div
      style={{
        padding: "30px",
        background: "#f8fafc",
        minHeight: "100vh",
        boxSizing: "border-box",
        color: "#111827",
      }}
    >
      {/* PAGE TITLE */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: "32px" }}>
          ⚙️ Settings
        </h1>

        <p style={{ margin: 0, color: "#475569" }}>
          Manage your account and system preferences
        </p>
      </div>

      {/* PROFILE AND PASSWORD */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))",
          gap: "24px",
          alignItems: "stretch",
        }}
      >
        {/* PROFILE SETTINGS */}
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "22px" }}>
            👤 Profile Settings
          </h2>

          <form onSubmit={handleProfileSave}>
            <label style={fieldLabelStyle}>Name</label>

            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
              style={inputStyle}
              required
            />

            <label style={fieldLabelStyle}>Email</label>

            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              style={inputStyle}
              required
            />

            <label style={fieldLabelStyle}>Phone</label>

            <input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              style={inputStyle}
            />

            <label style={fieldLabelStyle}>Role</label>

            <input
              type="text"
              value="Admin"
              readOnly
              style={{
                ...inputStyle,
                background: "#f1f5f9",
                color: "#64748b",
              }}
            />

            <button type="submit" style={buttonStyle}>
              💾 Update Profile
            </button>
          </form>
        </section>

        {/* CHANGE PASSWORD */}
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "22px" }}>
            🔒 Change Password
          </h2>

          <form onSubmit={handlePasswordChange}>
            <label style={fieldLabelStyle}>Current Password</label>

            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter current password"
              value={password.current}
              onChange={(e) =>
                setPassword({ ...password, current: e.target.value })
              }
              style={inputStyle}
              required
            />

            <label style={fieldLabelStyle}>New Password</label>

            <input
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password"
              value={password.newPassword}
              onChange={(e) =>
                setPassword({ ...password, newPassword: e.target.value })
              }
              style={inputStyle}
              minLength={8}
              required
            />

            <label style={fieldLabelStyle}>Confirm New Password</label>

            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={password.confirm}
              onChange={(e) =>
                setPassword({ ...password, confirm: e.target.value })
              }
              style={inputStyle}
              minLength={8}
              required
            />

            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <button type="submit" style={buttonStyle}>
                🔒 Update Password
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* NOTIFICATION SETTINGS */}
      <section style={{ ...cardStyle, marginTop: "24px" }}>
        <h2 style={{ marginTop: 0, fontSize: "22px" }}>
          🔔 Notification Settings
        </h2>

        {notificationItems.map((item) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              padding: "17px 0",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div>
              <strong>{item.title}</strong>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "14px",
                  color: "#64748b",
                }}
              >
                {item.description}
              </p>
            </div>

            <input
              type="checkbox"
              checked={notifications[item.key]}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  [item.key]: e.target.checked,
                })
              }
              aria-label={item.title}
              style={{
                width: "20px",
                height: "20px",
                accentColor: "#51318b",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          </div>
        ))}

        <button
          onClick={handleNotificationSave}
          style={{ ...buttonStyle, marginTop: "20px" }}
        >
          💾 Save Preferences
        </button>
      </section>
    </div>
  );
}

export default Settings;