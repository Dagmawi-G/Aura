import React, { useEffect, useState } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const getDeliveryCountdown = (deliveryDate, isUrgent) => {
  if (!deliveryDate) {
    if (isUrgent) return { text: "Today (Urgent)", badgeText: "⚡ Today", status: "today", days: 0 };
    return { text: "ASAP", badgeText: "📅 ASAP", status: "normal", days: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = String(deliveryDate).split("T")[0].split("-");
  let target;
  if (parts.length === 3) {
    target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    target = new Date(deliveryDate);
    target.setHours(0, 0, 0, 0);
  }

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: overdueDays === 1 ? "Passed yesterday (1 day overdue)" : `Passed ${overdueDays} days ago (Overdue)`,
      shortText: overdueDays === 1 ? "1d Overdue" : `${overdueDays}d Overdue`,
      badgeText: overdueDays === 1 ? "⚠️ 1d Overdue" : `⚠️ ${overdueDays}d Overdue`,
      status: "overdue",
      days: diffDays,
      overdueDays,
    };
  } else if (diffDays === 0) {
    return {
      text: isUrgent ? "Today (Urgent Same-Day)" : "Today",
      shortText: "Today",
      badgeText: isUrgent ? "⚡ Today (Urgent)" : "⚡ Today",
      status: "today",
      days: 0,
    };
  } else if (diffDays === 1) {
    return {
      text: "Tomorrow (1 day left)",
      shortText: "Tomorrow",
      badgeText: "📅 Tomorrow",
      status: "soon",
      days: 1,
    };
  } else {
    return {
      text: `${diffDays} days left`,
      shortText: `${diffDays} days left`,
      badgeText: `📅 in ${diffDays} days`,
      status: "upcoming",
      days: diffDays,
    };
  }
};

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

  const filteredOrders = orders
    .filter((order) => {
      if (statusFilter === "All") return true;
      if (statusFilter === "⚡ Urgent Orders") return order.isUrgent === true;
      return order.status === statusFilter;
    })
    .sort((a, b) => {
      // Urgent orders always on top
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      // Then newest date first
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    });

  const getTotalMugs = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const urgentOrdersCount = orders.filter((o) => o.isUrgent).length;

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
        {["All", "⚡ Urgent Orders", "Pending Verification", "Payment Verified", "Processing / Printing", "Out for Delivery", "Ready for Pickup", "Completed"].map((status) => {
          let count = 0;
          if (status === "All") count = orders.length;
          else if (status === "⚡ Urgent Orders") count = urgentOrdersCount;
          else count = orders.filter((o) => o.status === status).length;

          return (
            <button
              key={status}
              className={`order-filter-pill ${statusFilter === status ? "active" : ""} ${status === "⚡ Urgent Orders" ? "urgent-pill" : ""}`}
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
            const countdown = getDeliveryCountdown(order.deliveryDate, order.isUrgent);

            return (
              <div
                key={order._id}
                className={`order-card-compact ${order.isUrgent ? "is-urgent-card" : ""}`}
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                {/* Top: Order # + Urgent Flag + Status Pill */}
                <div className="compact-card-top">
                  <div className="compact-id-group">
                    <span className="compact-order-num">{order.orderNumber || "ORDER"}</span>
                    {order.isUrgent && (
                      <span className="urgent-badge-compact">⚡ URGENT</span>
                    )}
                  </div>
                  <span className={`status-pill ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* 3 Core Fields: Name, Due Date, Amount of Mugs */}
                <div className="compact-card-content">
                  <div className="compact-info-box name-box">
                    <span className="compact-label">Customer</span>
                    <span className="compact-value name-text">👤 {order.customerName}</span>
                  </div>

                  <div className="compact-info-box due-box">
                    <span className="compact-label">Due Date</span>
                    <span className="compact-value due-text">
                      📅 {order.deliveryDate || "Today"}
                      <span className={`compact-due-pill ${countdown.status} ${order.isUrgent ? "urgent-due" : ""}`}>
                        {countdown.badgeText}
                      </span>
                    </span>
                  </div>

                  <div className="compact-info-box mugs-box">
                    <span className="compact-label">Amount of Mugs</span>
                    <span className="compact-value mugs-text">
                      ☕ {totalMugs} {totalMugs === 1 ? "Mug" : "Mugs"}
                    </span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="compact-card-bottom">
                  <span className="compact-hint-text">View order details</span>
                  <span className="compact-arrow">→</span>
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
