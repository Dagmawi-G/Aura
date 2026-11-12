import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const getStoredToken = () =>
  localStorage.getItem("aura_admin_token") || localStorage.getItem("token") || "";

// Attach the admin token to every request sent to our own backend (never to third parties)
axios.interceptors.request.use((config) => {
  const storedToken = getStoredToken();
  if (storedToken && config.url && config.url.startsWith(BACKEND_URL)) {
    config.headers.Authorization = `Bearer ${storedToken}`;
  }
  return config;
});

const StoreContextProvider = (props) => {
  const url = BACKEND_URL;
  const [token, setToken] = useState(getStoredToken);

  // Sign out when the backend rejects the session (expired token or admin rights removed)
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const reqUrl = error.config?.url || "";
        const isBackendCall = reqUrl.startsWith(BACKEND_URL);
        const isLoginCall = reqUrl.includes("/api/user/admin-login");
        if (isBackendCall && !isLoginCall && (status === 401 || status === 403)) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  useEffect(() => {
    // Keep Render backend awake while admin dashboard is open
    const ping = () => {
      axios.get(`${url}/api/ping`).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 8 * 60 * 1000);
    return () => clearInterval(interval);
  }, [url]);

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_admin_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const login = (newToken, userObj) => {
    setToken(newToken);
    setAdminUser(userObj);
    localStorage.setItem("aura_admin_token", newToken);
    localStorage.setItem("token", newToken);
    if (userObj) {
      localStorage.setItem("aura_admin_user", JSON.stringify(userObj));
    }
  };

  const logout = () => {
    setToken("");
    setAdminUser(null);
    localStorage.removeItem("aura_admin_token");
    localStorage.removeItem("token");
    localStorage.removeItem("aura_admin_user");
  };

  const getAuthHeaders = () => {
    return {
      headers: {
        token: token,
        Authorization: `Bearer ${token}`
      }
    };
  };

  const contextValue = {
    token,
    adminUser,
    login,
    logout,
    getAuthHeaders,
    isAuthenticated: Boolean(token)
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;

