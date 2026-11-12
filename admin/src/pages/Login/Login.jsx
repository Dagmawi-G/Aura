import React, { useState, useContext } from "react";
import "./Login.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";

const Login = ({ url }) => {
  const { login } = useContext(StoreContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${url}/api/user/admin-login`, {
        username: username.trim(),
        password
      });

      if (res.data.success) {
        toast.success(`Welcome back, ${res.data.user?.name || "Admin"}!`);
        login(res.data.token, res.data.user);
      } else {
        setErrorMsg(res.data.message || "Invalid username or password.");
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
            <label className="login-label">Admin Username</label>
            <div className="login-input-wrap">
              <span className="input-icon">👤</span>
              <input
                type="text"
                required
                className="login-input"
                placeholder="Admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
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

        <div className="login-footer-security">
          <span>🔒 256-Bit Encrypted Administrator Session</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
