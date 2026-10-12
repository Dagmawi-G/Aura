import React from "react";
import ReactDOM from "react-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import TrackOrder from "./pages/TrackOrder/TrackOrder";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const toastRoot = typeof document !== "undefined" ? document.getElementById("toast-root") || document.body : null;

  return (
    <>
      {toastRoot &&
        ReactDOM.createPortal(
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
            style={{ zIndex: 99999999 }}
          />,
          toastRoot
        )}
      <Navbar />
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/trackorder" element={<TrackOrder />} />
          <Route path="/myorders" element={<TrackOrder />} />
          <Route path="/my-orders" element={<TrackOrder />} />
          <Route path="/orders" element={<TrackOrder />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
};

export default App;
