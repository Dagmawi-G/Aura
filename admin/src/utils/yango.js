// Yango navigation & app deep linking utility

/**
 * Detect client platform
 */
export function getClientPlatform() {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  return {
    isAndroid,
    isIOS,
    isMobile: isAndroid || isIOS,
  };
}

/**
 * Build deep link query parameters
 */
function buildQueryString({ startCoords, endCoords, address }) {
  const params = [];

  if (startCoords && typeof startCoords.lat === "number" && typeof startCoords.lng === "number") {
    params.push(`start-lat=${startCoords.lat}`);
    params.push(`start-lon=${startCoords.lng}`);
  }

  if (endCoords && typeof endCoords.lat === "number" && typeof endCoords.lng === "number") {
    params.push(`end-lat=${endCoords.lat}`);
    params.push(`end-lon=${endCoords.lng}`);
  }

  if (address) {
    params.push(`text=${encodeURIComponent(address)}`);
  }

  return params.length > 0 ? `?${params.join("&")}` : "";
}

/**
 * Generate platform-optimized direct Yango URL
 */
export function getYangoUrl({ startCoords, endCoords, address } = {}) {
  const { isAndroid, isIOS } = getClientPlatform();
  const query = buildQueryString({ startCoords, endCoords, address });

  if (isAndroid) {
    // Android Intent URL: launches native Yango app directly (package com.yandex.yango)
    // with automatic Google Play Store fallback if app is not installed
    const playStoreFallback = encodeURIComponent(
      "https://play.google.com/store/apps/details?id=com.yandex.yango"
    );
    return `intent://route${query}#Intent;scheme=yango;package=com.yandex.yango;S.browser_fallback_url=${playStoreFallback};end`;
  }

  if (isIOS) {
    // iOS native app scheme
    return `yango://route${query}`;
  }

  // Desktop / Web fallback
  if (startCoords?.lng && startCoords?.lat && endCoords?.lng && endCoords?.lat) {
    return `https://yango.com/en_int/order/?gfrom=${startCoords.lng}%2C${startCoords.lat}&gto=${endCoords.lng}%2C${endCoords.lat}`;
  }
  if (endCoords?.lng && endCoords?.lat) {
    return `https://yango.com/en_int/order/?gto=${endCoords.lng}%2C${endCoords.lat}`;
  }
  return "https://yango.com/en_int/order/";
}

/**
 * Open Yango directly in the native mobile app, or fallback smoothly
 */
export function openYangoApp({ startCoords, endCoords, address } = {}) {
  const { isAndroid, isIOS } = getClientPlatform();
  const url = getYangoUrl({ startCoords, endCoords, address });

  if (isAndroid) {
    // Navigate top window so Android OS triggers the intent
    window.location.href = url;
    return;
  }

  if (isIOS) {
    const start = Date.now();
    window.location.href = url;

    // If app is not installed on iOS, redirect to App Store
    setTimeout(() => {
      if (Date.now() - start < 1800) {
        window.location.href = "https://apps.apple.com/app/id1439247231";
      }
    }, 1200);
    return;
  }

  // Desktop: open web interface in new tab
  window.open(url, "_blank", "noopener,noreferrer");
}

