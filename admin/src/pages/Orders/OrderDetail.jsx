import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./OrderDetail.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const ORDER_STATUSES = [
  "Pending Verification",
  "Payment Verified",
  "Processing / Printing",
  "Out for Delivery",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
];

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

const OrderDetail = ({ url }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [currency, setCurrency] = useState("ETB");
  const [loading, setLoading] = useState(true);
  const [selectedProofImg, setSelectedProofImg] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const [orderRes, settingRes] = await Promise.all([
        axios.get(`${url}/api/order/list`),
        axios.get(`${url}/api/setting`),
      ]);
      if (orderRes.data.success) {
        const found = orderRes.data.data.find((o) => o._id === orderId);
        if (!found) {
          toast.error("Order not found");
          navigate("/orders");
          return;
        }
        setOrder(found);
      }
      if (settingRes.data.success && settingRes.data.data.currency) {
        setCurrency(settingRes.data.data.currency);
      }
    } catch (e) {
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: newStatus,
      });
      if (res.data.success) {
        toast.success(`Status updated to: ${newStatus}`);
        setOrder((prev) => ({ ...prev, status: newStatus }));
      } else {
        toast.error(res.data.message || "Failed to update status");
      }
    } catch (e) {
      toast.error("Error updating order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getMapUrl = (lat, lng) => {
    if (!lat || !lng || (lat === 0 && lng === 0)) return null;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) return null;

  const mapUrl = order.customerCoordinates
    ? getMapUrl(order.customerCoordinates.lat, order.customerCoordinates.lng)
    : null;

  const totalMugs = (order.items || []).reduce((s, i) => s + (i.quantity || 0), 0);

  return (
    <div className="order-detail-page fade-in">
      {/* Back button + Header */}
      <div className="detail-top-bar">
        <button className="btn-back" onClick={() => navigate("/orders")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Orders
        </button>
        <div className="detail-order-id-wrap">
          <span className="detail-order-num">{order.orderNumber}</span>
          <span className={`status-pill ${getStatusClass(order.status)}`}>{order.status}</span>
        </div>
        <span className="detail-date">
          {new Date(order.createdAt || order.date).toLocaleString("en-ET", {
            weekday: "short", year: "numeric", month: "short",
            day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </span>
      </div>

      <div className="detail-content-grid">
        {/* ───────── LEFT COLUMN ───────── */}
        <div className="detail-left">

          {/* Customer Card */}
          <div className="detail-card aura-card">
            <div className="detail-card-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Customer & Fulfillment
            </div>

            <div className="customer-info-block">
              <p className="cust-name">{order.customerName}</p>
              <p className="cust-phone">
                <a href={`tel:${order.customerPhone}`}>📞 {order.customerPhone}</a>
              </p>
              {order.customerEmail && (
                <p className="cust-email">✉️ {order.customerEmail}</p>
              )}
            </div>

            <div className="fulfillment-badge-wrap">
              <span className={`fulfillment-badge ${order.deliveryType === "Pickup" ? "pickup" : "delivery"}`}>
                {order.deliveryType === "Pickup" ? "🏬 Store Pickup" : "🚚 Door Delivery"}
              </span>
            </div>

            {order.deliveryType === "Delivery" ? (
              <div className="delivery-metrics-block">
                <div className="metric-row">
                  <span className="metric-label">Distance</span>
                  <span className="metric-val">{order.distanceKm ? `${order.distanceKm} km` : "N/A"}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Delivery Fee</span>
                  <span className="metric-val highlight-fee">{order.deliveryFee} {currency}</span>
                </div>
                {order.deliveryAddress && (
                  <div className="metric-row address-row">
                    <span className="metric-label">Address</span>
                    <span className="metric-val">{order.deliveryAddress}</span>
                  </div>
                )}
                {/* Google Maps link */}
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-map-link"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    View Customer Location on Google Maps
                  </a>
                ) : (
                  <p className="no-map-note">📍 No GPS coordinates stored for this order</p>
                )}
              </div>
            ) : (
              <p className="pickup-hint">Customer will pick up at store location.</p>
            )}

            {order.notes && (
              <div className="order-notes-box">
                <span className="notes-label">📝 Order Notes:</span>
                <p className="notes-text">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Payment Proof Card */}
          <div className="detail-card aura-card">
            <div className="detail-card-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              Payment Proof & Prepayment Verification
            </div>

            {/* Prominent Verification Callout Box */}
            <div className="proof-verification-box">
              <div className="proof-verify-badge-row">
                <span className="verify-badge-title">Expected Prepayment (ቀብድ):</span>
                <span className="verify-badge-amount">{order.prepaymentAmount || 0} {currency}</span>
              </div>
              <div className="proof-verify-details-grid">
                <div className="verify-grid-item">
                  <span className="v-label">Transfer Channel:</span>
                  <strong className="v-val">{order.paymentMethod || "Bank Transfer"}</strong>
                </div>
                {order.paymentAccount && (
                  <div className="verify-grid-item">
                    <span className="v-label">Aura Account:</span>
                    <strong className="v-val code-font">{order.paymentAccount}</strong>
                  </div>
                )}
                <div className="verify-grid-item">
                  <span className="v-label">Total Order Value:</span>
                  <strong className="v-val">{order.totalAmount || order.amount} {currency}</strong>
                </div>
                <div className="verify-grid-item">
                  <span className="v-label">Remaining on {order.deliveryType}:</span>
                  <strong className="v-val highlight-balance">
                    {Math.max(0, (order.totalAmount || order.amount || 0) - (order.prepaymentAmount || 0))} {currency}
                  </strong>
                </div>
              </div>
              <div className="proof-verify-instruction">
                🔎 <strong>Verify Receipt:</strong> Confirm the screenshot below proves an incoming transfer of at least <strong>{order.prepaymentAmount || 0} {currency}</strong>.
              </div>
            </div>

            {order.paymentProof ? (
              <div className="proof-thumbnail-wrap">
                <img
                  src={`${url}/images/${order.paymentProof}`}
                  alt="Transfer Proof Screenshot"
                  className="proof-thumbnail"
                  onClick={() => setSelectedProofImg(`${url}/images/${order.paymentProof}`)}
                />
                <button
                  type="button"
                  className="btn-view-proof"
                  onClick={() => setSelectedProofImg(`${url}/images/${order.paymentProof}`)}
                >
                  🔍 View Full Screenshot & Compare ({order.prepaymentAmount || 0} {currency})
                </button>
              </div>
            ) : (
              <div className="no-proof-box">
                <p>⚠️ No payment screenshot attached</p>
              </div>
            )}
          </div>
        </div>

        {/* ───────── RIGHT COLUMN ───────── */}
        <div className="detail-right">

          {/* Status Updater Card */}
          <div className="detail-card aura-card status-card">
            <div className="detail-card-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              Update Order Status
            </div>
            <div className="status-buttons-grid">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  className={`status-btn ${order.status === s ? "active" : ""} ${getStatusClass(s)}`}
                  onClick={() => order.status !== s && handleStatusChange(s)}
                  disabled={updatingStatus}
                >
                  {s}
                </button>
              ))}
            </div>
            {order.status === "Pending Verification" && (
              <button
                type="button"
                className="btn-verify-success"
                onClick={() => handleStatusChange("Payment Verified")}
                disabled={updatingStatus}
              >
                ✅ Confirm & Verify Payment
              </button>
            )}
          </div>

          {/* Items & Customizations Card */}
          <div className="detail-card aura-card">
            <div className="detail-card-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
              Ordered Items & Customizations
              <span className="item-count-badge">{totalMugs} mug{totalMugs !== 1 ? "s" : ""}</span>
            </div>

            <div className="ordered-items-list">
              {order.items && order.items.map((item, i) => (
                <div key={i} className="ordered-item-box">
                  <div className="item-row-top">
                    <span className="item-qty-badge">{item.quantity}x</span>
                    <strong className="item-name">{item.name}</strong>
                    <span className="item-price">{item.price * item.quantity} {currency}</span>
                  </div>

                  {item.customText ? (
                    <div className="custom-print-box">
                      <span className="custom-print-label">🔤 Custom Text:</span>
                      <span className="custom-print-val">"{item.customText}"</span>
                    </div>
                  ) : (
                    <div className="custom-print-box plain">
                      <span className="custom-print-label">No custom text</span>
                    </div>
                  )}

                  {item.selectedStickers && item.selectedStickers.length > 0 && (
                    <div className="item-stickers-box">
                      <span className="stickers-title">Stickers:</span>
                      <div className="sticker-chips-row">
                        {item.selectedStickers.map((st, sidx) => (
                          <span key={sidx} className="sticker-preview-chip">
                            {st.image && (
                              <img
                                src={`${url}/images/${st.image}`}
                                alt={st.name}
                                className="chip-sticker-icon"
                              />
                            )}
                            <span>{st.name || st}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="order-total-summary">
              <div className="summary-line">
                <span>Subtotal:</span>
                <span>{order.subtotal || order.amount} {currency}</span>
              </div>
              {order.deliveryType === "Delivery" && (
                <div className="summary-line">
                  <span>Delivery Charge:</span>
                  <span>{order.deliveryFee} {currency}</span>
                </div>
              )}
              <div className="summary-line total-line">
                <span>Total Amount:</span>
                <span>{order.totalAmount || order.amount} {currency}</span>
              </div>
              {order.prepaymentAmount > 0 && (
                <>
                  <div className="summary-line prepay-admin-row">
                    <span>✅ ቀብድ (Prepayment Received):</span>
                    <span className="prepay-admin-val">{order.prepaymentAmount} {currency}</span>
                  </div>
                  <div className="summary-line remaining-admin-row">
                    <span>💰 Remaining Balance (Collect on {order.deliveryType}):</span>
                    <span className="remaining-admin-val">
                      {Math.max(0, (order.totalAmount || 0) - order.prepaymentAmount)} {currency}
                    </span>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Lightbox for payment screenshot */}
      {selectedProofImg && ReactDOM.createPortal(
        <div className="modal-backdrop" onClick={() => setSelectedProofImg(null)}>
          <div className="proof-modal-card fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="proof-modal-header">
              <div className="proof-modal-title-wrap">
                <h3 className="modal-title">Payment Transfer Verification</h3>
                <span className="modal-verify-amount-tag">
                  Expected Prepayment: <strong>{order.prepaymentAmount || 0} {currency}</strong>
                </span>
              </div>
              <div className="proof-modal-actions">
                <a href={selectedProofImg} target="_blank" rel="noreferrer" className="btn-link-tab">
                  Open in New Tab ↗
                </a>
                <button className="modal-close-btn" onClick={() => setSelectedProofImg(null)}>✕</button>
              </div>
            </div>

            {/* Quick comparison bar above image */}
            <div className="proof-modal-verification-bar">
              <div className="modal-bar-stat">
                <span className="mb-label">ቀብድ to Verify:</span>
                <strong className="mb-val green">{order.prepaymentAmount || 0} {currency}</strong>
              </div>
              <div className="modal-bar-sep">|</div>
              <div className="modal-bar-stat">
                <span className="mb-label">Payment Channel:</span>
                <strong className="mb-val">{order.paymentMethod || "Bank Transfer"}</strong>
              </div>
              {order.paymentAccount && (
                <>
                  <div className="modal-bar-sep">|</div>
                  <div className="modal-bar-stat">
                    <span className="mb-label">Account:</span>
                    <strong className="mb-val code-font">{order.paymentAccount}</strong>
                  </div>
                </>
              )}
              <div className="modal-bar-sep">|</div>
              <div className="modal-bar-stat">
                <span className="mb-label">Order Total:</span>
                <strong className="mb-val">{order.totalAmount || order.amount} {currency}</strong>
              </div>
            </div>

            <div className="proof-modal-body">
              <img src={selectedProofImg} alt="Receipt Full Proof" className="proof-full-img" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default OrderDetail;
