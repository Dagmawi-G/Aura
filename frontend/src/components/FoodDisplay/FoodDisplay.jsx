import React, { useContext, useState, useRef, useEffect } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import CustomizeModal from "../CustomizeModal/CustomizeModal";

const FoodDisplay = () => {
  const { food_list, settings } = useContext(StoreContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalProduct, setModalProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);

  const handleOpenCustomize = (product) => {
    setModalProduct(product);
    setIsModalOpen(true);
  };

  const filteredList = food_list.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Reset scroll and index when search query changes
  useEffect(() => {
    setActiveIndex(0);
    if (trackRef.current) {
      trackRef.current.scrollLeft = 0;
    }
  }, [searchQuery]);

  // Track active collection card on horizontal scroll
  const handleScroll = () => {
    if (trackRef.current) {
      const { scrollLeft, clientWidth } = trackRef.current;
      if (clientWidth > 0) {
        const index = Math.round(scrollLeft / clientWidth);
        setActiveIndex(Math.min(Math.max(0, index), filteredList.length - 1));
      }
    }
  };

  const scrollPrev = () => {
    if (trackRef.current) {
      const width = trackRef.current.clientWidth;
      trackRef.current.scrollBy({ left: -width, behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    if (trackRef.current) {
      const width = trackRef.current.clientWidth;
      trackRef.current.scrollBy({ left: width, behavior: "smooth" });
    }
  };

  const scrollToIndex = (idx) => {
    if (trackRef.current) {
      const width = trackRef.current.clientWidth;
      trackRef.current.scrollTo({ left: idx * width, behavior: "smooth" });
      setActiveIndex(idx);
    }
  };

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

      {/* Horizontal Collection Cards Carousel */}
      {filteredList.length === 0 ? (
        <div className="empty-collection-box aura-glass">
          <div className="empty-box-icon">🎨</div>
          <h3>No Items Found</h3>
          <p>No customizable products match your criteria.</p>
        </div>
      ) : (
        <div className="collection-carousel-container">
          {/* Header navigation bar with item counter and navigation arrows */}
          {filteredList.length > 1 && (
            <div className="collection-carousel-header">
              <span className="collection-counter-badge">
                <span className="counter-dot">●</span> Item {activeIndex + 1} of {filteredList.length}
              </span>
              <div className="collection-carousel-arrows">
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={scrollPrev}
                  disabled={activeIndex === 0}
                  aria-label="Previous collection item"
                  title="Previous item"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={scrollNext}
                  disabled={activeIndex >= filteredList.length - 1}
                  aria-label="Next collection item"
                  title="Next item"
                >
                  →
                </button>
              </div>
            </div>
          )}

          {/* Full-width scrollable track */}
          <div
            className="products-horizontal-track products-grid"
            ref={trackRef}
            onScroll={handleScroll}
          >
            {filteredList.map((product) => (
              <FoodItem
                key={product._id}
                product={product}
                currency={settings.currency}
                onCustomize={() => handleOpenCustomize(product)}
              />
            ))}
          </div>

          {/* Pagination dots below cards */}
          {filteredList.length > 1 && (
            <div className="collection-pagination-dots">
              {filteredList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`collection-dot ${idx === activeIndex ? "active" : ""}`}
                  onClick={() => scrollToIndex(idx)}
                  aria-label={`Go to item ${idx + 1}`}
                />
              ))}
            </div>
          )}
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
