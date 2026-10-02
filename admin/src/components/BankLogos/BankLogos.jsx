import React from "react";
import "./BankLogos.css";

import telebirrImg from "../../assets/banks/telebirr.png";
import cbeImg from "../../assets/banks/cbe.png";
import abyssiniaImg from "../../assets/banks/abyssinia.png";
import awashImg from "../../assets/banks/awash.png";
import nibImg from "../../assets/banks/nib.png";
import dashenImg from "../../assets/banks/dashen.png";
import coopImg from "../../assets/banks/coop.png";
import zemenImg from "../../assets/banks/zemen.png";

/**
 * Metadata & Official Brand Config for Ethiopian Banks
 */
export const getPaymentProviderInfo = (provider) => {
  const p = (provider || "").toLowerCase();

  if (p.includes("telebirr") || p.includes("tele birr") || p.includes("ethio telecom")) {
    return {
      key: "telebirr",
      name: "Telebirr",
      shortName: "telebirr",
      image: telebirrImg,
      themeColor: "#0077c8",
      accentColor: "#00a0e3",
      bgColor: "#f0f9ff",
      borderColor: "#bae6fd"
    };
  }

  if (p.includes("cbe") || p.includes("commercial bank")) {
    return {
      key: "cbe",
      name: "CBE",
      fullName: "Commercial Bank of Ethiopia",
      shortName: "CBE",
      image: cbeImg,
      themeColor: "#844b25",
      accentColor: "#f59e0b",
      bgColor: "#fffbeb",
      borderColor: "#fde68a"
    };
  }

  if (p.includes("abyssinia") || p.includes("boa")) {
    return {
      key: "abyssinia",
      name: "Bank of Abyssinia",
      shortName: "BoA",
      image: abyssiniaImg,
      themeColor: "#e69500",
      accentColor: "#0f172a",
      bgColor: "#fffdf0",
      borderColor: "#fef08a"
    };
  }

  if (p.includes("awash")) {
    return {
      key: "awash",
      name: "Awash Bank",
      shortName: "Awash",
      image: awashImg,
      themeColor: "#1e1b4b",
      accentColor: "#ea580c",
      bgColor: "#f8fafc",
      borderColor: "#cbd5e1"
    };
  }

  if (p.includes("nib") || p.includes("nib bank")) {
    return {
      key: "nib",
      name: "Nib International Bank",
      shortName: "Nib",
      image: nibImg,
      themeColor: "#8b3a0f",
      accentColor: "#eab308",
      bgColor: "#fff7ed",
      borderColor: "#fed7aa"
    };
  }

  if (p.includes("dashen") || p.includes("amole")) {
    return {
      key: "dashen",
      name: "Dashen Bank",
      shortName: "Dashen",
      image: dashenImg,
      themeColor: "#0d233a",
      accentColor: "#00a0e3",
      bgColor: "#eff6ff",
      borderColor: "#bfdbfe"
    };
  }

  if (p.includes("coop") || p.includes("oromia") || p.includes("cbo")) {
    return {
      key: "coop",
      name: "Coop Bank",
      fullName: "Cooperative Bank of Oromia",
      shortName: "Coop",
      image: coopImg,
      themeColor: "#0284c7",
      accentColor: "#0ea5e9",
      bgColor: "#f0f9ff",
      borderColor: "#bae6fd"
    };
  }

  if (p.includes("zemen")) {
    return {
      key: "zemen",
      name: "Zemen Bank",
      shortName: "Zemen",
      image: zemenImg,
      themeColor: "#dc2626",
      accentColor: "#991b1b",
      bgColor: "#fef2f2",
      borderColor: "#fecaca"
    };
  }

  return {
    key: "default",
    name: provider || "Bank Transfer",
    shortName: provider ? provider.substring(0, 8) : "BANK",
    image: null,
    themeColor: "#334155",
    accentColor: "#d97706",
    bgColor: "#f8fafc",
    borderColor: "#e2e8f0"
  };
};

/**
 * BankLogo Component: Displays official real bank image logos
 */
export const BankLogo = ({ provider, size = 32, className = "" }) => {
  const info = getPaymentProviderInfo(provider);

  if (info.image) {
    return (
      <div
        className={`bank-logo-wrapper bank-${info.key} ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={info.image}
          alt={info.name}
          className="bank-official-img"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`bank-logo-wrapper bank-fallback ${className}`}
      style={{ width: size, height: size, background: info.bgColor, borderColor: info.borderColor }}
    >
      <span className="bank-fallback-icon">🏦</span>
    </div>
  );
};

export default BankLogo;
