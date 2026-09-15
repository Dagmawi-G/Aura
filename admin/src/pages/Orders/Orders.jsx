import React, { useEffect, useState } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Orders = ({ url }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${url}/api/order/list`);
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (e) {
      toast.error("Failed to load live orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 12000);
    return () => clearInterval(interval);
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending Verification": return "pending";
      case "Payment Verified": return "verified";
      case "Processing / Printing": return "processing";
      case "Out for Delivery":
      case "Ready for Pickup": return "delivery";
      case "Completed": return "completed";
      case "Cancelled": return "cancelled";
      default: return "pending";
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "All") return true;
    return order.status === statusFilter;
  });

  const getTotalMugs = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  return (
    <div className="orders-page fade-in">
      <div className="orders-header">
        <div>
          <h1 className="page-heading">Live Customer Orders</h1>
          <p className="page-subheading">
            Click any order card to view full details, verify payment, and update status
          </p>
        </div>
        <button className="btn-refresh" onClick={fetchOrders}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="orders-filter-bar aura-card">
        {["All", "Pending Verification", "Payment Verified", "Processing / Printing", "Out for Delivery", "Ready for Pickup", "Completed"].map((status) => {
          const count = status === "All" ? orders.length : orders.filter((o) => o.status === status).length;
          return (
            <button
              key={status}
              className={`order-filter-pill ${statusFilter === status ? "active" : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              <span>{status}</span>
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {loading && orders.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading live customer orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-orders-card aura-card">
          <div className="empty-icon">📦</div>
          <h3>No Orders in this view</h3>
          <p>Customer orders submitted from the client portal will appear here in real time.</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => {
            const totalMugs = getTotalMugs(order.items);
            return (
              <div
                key={order._id}
                className="order-card-compact"
                onClick={() => navigate(`/orders/${order._id}`)}
                title="Click to view full order details"
              >
                {/* Left: Main identity */}
                <div className="compact-main">
                  <div className="compact-order-num">{order.orderNumber || "ORDER"}</div>
                  <div className="compact-name">{order.customerName}</div>
                  <div className="compact-phone">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8a16 16 0 0 0 8 8l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {order.customerPhone}
                  </div>
                </div>

                {/* Center: Fulfillment + item count */}
                <div className="compact-meta">
                  <span className={`fulfillment-badge ${order.deliveryType === "Pickup" ? "pickup" : "delivery"}`}>
                    {order.deliveryType === "Pickup" ? "🏬 Pickup" : "🚚 Delivery"}
                  </span>
                  <div className="compact-items-count">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <span>{totalMugs} mug{totalMugs !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Financial overview */}
                <div className="compact-financials">
                  <span className="compact-prepay-badge">
                    ቀብድ: <strong>{order.prepaymentAmount || 0} ETB</strong>
                  </span>
                  <span className="compact-total-sub">
                    Total: {order.totalAmount || order.amount} ETB
                  </span>
                </div>

                {/* Right: Status + date + arrow */}
                <div className="compact-status-side">
                  <span className={`status-pill ${getStatusClass(order.status)}`}>{order.status}</span>
                  <span className="compact-date">
                    {new Date(order.createdAt || order.date).toLocaleString("en-ET", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>

                {/* Click arrow indicator */}
                <div className="compact-arrow">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
