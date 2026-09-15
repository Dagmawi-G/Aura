import React, { useEffect, useState } from "react";
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
        <div className="catalog-grid">
          {filteredItems.map((item) => (
            <div key={item._id} className="product-card aura-card">
              <div className="product-card-media">
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
          ))}
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
