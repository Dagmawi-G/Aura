import React, { useState, useEffect, useContext } from "react";
import "./TrackOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const TrackOrder = () => {
  const { url, settings } = useContext(StoreContext);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (searchVal) => {
    const q = (searchVal !== undefined ? searchVal : query).trim();
    if (!q) {
      toast.error("Please enter an Order Reference ID or Phone Number");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(`${url}/api/order/track/${encodeURIComponent(q)}`);
      if (res.data.success) {
        setOrders(res.data.data);
      } else {
        setOrders([]);
        toast.info(res.data.message || "No orders found");
      }
    } catch (e) {
      setOrders([]);
      if (e.response?.status === 404) {
        toast.info("No matching orders found. Please verify your reference ID or phone number.");
      } else {
        toast.error("Error looking up order status");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialQuery = searchParams.get("query");
    if (initialQuery) {
      setQuery(initialQuery);
      handleTrack(initialQuery);
    }
  }, [searchParams]);

  const getStepActiveIndex = (status, deliveryType) => {
    switch (status) {
      case "Pending Verification":
        return 0;
      case "Payment Verified":
        return 1;
      case "Processing / Printing":
        return 2;
      case "Out for Delivery":
      case "Ready for Pickup":
        return 3;
      case "Completed":
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="track-order-page fade-in">
      <div className="track-header-wrap">
        <span className="track-kicker">Live Order Status</span>
        <h1 className="page-heading">Track Your Aura Order</h1>
        <p className="page-subheading">
          Enter your Order Reference Number (e.g. AUR-269482) or phone number to see live custom printing & delivery updates
        </p>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="track-search-bar"
        >
          <input
            type="text"
            className="track-search-input"
            placeholder="Enter Order ID (AUR-XXXX) or Phone Number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-track-submit" disabled={loading}>
            {loading ? "Searching..." : "Track Status"}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="track-loading">
          <div className="spinner"></div>
          <p>Looking up your order details...</p>
        </div>
      ) : searched && orders.length === 0 ? (
        <div className="no-order-found aura-glass">
          <div className="not-found-icon">🔍</div>
          <h3>No Orders Found</h3>
          <p>We couldn't find an order matching "{query}". Please check your order reference number or contact us.</p>
        </div>
      ) : (
        <div className="tracked-orders-list">
          {orders.map((order) => {
            const stepIdx = getStepActiveIndex(order.status, order.deliveryType);
            const isPickup = order.deliveryType === "Pickup";

            return (
              <div key={order._id} className="tracked-order-card aura-glass">
                {/* Order Top Bar */}
                <div className="tracked-top-bar">
                  <div className="order-id-block">
                    <span className="order-ref-label">Order Number:</span>
                    <strong className="order-ref-val">{order.orderNumber}</strong>
                  </div>

                  <div className="order-status-badge-wrap">
                    <span className={`status-pill ${order.status === "Completed" ? "completed" : order.status === "Pending Verification" ? "pending" : "verified"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Progress Tracker Stepper */}
                <div className="stepper-progress-wrap">
                  <div className="stepper-steps">
                    {[
                      { title: "Proof Submitted", icon: "🧾" },
                      { title: "Payment Verified", icon: "✅" },
                      { title: "Custom Printing", icon: "🎨" },
                      { title: isPickup ? "Ready for Pickup" : "Out for Delivery", icon: isPickup ? "🏬" : "🚚" },
                      { title: "Completed", icon: "🎉" }
                    ].map((step, idx) => {
                      const isCompleted = idx < stepIdx;
                      const isCurrent = idx === stepIdx;
                      return (
                        <div
                          key={idx}
                          className={`step-node ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                        >
                          <div className="step-circle">{step.icon}</div>
                          <span className="step-title">{step.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="tracked-details-grid">
                  <div className="details-col">
                    <h4 className="details-col-title">👤 Customer & Fulfillment</h4>
                    <p><strong>Name:</strong> {order.customerName}</p>
                    <p><strong>Phone:</strong> {order.customerPhone}</p>
                    <p><strong>Fulfillment:</strong> {order.deliveryType}</p>
                    {order.deliveryType === "Delivery" && (
                      <>
                        <p><strong>Distance:</strong> {order.distanceKm} km</p>
                        <p><strong>Address:</strong> {order.deliveryAddress}</p>
                      </>
                    )}
                  </div>

                  <div className="details-col">
                    <h4 className="details-col-title">✨ Customized Items ({order.items?.length})</h4>
                    <div className="tracked-items-list">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="tracked-item-box">
                          <div className="tracked-item-top">
                            <span>{item.quantity}x</span>
                            <strong>{item.name}</strong>
                          </div>
                          {item.customText && (
                            <p className="custom-print-text">
                              🔤 Print: <strong>"{item.customText}"</strong>
                            </p>
                          )}
                          {item.selectedStickers && item.selectedStickers.length > 0 && (
                            <p className="custom-stickers-text">
                              ✨ Stickers: {item.selectedStickers.map((s) => s.name).join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="details-col">
                    <h4 className="details-col-title">💳 Payment Summary</h4>
                    <p><strong>Method:</strong> {order.paymentMethod}</p>
                    <p><strong>Items Subtotal:</strong> {order.subtotal} {settings.currency}</p>
                    <p><strong>Delivery Fee:</strong> {order.deliveryFee} {settings.currency}</p>
                    <p className="total-highlight">
                      <strong>Total:</strong> {order.totalAmount} {settings.currency}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
