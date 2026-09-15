import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

// Haversine formula to calculate accurate distance between two geographic coordinates in km
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Number(d.toFixed(2));
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Fetch driving route distance and road geometry from OSRM, with graceful fallback to Haversine
export async function getRouteDetails(storeLat, storeLng, destLat, destLng) {
  if (!storeLat || !storeLng || !destLat || !destLng) {
    return {
      success: false,
      distanceKm: 0,
      durationMin: 0,
      coordinates: [],
      isRoadRoute: false,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    // OSRM coordinates format: {lng},{lat}
    const url = `https://router.project-osrm.org/route/v1/driving/${storeLng},${storeLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = Number((route.distance / 1000).toFixed(2));
        const durationMin = Math.max(1, Math.round(route.duration / 60));
        // Leaflet expects [lat, lng], whereas GeoJSON is [lng, lat]
        const coordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
        return {
          success: true,
          distanceKm: distKm,
          durationMin,
          coordinates,
          isRoadRoute: true,
        };
      }
    }
  } catch (err) {
    console.warn("OSRM routing service unavailable or timed out, falling back to straight-line distance:", err);
  }

  // Fallback to Haversine straight-line distance
  const straightDist = getDistanceFromLatLonInKm(storeLat, storeLng, destLat, destLng);
  return {
    success: false,
    distanceKm: straightDist,
    durationMin: Math.max(1, Math.round((straightDist / 30) * 60)),
    coordinates: [
      [storeLat, storeLng],
      [destLat, destLng],
    ],
    isRoadRoute: false,
  };
}

const StoreContextProvider = (props) => {
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const [food_list, setFoodList] = useState([]);
  const [stickers_list, setStickersList] = useState([]);
  const [settings, setSettings] = useState({
    storeName: "Aura collection",
    storeAddress: "Bole Medhanialem, Addis Ababa, Ethiopia",
    storeCoordinates: { lat: 8.9956, lng: 38.7891 },
    deliveryRatePerKm: 25,
    deliveryTiers: { under10: 300, between10and20: 500, over20: 700 },
    prepaymentPerItem: 500,
    currency: "ETB",
    paymentMethods: []
  });

  // Guest cart items: array of customized items
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_guest_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Single delivery location for the entire cart/order
  const [cartDeliveryInfo, setCartDeliveryInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_cart_delivery_info");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Save cart to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("aura_guest_cart", JSON.stringify(cartItems));
      if (cartItems.length === 0) {
        setCartDeliveryInfo(null);
        localStorage.removeItem("aura_cart_delivery_info");
      }
    } catch (e) {}
  }, [cartItems]);

  // Persist cart delivery info
  useEffect(() => {
    try {
      if (cartDeliveryInfo) {
        localStorage.setItem("aura_cart_delivery_info", JSON.stringify(cartDeliveryInfo));
      } else {
        localStorage.removeItem("aura_cart_delivery_info");
      }
    } catch (e) {}
  }, [cartDeliveryInfo]);

  const fetchFoodList = async () => {
    try {
      const res = await axios.get(url + "/api/food/list");
      if (res.data.success) {
        setFoodList(res.data.data);
      }
    } catch (e) {
      console.error("Error loading products:", e);
    }
  };

  const fetchStickers = async () => {
    try {
      const res = await axios.get(url + "/api/sticker/list");
      if (res.data.success) {
        setStickersList(res.data.data);
      }
    } catch (e) {
      console.error("Error loading stickers:", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(url + "/api/setting");
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  };

  useEffect(() => {
    fetchFoodList();
    fetchStickers();
    fetchSettings();
  }, []);

  // Add customized item to cart (enforcing single delivery location per cart)
  const addCustomizedItemToCart = (itemPayload) => {
    const cartItemId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Determine the single delivery location to enforce for this cart
    let activeDelivery = cartDeliveryInfo;
    if (!activeDelivery || cartItems.length === 0) {
      activeDelivery = {
        deliveryType: itemPayload.deliveryType || "Delivery",
        customerCoordinates: itemPayload.customerCoordinates || null,
        customerLocation: itemPayload.customerLocation || "",
        distanceKm: itemPayload.distanceKm || 0,
        deliveryFee: itemPayload.deliveryFee || 0,
        routeCoordinates: itemPayload.routeCoordinates || null,
        routeDuration: itemPayload.routeDuration || null,
      };
      setCartDeliveryInfo(activeDelivery);
    }

    const newItem = {
      cartItemId,
      foodId: itemPayload.foodId,
      name: itemPayload.name,
      price: itemPayload.price,
      image: itemPayload.image,
      quantity: itemPayload.quantity || 1,
      customText: itemPayload.customText || "",
      selectedStickers: itemPayload.selectedStickers || [],
      // Inherit single shared delivery location for this cart
      deliveryType: activeDelivery.deliveryType,
      distanceKm: activeDelivery.distanceKm,
      deliveryFee: activeDelivery.deliveryFee,
      customerLocation: activeDelivery.customerLocation,
      customerCoordinates: activeDelivery.customerCoordinates,
      routeDuration: activeDelivery.routeDuration,
    };

    setCartItems((prev) => [...prev, newItem]);
    toast.success("Customized item added to your cart!");
    return newItem;
  };

  // Remove item from cart
  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => {
      const remaining = prev.filter((item) => item.cartItemId !== cartItemId);
      if (remaining.length === 0) {
        setCartDeliveryInfo(null);
        localStorage.removeItem("aura_cart_delivery_info");
      }
      return remaining;
    });
    toast.info("Item removed from cart");
  };

  // Update quantity
  const updateCartQuantity = (cartItemId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCartDeliveryInfo(null);
    localStorage.removeItem("aura_guest_cart");
    localStorage.removeItem("aura_cart_delivery_info");
  };

  // Start fresh order for a new location individually
  const clearCartAndSetLocation = (newDeliveryInfo) => {
    setCartItems([]);
    setCartDeliveryInfo(newDeliveryInfo);
    localStorage.removeItem("aura_guest_cart");
    if (newDeliveryInfo) {
      localStorage.setItem("aura_cart_delivery_info", JSON.stringify(newDeliveryInfo));
    }
  };

  // Total amount calculations
  const getCartSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  // Delivery fee is applied once to the entire cart
  const getCartDeliveryFee = () => {
    if (cartItems.length === 0) return 0;
    if (cartDeliveryInfo?.deliveryType === "Pickup") return 0;
    return cartDeliveryInfo?.deliveryFee || 0;
  };

  const getTotalCartAmount = () => {
    return getCartSubtotal() + getCartDeliveryFee();
  };

  const getTotalItemCount = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  // Calculate distance in km from store coordinates
  const calculateDistanceToStore = (customerLat, customerLng) => {
    if (!settings.storeCoordinates?.lat || !settings.storeCoordinates?.lng) {
      return 0;
    }
    return getDistanceFromLatLonInKm(
      settings.storeCoordinates.lat,
      settings.storeCoordinates.lng,
      customerLat,
      customerLng
    );
  };

  // Calculate fee from distance using tiered pricing
  const computeDeliveryFee = (distKm) => {
    if (distKm <= 0) return 0;
    const tiers = settings.deliveryTiers || { under10: 300, between10and20: 500, over20: 700 };
    if (distKm < 10) return tiers.under10 || 300;
    if (distKm <= 20) return tiers.between10and20 || 500;
    return tiers.over20 || 700;
  };

  // Calculate total prepayment (ቀብድ) based on quantity
  const computePrepayment = (totalQuantity) => {
    const perItem = settings.prepaymentPerItem ?? 500;
    return perItem * totalQuantity;
  };

  // Calculate road route details (or fallback to straight-line) from store coordinates
  const calculateRouteToStore = async (customerLat, customerLng) => {
    const storeLat = settings.storeCoordinates?.lat || 8.9956;
    const storeLng = settings.storeCoordinates?.lng || 38.7891;
    return await getRouteDetails(storeLat, storeLng, customerLat, customerLng);
  };

  const contextValue = {
    url,
    food_list,
    stickers_list,
    settings,
    cartItems,
    cartDeliveryInfo,
    setCartDeliveryInfo,
    clearCartAndSetLocation,
    addCustomizedItemToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartSubtotal,
    getCartDeliveryFee,
    getTotalCartAmount,
    getTotalItemCount,
    calculateDistanceToStore,
    calculateRouteToStore,
    getRouteDetails,
    computeDeliveryFee,
    computePrepayment,
    fetchFoodList,
    fetchSettings,
    fetchStickers
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
