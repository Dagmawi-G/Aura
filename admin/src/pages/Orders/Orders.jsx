import React, { useEffect, useState } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DeliveryRouteModal from "../../components/DeliveryRouteModal/DeliveryRouteModal";

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
  const [activeRouteOrder, setActiveRouteOrder] = useState(null);

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

  // Filter categories: All, Urgent Orders, Normal Orders, Completed Orders, Cancelled Orders
  const filterTabs = [
    { key: "All", label: "All" },
    { key: "Urgent", label: "⚡ Urgent Orders", isUrgentTab: true },
    { key: "Normal", label: "Normal Orders" },
    { key: "Completed", label: "Completed Orders" },
    { key: "Cancelled", label: "Cancelled Orders" }
  ];

  // Priority ranking:
  // 1. Urgent (active)
  // 2. Normal (active)
  // 3. Completed
  // 4. Cancelled
  const getOrderRank = (order) => {
    if (order.status === "Cancelled") return 4;
    if (order.status === "Completed") return 3;
    if (order.isUrgent) return 1;
    return 2;
  };

  const urgentOrdersCount = orders.filter((o) => o.isUrgent && o.status !== "Completed" && o.status !== "Cancelled").length;
  const normalOrdersCount = orders.filter((o) => !o.isUrgent && o.status !== "Completed" && o.status !== "Cancelled").length;
  const completedOrdersCount = orders.filter((o) => o.status === "Completed").length;
  const cancelledOrdersCount = orders.filter((o) => o.status === "Cancelled").length;

  const getTabCount = (key) => {
    switch (key) {
      case "All": return orders.length;
      case "Urgent": return urgentOrdersCount;
      case "Normal": return normalOrdersCount;
      case "Completed": return completedOrdersCount;
      case "Cancelled": return cancelledOrdersCount;
      default: return 0;
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      if (statusFilter === "All") return true;
      if (statusFilter === "Urgent") return order.isUrgent === true && order.status !== "Completed" && order.status !== "Cancelled";
      if (statusFilter === "Normal") return !order.isUrgent && order.status !== "Completed" && order.status !== "Cancelled";
      if (statusFilter === "Completed") return order.status === "Completed";
      if (statusFilter === "Cancelled") return order.status === "Cancelled";
      return true;
    })
    .sort((a, b) => {
      // Order sequence: Urgent, Normal, Completed, Cancelled
      const rankA = getOrderRank(a);
      const rankB = getOrderRank(b);
      if (rankA !== rankB) return rankA - rankB;
      // Within each rank, newest order first
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
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
        {filterTabs.map((tab) => {
          const count = getTabCount(tab.key);
          return (
            <button
              key={tab.key}
              className={`order-filter-pill ${statusFilter === tab.key ? "active" : ""} ${tab.isUrgentTab ? "urgent-pill" : ""}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              <span>{tab.label}</span>
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
            const countdown = getDeliveryCountdown(order.deliveryDate, order.isUrgent);
            const isCompleted = order.status === "Completed";
            const isCancelled = order.status === "Cancelled";
            const showUrgent = !isCompleted && !isCancelled && order.isUrgent;

            return (
              <div
                key={order._id}
                className={`order-card-compact ${isCompleted ? "is-completed-card" : isCancelled ? "is-cancelled-card" : showUrgent ? "is-urgent-card" : ""}`}
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                {/* Top: Order # + Urgent Flag + Status Pill */}
                <div className="compact-card-top">
                  <div className="compact-id-group">
                    <span className="compact-order-num">{order.orderNumber || "ORDER"}</span>
                    {showUrgent && (
                      <span className="urgent-badge-compact">⚡ URGENT</span>
                    )}
                  </div>
                  <span className={`status-pill ${getStatusClass(order.status)}`}>
                    {isCompleted ? "Completed" : order.status}
                  </span>
                </div>

                {/* 3 Core Fields: Name, Due Date, Amount of Mugs */}
                <div className="compact-card-content">
                  <div className="compact-info-box name-box">
                    <span className="compact-label">Order Buyer</span>
                    <span className="compact-value name-text">👤 {order.customerName}</span>
                    <span className="compact-phone-text" style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", display: "block" }}>
                      📞 {order.customerPhone}
                      {order.secondaryPhone && ` (Alt: ${order.secondaryPhone})`}
                    </span>
                  </div>

                  <div className="compact-info-box due-box">
                    <span className="compact-label">Due Date</span>
                    {isCompleted ? (
                      <span className="compact-value due-text">
                        📅 {order.deliveryDate || "Completed"}
                        <span className="compact-due-pill completed">
                          ✓ Completed
                        </span>
                      </span>
                    ) : isCancelled ? (
                      <span className="compact-value due-text">
                        📅 {order.deliveryDate || "—"}
                        <span className="compact-due-pill cancelled">
                          ✕ Cancelled
                        </span>
                      </span>
                    ) : (
                      <span className="compact-value due-text">
                        📅 {order.deliveryDate || "Today"}
                        <span className={`compact-due-pill ${countdown.status} ${showUrgent ? "urgent-due" : ""}`}>
                          {countdown.badgeText}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pop-up Interactive Delivery Route Map Modal */}
      {activeRouteOrder && (
        <DeliveryRouteModal
          order={activeRouteOrder}
          isOpen={Boolean(activeRouteOrder)}
          onClose={() => setActiveRouteOrder(null)}
          url={url}
        />
      )}
    </div>
  );
};

export default Orders;
