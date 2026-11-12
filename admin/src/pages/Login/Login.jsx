import React, { useState, useContext } from "react";
import "./Login.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";

const Login = ({ url }) => {
  const { login } = useContext(StoreContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${url}/api/user/admin-login`, {
        email: email.trim(),
        password
      });

      if (res.data.success) {
        toast.success(`Welcome back, ${res.data.user?.name || "Admin"}!`);
        login(res.data.token, res.data.user);
      } else {
        setErrorMsg(res.data.message || "Invalid email or password.");
        toast.error(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      const msg = err.response?.data?.message || "Failed to connect to server. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg("");
  };

  return (
    <div className="admin-login-page">
      <div className="login-backdrop-glow"></div>
      
      <div className="login-card-container fade-in">
        <div className="login-brand-header">
          <div className="login-brand-badge">A</div>
          <h1 className="login-brand-title">AURA COLLECTION</h1>
          <p className="login-brand-subtitle">Administrator Portal Access</p>
        </div>

        {errorMsg && (
          <div className="login-error-banner">
            <span className="error-icon">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field-group">
            <label className="login-label">Admin Email Address</label>
            <div className="login-input-wrap">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                required
                className="login-input"
                placeholder="admin@aura.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="login-field-group">
            <div className="password-label-row">
              <label className="login-label">Password</label>
              <button
                type="button"
                className="btn-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="login-input-wrap">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner-wrap">
                <span className="login-spinner"></span> Authenticating...
              </span>
            ) : (
              <span>Sign In to Admin Panel →</span>
            )}
          </button>
        </form>

        <div className="login-quick-helper">
          <span className="helper-label">Default Super Admin Account:</span>
          <div className="helper-actions">
            <button
              type="button"
              className="btn-quick-fill"
              onClick={() => handleQuickFill("admin@aura.com", "admin12345")}
            >
              <span>🔑 Auto-Fill: <strong>admin@aura.com</strong> / <strong>admin12345</strong></span>
            </button>
          </div>
        </div>

        <div className="login-footer-security">
          <span>🔒 256-Bit Encrypted Administrator Session</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
