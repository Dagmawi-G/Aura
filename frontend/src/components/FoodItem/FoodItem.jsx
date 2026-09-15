import React, { useContext } from "react";
import "./FoodItem.css";
import { StoreContext } from "../../context/StoreContext";

const FoodItem = ({ product, currency = "ETB", onCustomize }) => {
  const { url } = useContext(StoreContext);

  return (
    <div className="client-product-card aura-glass">
      <div className="product-media-wrap" onClick={onCustomize}>
        <img
          src={`${url}/images/${product.image}`}
          alt={product.name}
          className="client-product-img"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60";
          }}
        />
        <div className="customize-overlay">
          <span className="overlay-text">✨ Customize Item</span>
        </div>
      </div>

      <div className="product-info-wrap">
        <div className="title-price-row">
          <h3 className="client-product-title" onClick={onCustomize}>{product.name}</h3>
          <span className="client-product-price">
            {product.price} <span className="curr">{currency}</span>
          </span>
        </div>

        {product.description ? (
          <p className="client-product-desc">{product.description}</p>
        ) : (
          <p className="client-product-desc muted">Custom lettering and sticker options available</p>
        )}

        {product.stickers && product.stickers.length > 0 && (
          <div className="stickers-indicator">
            <span className="stickers-icon">✨</span>
            <span>{product.stickers.length} Stickers Available</span>
          </div>
        )}

        <button
          type="button"
          className="btn-customize-trigger"
          onClick={onCustomize}
        >
          <span>Customize & Order</span>
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default FoodItem;
