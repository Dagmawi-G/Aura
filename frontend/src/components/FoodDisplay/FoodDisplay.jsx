import React, { useContext, useState } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import CustomizeModal from "../CustomizeModal/CustomizeModal";

const FoodDisplay = () => {
  const { food_list, settings } = useContext(StoreContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalProduct, setModalProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenCustomize = (product) => {
    setModalProduct(product);
    setIsModalOpen(true);
  };

  const filteredList = food_list.filter((item) => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <section className="catalog-section" id="collection">
      {/* Hero / Showcase Header */}
      <div className="collection-hero-wrap">
        <div className="collection-hero-text">
          <span className="collection-kicker">Exquisite Custom Merch</span>
          <h1 className="collection-main-heading">Crafted for Your Unique Identity</h1>
          <p className="collection-subheading">
            Select an item, add your custom printed lettering & stickers, and order with seamless Ethiopian bank transfer or Telebirr proof verification.
          </p>
        </div>

        {/* Search Bar */}
        <div className="catalog-search-bar">
          <svg className="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search custom hoodies, mugs, tees, tumblers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="catalog-search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")}>✕</button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {filteredList.length === 0 ? (
        <div className="empty-collection-box aura-glass">
          <div className="empty-box-icon">🎨</div>
          <h3>No Items Found</h3>
          <p>No customizable products match your criteria.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredList.map((product) => (
            <FoodItem
              key={product._id}
              product={product}
              currency={settings.currency}
              onCustomize={() => handleOpenCustomize(product)}
            />
          ))}
        </div>
      )}

      {/* Customization Modal */}
      {modalProduct && isModalOpen && (
        <CustomizeModal
          product={modalProduct}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalProduct(null);
          }}
        />
      )}
    </section>
  );
};

export default FoodDisplay;
