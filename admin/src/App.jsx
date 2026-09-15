import React from "react";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import OrderDetail from "./pages/Orders/OrderDetail";
import Stickers from "./pages/Stickers/Stickers";
import Settings from "./pages/Settings/Settings";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

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
          <Route path="/orders" element={<Orders url={url} />} />
          <Route path="/orders/:orderId" element={<OrderDetail url={url} />} />
          <Route path="/stickers" element={<Stickers url={url} />} />
          <Route path="/settings" element={<Settings url={url} />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
