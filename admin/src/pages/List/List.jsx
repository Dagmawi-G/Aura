import React, { useEffect, useState, useRef } from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import AddItemModal from "../../components/AddItemModal/AddItemModal";

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState("ETB");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const [savingOrder, setSavingOrder] = useState(false);

  // Carousel & horizontal navigation states
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );
  const trackRef = useRef(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const [foodRes, setRes] = await Promise.all([
        axios.get(`${url}/api/food/list`),
        axios.get(`${url}/api/setting`)
      ]);
      if (foodRes.data.success) {
        setList(foodRes.data.data);
      }
      if (setRes.data.success && setRes.data.data.currency) {
        setCurrency(setRes.data.data.currency);
      }
    } catch (e) {
      toast.error("Failed to load catalog items");
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (newList) => {
    setList(newList);
    try {
      setSavingOrder(true);
      const payload = newList.map((item, index) => ({
        id: item._id,
        order: index
      }));
      const res = await axios.post(`${url}/api/food/reorder`, { items: payload });
      if (!res.data.success) {
        toast.error("Failed to save new item order");
      }
    } catch (e) {
      toast.error("Error saving item order");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newList = [...list];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    handleReorder(newList);
    toast.success(`Moved "${temp.name}" up`);
  };

  const handleMoveDown = (index) => {
    if (index === list.length - 1) return;
    const newList = [...list];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    handleReorder(newList);
    toast.success(`Moved "${temp.name}" down`);
  };

  const handleMakeTop = (index) => {
    if (index === 0) return;
    const newList = [...list];
    const [item] = newList.splice(index, 1);
    newList.unshift(item);
    handleReorder(newList);
    toast.success(`"${item.name}" is now #1 / Trending first!`);
  };

  const removeFood = async (foodId) => {
    if (pendingDeleteId !== foodId) {
      // First click — arm the confirm
      setPendingDeleteId(foodId);
      return;
    }
    // Second click — actually delete
    setPendingDeleteId(null);
    try {
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message || "Failed to remove item");
      }
    } catch (e) {
      toast.error("Error removing item");
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setIsModalOpen(true);
    setPendingDeleteId(null); // cancel any pending delete when editing
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filteredItems = list.filter((item) => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const updateScrollButtons = () => {
    if (trackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
      updateScrollButtons();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset scroll and index when search query or items change
  useEffect(() => {
    setActiveIndex(0);
    if (trackRef.current) {
      trackRef.current.scrollLeft = 0;
    }
    setTimeout(updateScrollButtons, 100);
  }, [searchQuery, filteredItems.length]);

  const getCardStep = () => {
    if (!trackRef.current) return 320;
    const card = trackRef.current.querySelector(".product-card");
    if (!card) return trackRef.current.clientWidth;
    const style = window.getComputedStyle(trackRef.current);
    const gap = parseFloat(style.gap) || 18;
    return card.clientWidth + gap;
  };

  const handleScroll = () => {
    if (trackRef.current) {
      const { scrollLeft } = trackRef.current;
      const step = getCardStep();
      if (step > 0) {
        const index = Math.round(scrollLeft / step);
        setActiveIndex(Math.min(Math.max(0, index), filteredItems.length - 1));
      }
      updateScrollButtons();
    }
  };

  const scrollPrev = () => {
    if (trackRef.current) {
      const step = getCardStep();
      trackRef.current.scrollBy({ left: -step, behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    if (trackRef.current) {
      const step = getCardStep();
      trackRef.current.scrollBy({ left: step, behavior: "smooth" });
    }
  };

  const scrollToIndex = (idx) => {
    if (trackRef.current) {
      const step = getCardStep();
      trackRef.current.scrollTo({ left: idx * step, behavior: "smooth" });
      setActiveIndex(idx);
    }
  };

  return (
    <div className="catalog-page fade-in">
      {/* Top Banner & Header */}
      <div className="catalog-header-wrap">
        <div>
          <h1 className="page-heading">Aura Catalog Dashboard</h1>
          <p className="page-subheading">
            Manage your merchandise products, pricing, and custom printing sticker options
          </p>
        </div>
        <button
          className="btn-add-item"
          onClick={handleOpenAdd}
        >
          <span className="btn-icon">+</span>
          <span>Add New Item</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="catalog-toolbar aura-card">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery("")}>✕</button>
          )}
        </div>
        <div className="reorder-info-hint">
          <span>💡 <strong>Tip:</strong> Reorder items to change display order on the customer website</span>
          {savingOrder && <span className="syncing-order-tag">Syncing order...</span>}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading catalog items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-catalog-state aura-card">
          <div className="empty-icon">🛍️</div>
          <h3>No Items Found</h3>
          <p>No products match your search or your catalog is currently empty.</p>
          <button className="btn-add-item" onClick={handleOpenAdd}>
            + Add Your First Item
          </button>
        </div>
      ) : (
        <div className="admin-catalog-carousel-container">
          {/* Header navigation bar with item counter and navigation arrows */}
          {filteredItems.length > 1 && (
            <div className="catalog-carousel-header">
              <span className="catalog-counter-badge">
                <span className="counter-dot">●</span>{" "}
                {isDesktop && filteredItems.length > 1
                  ? `Items ${activeIndex + 1}–${Math.min(activeIndex + 2, filteredItems.length)} of ${filteredItems.length}`
                  : `Item ${activeIndex + 1} of ${filteredItems.length}`}
              </span>
              <div className="catalog-carousel-arrows">
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={scrollPrev}
                  disabled={!canScrollLeft}
                  aria-label="Previous catalog item"
                  title="Previous item"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={scrollNext}
                  disabled={!canScrollRight}
                  aria-label="Next catalog item"
                  title="Next item"
                >
                  →
                </button>
              </div>
            </div>
          )}

          {/* Horizontal scrollable track matching customer-facing layout */}
          <div
            className={`catalog-horizontal-track ${
              filteredItems.length > (isDesktop ? 2 : 1) ? "has-peek" : "no-peek"
            }`}
            ref={trackRef}
            onScroll={handleScroll}
          >
            {filteredItems.map((item) => {
              const actualIndex = list.findIndex((x) => x._id === item._id);
              const isFirst = actualIndex === 0;
              const isLast = actualIndex === list.length - 1;

              return (
                <div key={item._id} className="product-card aura-card">
                  <div className="product-card-media">
                    <span className="product-rank-badge" title={`Catalog Position #${actualIndex + 1}`}>
                      #{actualIndex + 1} {isFirst ? "🔥 Trending #1" : ""}
                    </span>
                    <img
                      src={`${url}/images/${item.image}`}
                      alt={item.name}
                      className="product-img"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60";
                      }}
                    />
                  </div>

                  <div className="product-card-body">
                    <div className="product-card-top">
                      <h3 className="product-name">{item.name}</h3>
                      <span className="product-price">
                        {item.price} <span className="currency-unit">{currency}</span>
                      </span>
                    </div>

                    {item.description ? (
                      <p className="product-desc">{item.description}</p>
                    ) : (
                      <p className="product-desc muted">No description provided</p>
                    )}

                    {item.stickers && item.stickers.length > 0 && (
                      <div className="product-stickers-wrap">
                        <span className="stickers-label">Stickers:</span>
                        <div className="sticker-tags">
                          {item.stickers.map((s, idx) => (
                            <span key={idx} className="sticker-tag-badge">
                              ✨ {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Position / Reorder Bar */}
                    <div className="product-reorder-bar">
                      <span className="reorder-bar-label">Position:</span>
                      <div className="reorder-btn-group">
                        <button
                          type="button"
                          className="btn-order-arrow"
                          disabled={isFirst || searchQuery !== ""}
                          onClick={() => handleMoveUp(actualIndex)}
                          title="Move Up in Catalog"
                        >
                          ▲ Up
                        </button>
                        <button
                          type="button"
                          className="btn-order-arrow"
                          disabled={isLast || searchQuery !== ""}
                          onClick={() => handleMoveDown(actualIndex)}
                          title="Move Down in Catalog"
                        >
                          ▼ Down
                        </button>
                        {!isFirst && searchQuery === "" && (
                          <button
                            type="button"
                            className="btn-order-top"
                            onClick={() => handleMakeTop(actualIndex)}
                            title="Move to #1 Trending Spot"
                          >
                            ⭐ Make #1
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="product-card-actions">
                      {/* Edit button */}
                      <button
                        className="btn-edit-item"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Item"
                      >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit</span>
                      </button>

                      {/* Delete button — inline 2-step confirm */}
                      {pendingDeleteId === item._id ? (
                        <div className="delete-confirm-row">
                          <span className="delete-confirm-label">Delete?</span>
                          <button
                            className="btn-confirm-yes"
                            onClick={() => removeFood(item._id)}
                          >
                            Yes
                          </button>
                          <button
                            className="btn-confirm-no"
                            onClick={() => setPendingDeleteId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-delete-item"
                          onClick={() => removeFood(item._id)}
                          title="Remove Item"
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination dots below cards */}
          {filteredItems.length > 1 && (
            <div className="catalog-pagination-dots">
              {filteredItems.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`catalog-dot ${idx === activeIndex ? "active" : ""}`}
                  onClick={() => scrollToIndex(idx)}
                  aria-label={`Go to item ${idx + 1}`}
                  title={`Item ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        url={url}
        onItemAdded={fetchList}
        editItem={editItem}
      />
    </div>
  );
};

export default List;
