import webpush from "web-push";
import pushSubscriptionModel from "../models/pushSubscriptionModel.js";

// VAPID keys for Web Push Notifications
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BOlUVkJVvDqH_SpvPClqHMFT_poID9l7w7FCkHR5z5ZQRHDS764BSBa-ffgGIrFdn2QfwoUgPKx5BQ2pYMhknzI";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "RYfYTB1Ul4JlOeRgPnMC7hCGj8uJpd8bwyf2hFAAO4Y";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@auracollection.com";

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn("Could not initialize VAPID details:", e.message);
}

export const getVapidPublicKey = () => VAPID_PUBLIC_KEY;

export const savePushSubscription = async (subscription, adminName = "Admin") => {
  if (!subscription || !subscription.endpoint) {
    throw new Error("Invalid subscription object");
  }

  await pushSubscriptionModel.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: subscription.keys,
      adminName: adminName,
      createdAt: new Date()
    },
    { upsert: true, new: true }
  );

  return true;
};

export const notifyAdminsOfOrder = async (order) => {
  if (!order) return;

  const isUrgent = Boolean(order.isUrgent);
  const title = isUrgent ? "⚡ New Urgent Order" : "📦 New Order";
  const body = isUrgent
    ? `⚡ Urgent Order #${order.orderNumber} from ${order.customerName} (${order.totalAmount} ETB) - Same-Day Express!`
    : `📦 Order #${order.orderNumber} from ${order.customerName} (${order.totalAmount} ETB).`;

  const notifIcon = isUrgent ? "/order-urgent-icon.png" : "/order-normal-icon.png";

  const notificationPayload = JSON.stringify({
    title,
    body,
    icon: notifIcon,
    badge: notifIcon,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      isUrgent,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      url: order._id && order._id !== "test-id" ? `/#/orders/${order._id}` : "/#/orders"
    }
  });

  let allSubs = [];
  try {
    allSubs = await pushSubscriptionModel.find({});
  } catch (e) {
    console.warn("[Push Notification] Could not load subscriptions:", e.message);
    return;
  }

  if (allSubs.length === 0) {
    console.log(`[Push Notification] No registered admin subscriptions. Order #${order.orderNumber} logged.`);
    return;
  }

  console.log(`[Push Notification] Broadcasting order #${order.orderNumber} (Urgent: ${isUrgent}) to ${allSubs.length} device(s)...`);

  const promises = allSubs.map(async (sub) => {
    try {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: sub.keys
      };
      await webpush.sendNotification(pushConfig, notificationPayload);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription is expired or gone, clean up
        try {
          await pushSubscriptionModel.findOneAndDelete({ endpoint: sub.endpoint });
        } catch (delErr) {}
      } else {
        console.warn("[Push Notification] Failed to send push to", sub.endpoint, err.message);
      }
    }
  });

  await Promise.allSettled(promises);
};
