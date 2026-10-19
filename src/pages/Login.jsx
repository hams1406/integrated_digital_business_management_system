import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      // =========================
      // BACKEND LOGIN
      // =========================
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      // =========================
      // LOGIN SUCCESS
      // =========================
      if (response.ok && data.success) {
        // Save JWT token
        localStorage.setItem("token", data.token);

        // Save logged-in user details
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        alert("Login successful!");

        // Go to dashboard
        navigate("/dashboard");
      } else {
        alert(data.message || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Backend server is not connected. Please start the backend on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #0f172a, #1e3a8a)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "420px",
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        {/* Software Name */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              fontSize: "30px",
              lineHeight: "1.2",
              margin: 0,
              color: "#1e3a8a",
            }}
          >
            Integrated Digital
            <br />
            Business Management
            <br />
            System
          </h1>

          <p
            style={{
              marginTop: "12px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Enterprise Management Platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            Email / Username
          </label>

          <input
            type="text"
            placeholder="Enter your username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "20px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              boxSizing: "border-box",
              fontSize: "15px",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "25px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              boxSizing: "border-box",
              fontSize: "15px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#94a3b8" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Login Information */}
        <div
          style={{
            marginTop: "25px",
            padding: "15px",
            background: "#f1f5f9",
            borderRadius: "8px",
            textAlign: "center",
            fontSize: "13px",
            color: "#475569",
          }}
        >
          <strong>Admin Login</strong>

          <br />

          Username: admin

          <br />

          Password: admin123
        </div>
      </div>
    </div>
  );
}

export default Login;