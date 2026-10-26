import React, { useEffect, useState, useRef } from "react";
import "./NotificationModal.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Utility: Convert base64 VAPID key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Synthesize pleasant chime or urgent alert sounds using Web Audio API
function playAlertSound(isUrgent = false) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (isUrgent) {
      // Urgent siren/double-pulse alert
      const playBeep = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playBeep(880, 0, 0.15);
      playBeep(1174.66, 0.18, 0.25);
      playBeep(880, 0.48, 0.15);
      playBeep(1174.66, 0.66, 0.35);
    } else {
      // Pleasant harmonic chime for standard order
      const playChime = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playChime(523.25, 0, 0.3); // C5
      playChime(659.25, 0.12, 0.3); // E5
      playChime(783.99, 0.24, 0.6); // G5
      playChime(1046.5, 0.38, 0.8); // C6
    }
  } catch (err) {
    console.warn("Audio play prevented:", err);
  }
}

const NotificationModal = ({ url }) => {
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState(null); // The order to pop up
  const [pushStatus, setPushStatus] = useState("default"); // 'default', 'granted', 'denied'
  const [isSubscribing, setIsSubscribing] = useState(false);
  const knownOrderIdsRef = useRef(new Set());
  const initialFetchDoneRef = useRef(false);

  // Check notification permission state on mount & register SW
  useEffect(() => {
    if ("Notification" in window) {
      setPushStatus(Notification.permission);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[Service Worker] Registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[Service Worker] Registration error:", err);
        });
    }
  }, []);

  // Poll orders every 6 seconds to trigger pop-up and sound in real-time
  useEffect(() => {
    let isMounted = true;

    const checkNewOrders = async () => {
      try {
        const res = await axios.get(`${url}/api/order/list`);
        if (res.data.success && isMounted) {
          const orders = res.data.data;

          if (!initialFetchDoneRef.current) {
            // First run: remember all existing order IDs so we don't alert old orders
            orders.forEach((o) => knownOrderIdsRef.current.add(o._id));
            initialFetchDoneRef.current = true;
            return;
          }

          // Check if any order is brand new
          const brandNewOrders = orders.filter((o) => !knownOrderIdsRef.current.has(o._id));

          if (brandNewOrders.length > 0) {
            // Add to known
            brandNewOrders.forEach((o) => knownOrderIdsRef.current.add(o._id));

            // Pick latest new order to pop up
            const latestNew = brandNewOrders[0];
            setActiveAlert(latestNew);

            // Play alert sound
            playAlertSound(latestNew.isUrgent);

            // Also trigger local browser notification if permitted
            if ("Notification" in window && Notification.permission === "granted") {
              const isUrgent = latestNew.isUrgent;
              const title = isUrgent ? "New Urgent Order" : "New Order";
              const body = isUrgent
                ? `⚡ Urgent Order #${latestNew.orderNumber} from ${latestNew.customerName} (${latestNew.totalAmount} ETB).`
                : `Order #${latestNew.orderNumber} from ${latestNew.customerName} (${latestNew.totalAmount} ETB).`;

              try {
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification(title, {
                      body,
                      icon: "/favicon.ico",
                      badge: "/favicon.ico",
                      vibrate: isUrgent ? [300, 100, 300, 100, 400] : [200, 100, 200],
                      data: { url: `/#/orders/${latestNew._id}` }
                    });
                  });
                } else {
                  const notif = new Notification(title, { body, icon: "/favicon.ico" });
                  notif.onclick = () => {
                    window.focus();
                    window.location.hash = `#/orders/${latestNew._id}`;
                  };
                }
              } catch (e) {
                console.warn("Notification error:", e);
              }
            }
          }
        }
      } catch (err) {
        // quiet poll fail
      }
    };

    checkNewOrders();
    const interval = setInterval(checkNewOrders, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [url]);

  // Handler to enable push notifications on mobile phone or PC
  const handleEnablePush = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support Web Push Notifications");
      return;
    }
    if (!("serviceWorker" in navigator)) {
      toast.error("Service Worker is not supported in this browser");
      return;
    }

    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission !== "granted") {
        toast.warn("Notification permission was not granted. Please enable in browser site settings.");
        setIsSubscribing(false);
        return;
      }

      // Fetch VAPID Public Key from backend
      const vapidRes = await axios.get(`${url}/api/order/vapid-key`);
      if (!vapidRes.data.success || !vapidRes.data.publicKey) {
        throw new Error("Could not retrieve VAPID Public Key");
      }
      const publicKey = vapidRes.data.publicKey;

      // Register or get service worker
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      // Send subscription to backend
      const subRes = await axios.post(`${url}/api/order/subscribe-push`, {
        subscription,
        adminName: "Admin Device"
      });

      if (subRes.data.success) {
        toast.success("🔔 Push Notifications Active! Your phone will alert on new orders.");
        // Play sample chime
        playAlertSound(false);
      } else {
        toast.error("Failed to register subscription with server");
      }
    } catch (err) {
      console.error("Push subscribe error:", err);
      toast.error("Failed to enable push: " + err.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestPush = async (isUrgent = false) => {
    try {
      toast.info(`Sending test ${isUrgent ? "urgent" : "standard"} notification...`);
      // Local immediate sound & pop-up
      playAlertSound(isUrgent);
      setActiveAlert({
        _id: "test",
        orderNumber: isUrgent ? "AUR-URG999" : "AUR-STD101",
        customerName: "Abebe Kebede (Test Buyer)",
        customerPhone: "0911223344",
        secondaryPhone: "0922334455",
        totalAmount: 1450,
        deliveryType: "Delivery",
        isUrgent: isUrgent,
        deliveryDate: isUrgent ? "⚡ Today (Same-Day Express)" : "2026-10-30"
      });

      // Dispatch to server backend push
      await axios.post(`${url}/api/order/test-push`, { isUrgent });
    } catch (err) {
      console.warn("Test push error:", err);
    }
  };

  const handleViewAlertOrder = () => {
    if (activeAlert) {
      const orderId = activeAlert._id;
      setActiveAlert(null);
      if (orderId && orderId !== "test") {
        navigate(`/orders/${orderId}`);
      } else {
        navigate("/orders");
      }
    }
  };

  return (
    <>
      {/* Push Notification Bar in Admin (shown when permission isn't granted yet) */}
      {pushStatus !== "granted" && (
        <div className="admin-push-prompt-banner">
          <div className="push-banner-content">
            <span className="push-banner-icon">🔔</span>
            <div className="push-banner-text">
              <strong>Enable Phone Push Notifications</strong>
              <span>Get instant popup alerts on your phone whenever a customer orders (including urgent orders)</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-enable-push"
            onClick={handleEnablePush}
            disabled={isSubscribing}
          >
            {isSubscribing ? "Enabling..." : "Enable Notifications 🔔"}
          </button>
        </div>
      )}

      {/* Floating Pop-Up Modal for New / Urgent Orders */}
      {activeAlert && (
        <div className="order-alert-modal-backdrop" onClick={() => setActiveAlert(null)}>
          <div
            className={`order-alert-modal-card ${activeAlert.isUrgent ? "urgent-card" : "standard-card"} fade-in`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-alert-header">
              <div className="order-alert-badge">
                {activeAlert.isUrgent ? "🚨 NEW URGENT ORDER" : "🛍️ NEW ORDER"}
              </div>
              <button
                type="button"
                className="order-alert-close-btn"
                onClick={() => setActiveAlert(null)}
              >
                ✕
              </button>
            </div>

            <div className="order-alert-body">
              {activeAlert.isUrgent && (
                <div className="urgent-banner-box">
                  <span className="urgent-pulse-bolt">⚡</span>
                  <div>
                    <strong>SAME-DAY EXPRESS URGENT ORDER</strong>
                    <p>Customer requested urgent production! Immediate seller call & fast-track priority recommended.</p>
                  </div>
                </div>
              )}

              <div className="alert-meta-grid">
                <div className="alert-meta-item">
                  <span className="meta-lbl">Order Number:</span>
                  <strong className="meta-val order-num">#{activeAlert.orderNumber}</strong>
                </div>

                <div className="alert-meta-item">
                  <span className="meta-lbl">Order Buyer's Name:</span>
                  <strong className="meta-val">{activeAlert.customerName}</strong>
                </div>

                <div className="alert-meta-item">
                  <span className="meta-lbl">Phone Number:</span>
                  <strong className="meta-val">{activeAlert.customerPhone}</strong>
                </div>

                {activeAlert.secondaryPhone && (
                  <div className="alert-meta-item">
                    <span className="meta-lbl">Alternative Phone:</span>
                    <strong className="meta-val">{activeAlert.secondaryPhone}</strong>
                  </div>
                )}

                <div className="alert-meta-item">
                  <span className="meta-lbl">Order Total:</span>
                  <strong className="meta-val highlight">{activeAlert.totalAmount} ETB</strong>
                </div>

                <div className="alert-meta-item">
                  <span className="meta-lbl">Fulfillment:</span>
                  <strong className="meta-val">{activeAlert.deliveryType || "Delivery"}</strong>
                </div>
              </div>
            </div>

            <div className="order-alert-actions">
              <button
                type="button"
                className={`btn-view-alert-order ${activeAlert.isUrgent ? "btn-urgent-view" : ""}`}
                onClick={handleViewAlertOrder}
              >
                {activeAlert.isUrgent ? "⚡ View Urgent Order Now →" : "View Order Details →"}
              </button>
              <button
                type="button"
                className="btn-dismiss-alert-order"
                onClick={() => setActiveAlert(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationModal;
