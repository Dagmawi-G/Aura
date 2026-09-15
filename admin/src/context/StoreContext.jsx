import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("aura_admin_token") || localStorage.getItem("token") || "";
  });

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

