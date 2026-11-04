import React, { useState, useEffect } from "react";
import "./Analytics.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Analytics = ({ url }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [currency, setCurrency] = useState("ETB");
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all"); // 'all' | 'today' | 'week' | 'month'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, settingRes] = await Promise.all([
        axios.get(`${url}/api/order/list`),
        axios.get(`${url}/api/setting`).catch(() => null)
      ]);

      if (orderRes.data.success) {
        setOrders(orderRes.data.data || []);
      }
      if (settingRes?.data?.success && settingRes.data.data?.currency) {
        setCurrency(settingRes.data.data.currency);
      }
    } catch (err) {
      toast.error("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  // Filter orders by timeframe
  const filteredOrders = orders.filter((order) => {
    if (timeframe === "all") return true;
    const orderDate = new Date(order.createdAt || order.date);
    const now = new Date();

    if (timeframe === "today") {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getDate() === now.getDate()
      );
    }

    if (timeframe === "week") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= sevenDaysAgo;
    }

    if (timeframe === "month") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= thirtyDaysAgo;
    }

    return true;
  });

  // Valid orders (excluding cancelled for revenue calculations)
  const nonCancelledOrders = filteredOrders.filter((o) => o.status !== "Cancelled");
  const completedOrders = filteredOrders.filter((o) => o.status === "Completed");
  const pendingVerificationOrders = filteredOrders.filter((o) => o.status === "Pending Verification");

  // 1. Total Sold Items (Mugs & Merchandise)
  const totalSoldItems = nonCancelledOrders.reduce((acc, order) => {
    const itemsCount = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    return acc + itemsCount;
  }, 0);

  const completedSoldItems = completedOrders.reduce((acc, order) => {
    const itemsCount = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    return acc + itemsCount;
  }, 0);

  // 2. Total Orders
  const totalOrders = filteredOrders.length;
  const activeOrdersCount = nonCancelledOrders.filter((o) => o.status !== "Completed").length;

  // 3. Total Revenue & Balance Breakdown
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.amount) || 0), 0);
  const totalPrepaymentsCollected = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.prepaymentAmount) || 0), 0);
  const totalRemainingToCollect = nonCancelledOrders.reduce((sum, o) => {
    const total = Number(o.totalAmount || o.amount) || 0;
    const prepay = Number(o.prepaymentAmount) || 0;
    return sum + Math.max(0, total - prepay);
  }, 0);

  // 4. Average Order Value
  const averageOrderValue = nonCancelledOrders.length > 0
    ? Math.round(totalRevenue / nonCancelledOrders.length)
    : 0;

  // 5. Urgent Same-Day Orders
  const urgentOrders = nonCancelledOrders.filter((o) => o.isUrgent);
  const urgentFeeRevenue = urgentOrders.reduce((sum, o) => sum + (Number(o.urgentFee) || 100), 0);

  // 6. Fulfillment breakdown
  const deliveryOrders = nonCancelledOrders.filter((o) => o.deliveryType === "Delivery");
  const pickupOrders = nonCancelledOrders.filter((o) => o.deliveryType === "Pickup");
  const totalDeliveryFees = deliveryOrders.reduce((sum, o) => sum + (Number(o.deliveryFee) || 0), 0);

  // 7. Payment Methods Breakdown
  const paymentMethodStats = {};
  nonCancelledOrders.forEach((order) => {
    const method = order.paymentMethod || "Bank / Mobile Transfer";
    if (!paymentMethodStats[method]) {
      paymentMethodStats[method] = { count: 0, revenue: 0 };
    }
    paymentMethodStats[method].count += 1;
    paymentMethodStats[method].revenue += Number(order.totalAmount || order.amount) || 0;
  });

  const paymentMethodsList = Object.entries(paymentMethodStats).sort((a, b) => b[1].revenue - a[1].revenue);

  // 8. Top Selling Products
  const productStats = {};
  nonCancelledOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const name = item.name || "Custom Mug";
      if (!productStats[name]) {
        productStats[name] = { count: 0, revenue: 0, image: item.image || "" };
      }
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      productStats[name].count += qty;
      productStats[name].revenue += price * qty;
      if (!productStats[name].image && item.image) {
        productStats[name].image = item.image;
      }
    });
  });

  const topProducts = Object.entries(productStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  // 9. Sticker Trends
  const stickerStats = {};
  let totalStickersApplied = 0;
  nonCancelledOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      if (item.selectedStickers && Array.isArray(item.selectedStickers)) {
        item.selectedStickers.forEach((st) => {
          const stName = st.name || "Custom Sticker";
          if (!stickerStats[stName]) {
            stickerStats[stName] = { count: 0, image: st.image || "" };
          }
          stickerStats[stName].count += 1;
          totalStickersApplied += 1;
        });
      }
    });
  });

  const topStickers = Object.entries(stickerStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 10. Order Status Distribution (Official 3 statuses: Payment Verified, Completed, Cancelled)
  const statusCounts = {
    "Payment Verified": 0,
    "Completed": 0,
    "Cancelled": 0
  };

  filteredOrders.forEach((order) => {
    if (order.status === "Completed") {
      statusCounts["Completed"] += 1;
    } else if (order.status === "Cancelled") {
      statusCounts["Cancelled"] += 1;
    } else {
      statusCounts["Payment Verified"] += 1;
    }
  });

  // 11. Custom Text Usage
  const customTextCount = nonCancelledOrders.reduce((sum, order) => {
    const hasCustomText = (order.items || []).some((item) => item.customText && item.customText.trim());
    return sum + (hasCustomText ? 1 : 0);
  }, 0);

  return (
    <div className="analytics-page fade-in">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <div className="analytics-title-row">
            <h1 className="page-heading">Business Analytics</h1>
            <span className="live-pulse-badge">
              <span className="pulse-dot"></span> Live Data
            </span>
          </div>
          <p className="page-subheading">
            Track your sold items, revenue, customer orders, and product popularity in real-time
          </p>
        </div>

        <div className="analytics-controls">
          {/* Timeframe Filter Pills */}
          <div className="timeframe-selector aura-card">
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "week", label: "Last 7 Days" },
              { id: "month", label: "This Month" }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`timeframe-pill ${timeframe === t.id ? "active" : ""}`}
                onClick={() => setTimeframe(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button type="button" className="btn-refresh-analytics" onClick={fetchData} title="Refresh data">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Calculating live store analytics...</p>
        </div>
      ) : (
        <>
          {/* 4 Core Primary Metric Cards */}
          <div className="primary-metrics-grid">
            {/* 1. Total Sold Items */}
            <div className="metric-card aura-card primary-card sold-card">
              <div className="card-top-row">
                <span className="card-label">Total Sold Items</span>
                <span className="card-icon-badge items-badge">☕</span>
              </div>
              <div className="card-val-row">
                <strong className="card-number-val">{totalSoldItems}</strong>
                <span className="card-unit">Units</span>
              </div>
              <div className="card-sub-info">
                <span>✓ <strong>{completedSoldItems}</strong> Delivered</span>
                <span className="bullet-sep">•</span>
                <span>⏳ <strong>{totalSoldItems - completedSoldItems}</strong> In Production</span>
              </div>
            </div>

            {/* 2. Total Orders */}
            <div className="metric-card aura-card primary-card orders-card">
              <div className="card-top-row">
                <span className="card-label">Total Orders</span>
                <span className="card-icon-badge orders-badge">📋</span>
              </div>
              <div className="card-val-row">
                <strong className="card-number-val">{totalOrders}</strong>
                <span className="card-unit">Orders</span>
              </div>
              <div className="card-sub-info">
                <span>🔥 <strong>{activeOrdersCount}</strong> Active / Live</span>
                <span className="bullet-sep">•</span>
                <span>✅ <strong>{completedOrders.length}</strong> Completed</span>
              </div>
            </div>

            {/* 3. Total Revenue */}
            <div className="metric-card aura-card primary-card revenue-card">
              <div className="card-top-row">
                <span className="card-label">Total Revenue</span>
                <span className="card-icon-badge revenue-badge">💰</span>
              </div>
              <div className="card-val-row">
                <strong className="card-number-val">{totalRevenue.toLocaleString()}</strong>
                <span className="card-unit">{currency}</span>
              </div>
              <div className="card-sub-info">
                <span>ቀብድ: <strong>{totalPrepaymentsCollected.toLocaleString()} {currency}</strong></span>
                <span className="bullet-sep">•</span>
                <span>Due on delivery: <strong>{totalRemainingToCollect.toLocaleString()} {currency}</strong></span>
              </div>
            </div>

            {/* 4. Average Order Value */}
            <div className="metric-card aura-card primary-card aov-card">
              <div className="card-top-row">
                <span className="card-label">Avg Order Value (AOV)</span>
                <span className="card-icon-badge aov-badge">📈</span>
              </div>
              <div className="card-val-row">
                <strong className="card-number-val">{averageOrderValue.toLocaleString()}</strong>
                <span className="card-unit">{currency} / order</span>
              </div>
              <div className="card-sub-info">
                <span>Avg: <strong>{(totalSoldItems / Math.max(1, nonCancelledOrders.length)).toFixed(1)}</strong> items / order</span>
              </div>
            </div>
          </div>

          {/* Secondary 4 Metrics Row */}
          <div className="secondary-metrics-grid">
            {/* Urgent Orders */}
            <div className="sec-card aura-card">
              <div className="sec-card-header">
                <span className="sec-icon">⚡</span>
                <span className="sec-title">Urgent Same-Day Orders</span>
              </div>
              <div className="sec-val">{urgentOrders.length}</div>
              <div className="sec-sub">
                +{urgentFeeRevenue.toLocaleString()} {currency} rush surcharges generated
              </div>
            </div>

            {/* Fulfillment Split */}
            <div className="sec-card aura-card">
              <div className="sec-card-header">
                <span className="sec-icon">🚚</span>
                <span className="sec-title">Door Delivery vs Pickup</span>
              </div>
              <div className="sec-val">
                {deliveryOrders.length} <span className="sec-val-sub">Delivery</span> / {pickupOrders.length} <span className="sec-val-sub">Pickup</span>
              </div>
              <div className="sec-sub">
                {totalDeliveryFees.toLocaleString()} {currency} total delivery fees
              </div>
            </div>

            {/* Stickers Applied */}
            <div className="sec-card aura-card">
              <div className="sec-card-header">
                <span className="sec-icon">✨</span>
                <span className="sec-title">Stickers Applied</span>
              </div>
              <div className="sec-val">{totalStickersApplied}</div>
              <div className="sec-sub">
                Across {Object.keys(stickerStats).length} unique sticker designs
              </div>
            </div>
          </div>

          {/* Two Columns: Order Pipeline & Payment Breakdown */}
          <div className="analytics-two-col">
            {/* Order Status Funnel */}
            <div className="analytics-card aura-card">
              <div className="card-section-header">
                <h3 className="section-title">📊 Order Status Pipeline</h3>
                <span className="section-badge">{filteredOrders.length} Orders</span>
              </div>

              <div className="status-funnel-list">
                {[
                  { key: "Payment Verified", label: "Payment Verified", color: "#10b981", icon: "💳" },
                  { key: "Completed", label: "Completed Orders", color: "#047857", icon: "✅" },
                  { key: "Cancelled", label: "Cancelled Orders", color: "#ef4444", icon: "❌" }
                ].map((st) => {
                  const count = statusCounts[st.key] || 0;
                  const pct = filteredOrders.length > 0 ? Math.round((count / filteredOrders.length) * 100) : 0;

                  return (
                    <div key={st.key} className="status-funnel-item">
                      <div className="status-funnel-top">
                        <span className="status-funnel-label">
                          <span className="status-funnel-icon">{st.icon}</span>
                          <strong>{st.label}</strong>
                        </span>
                        <div className="status-funnel-counts">
                          <strong className="status-num">{count}</strong>
                          <span className="status-pct">({pct}%)</span>
                        </div>
                      </div>
                      <div className="status-progress-track">
                        <div
                          className="status-progress-fill"
                          style={{
                            width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                            backgroundColor: st.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Providers Breakdown */}
            <div className="analytics-card aura-card">
              <div className="card-section-header">
                <h3 className="section-title">💳 Payment Method Distribution</h3>
                <span className="section-badge">{totalRevenue.toLocaleString()} {currency}</span>
              </div>

              {paymentMethodsList.length === 0 ? (
                <div className="empty-sub-state">No payment data for this timeframe.</div>
              ) : (
                <div className="payment-method-list">
                  {paymentMethodsList.map(([method, data]) => {
                    const pct = totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0;
                    return (
                      <div key={method} className="payment-method-item">
                        <div className="pm-top-row">
                          <div className="pm-name-col">
                            <span className="pm-bullet"></span>
                            <strong className="pm-name">{method}</strong>
                          </div>
                          <div className="pm-revenue-col">
                            <strong>{data.revenue.toLocaleString()} {currency}</strong>
                            <span className="pm-count-sub">({data.count} orders • {pct}%)</span>
                          </div>
                        </div>
                        <div className="pm-progress-track">
                          <div
                            className="pm-progress-fill"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Two Columns: Top Selling Products & Top Selected Stickers */}
          <div className="analytics-two-col">
            {/* Top Products */}
            <div className="analytics-card aura-card">
              <div className="card-section-header">
                <h3 className="section-title">🏆 Top Selling Merchandise</h3>
                <span className="section-badge">{topProducts.length} Items</span>
              </div>

              {topProducts.length === 0 ? (
                <div className="empty-sub-state">No products sold in this timeframe.</div>
              ) : (
                <div className="top-products-list">
                  {topProducts.slice(0, 5).map((prod, idx) => {
                    const pct = totalSoldItems > 0 ? Math.round((prod.count / totalSoldItems) * 100) : 0;
                    return (
                      <div key={idx} className="top-product-row">
                        <div className="rank-badge">#{idx + 1}</div>
                        {prod.image ? (
                          <img src={`${url}/images/${prod.image}`} alt={prod.name} className="prod-thumb" />
                        ) : (
                          <div className="prod-thumb-placeholder">☕</div>
                        )}
                        <div className="prod-info-col">
                          <strong className="prod-name">{prod.name}</strong>
                          <span className="prod-stats-sub">
                            {prod.count} units sold • {prod.revenue.toLocaleString()} {currency}
                          </span>
                        </div>
                        <div className="prod-share-badge">{pct}% of sales</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Stickers */}
            <div className="analytics-card aura-card">
              <div className="card-section-header">
                <h3 className="section-title">✨ Popular Stickers & Designs</h3>
                <span className="section-badge">{totalStickersApplied} Attached</span>
              </div>

              {topStickers.length === 0 ? (
                <div className="empty-sub-state">No stickers chosen in this timeframe.</div>
              ) : (
                <div className="stickers-popularity-grid">
                  {topStickers.map((st, idx) => (
                    <div key={idx} className="sticker-rank-card">
                      <div className="sticker-rank-num">#{idx + 1}</div>
                      {st.image ? (
                        <img src={`${url}/images/${st.image}`} alt={st.name} className="sticker-thumb" />
                      ) : (
                        <span className="sticker-thumb-emoji">🎨</span>
                      )}
                      <strong className="sticker-name text-truncate">{st.name}</strong>
                      <span className="sticker-count-tag">{st.count} orders</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="analytics-card aura-card recent-orders-card">
            <div className="card-section-header">
              <div>
                <h3 className="section-title">📑 Recent Orders Snapshot</h3>
                <p className="section-sub">Latest customer orders submitted from the client web app</p>
              </div>
              <button
                type="button"
                className="btn-view-all-orders"
                onClick={() => navigate("/orders")}
              >
                Go to Live Orders →
              </button>
            </div>

            <div className="recent-orders-table-wrapper">
              <table className="recent-orders-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Buyer</th>
                    <th>Date</th>
                    <th>Fulfillment</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.slice(0, 8).map((order) => {
                    const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
                    return (
                      <tr key={order._id} className={order.isUrgent ? "urgent-row" : ""}>
                        <td>
                          <div className="order-num-cell">
                            <strong>{order.orderNumber}</strong>
                            {order.isUrgent && <span className="urgent-badge-mini">⚡ URGENT</span>}
                          </div>
                        </td>
                        <td>
                          <span className="buyer-name">{order.customerName}</span>
                          <span className="buyer-phone">{order.customerPhone}</span>
                        </td>
                        <td>{order.deliveryDate || String(order.createdAt || "").split("T")[0] || "Today"}</td>
                        <td>
                          <span className={`fulfill-tag ${order.deliveryType === "Pickup" ? "pickup" : "delivery"}`}>
                            {order.deliveryType === "Pickup" ? "🏬 Pickup" : "🚚 Delivery"}
                          </span>
                        </td>
                        <td>{totalQty} {totalQty === 1 ? "mug" : "mugs"}</td>
                        <td><strong>{order.totalAmount || order.amount} {currency}</strong></td>
                        <td>
                          <span className={`status-pill-mini ${order.status.toLowerCase().replace(/[^a-z]/g, "")}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => navigate(`/orders/${order._id}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;

