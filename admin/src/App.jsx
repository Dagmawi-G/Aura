import React, { useContext } from "react";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes, Navigate } from "react-router-dom";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import OrderDetail from "./pages/Orders/OrderDetail";
import Stickers from "./pages/Stickers/Stickers";
import Settings from "./pages/Settings/Settings";
import Admins from "./pages/Admins/Admins";
import Login from "./pages/Login/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { StoreContext } from "./context/StoreContext";

const App = () => {
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const { token } = useContext(StoreContext);

  if (!token) {
    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <Login url={url} />
      </>
    );
  }

  return (
    <div className="admin-layout">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Navbar url={url} />
      <main className="admin-main-content">
        <Routes>
          <Route path="/" element={<List url={url} />} />
          <Route path="/items" element={<List url={url} />} />
          <Route path="/list" element={<List url={url} />} />
          <Route path="/orders" element={<Orders url={url} />} />
          <Route path="/order" element={<Navigate to="/orders" replace />} />
          <Route path="/orders/:orderId" element={<OrderDetail url={url} />} />
          <Route path="/order/:orderId" element={<OrderDetail url={url} />} />
          <Route path="/stickers" element={<Stickers url={url} />} />
          <Route path="/settings" element={<Settings url={url} />} />
          <Route path="/admins" element={<Admins url={url} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

