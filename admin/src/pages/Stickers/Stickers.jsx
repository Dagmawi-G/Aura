import React, { useEffect, useState } from "react";
import "./Stickers.css";
import axios from "axios";
import { toast } from "react-toastify";

const Stickers = ({ url }) => {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category] = useState("General");
  const [stickerType, setStickerType] = useState("Mix"); // 'Mix' or 'Fixed'
  const [stockQuantity, setStockQuantity] = useState("50");
  const [typeFilter, setTypeFilter] = useState("All");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // Edit Sticker State
  const [editingSticker, setEditingSticker] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStickerType, setEditStickerType] = useState("Mix");
  const [editStockQuantity, setEditStockQuantity] = useState("50");
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchStickers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${url}/api/sticker/list`);
      if (res.data.success) {
        setStickers(res.data.data);
      }
    } catch (e) {
      toast.error("Failed to load sticker library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStickers();
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB");
      return;
    }

    const isImage = (selected.type && selected.type.startsWith("image/")) ||
      /\.(jpe?g|png|webp|gif|svg|bmp|jfif)$/i.test(selected.name);
    if (!isImage) {
      toast.error("Please upload photo/graphic formats only (SVG, PNG, JPG, WEBP, GIF)");
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setPreview(loadEvent.target.result);
    };
    reader.onerror = () => {
      try {
        setPreview(URL.createObjectURL(selected));
      } catch (err) {
        console.error("Preview creation error:", err);
      }
    };
    reader.readAsDataURL(selected);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a sticker graphic or photo");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter a sticker title");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("stickerType", stickerType);
      formData.append("stockQuantity", stockQuantity !== "" ? stockQuantity : "50");
      formData.append("image", file);

      const res = await axios.post(`${url}/api/sticker/add`, formData);
      if (res.data.success) {
        toast.success(`Sticker added to library with ${stockQuantity} units in stock!`);
        setName("");
        setStickerType("Mix");
        setStockQuantity("50");
        setFile(null);
        setPreview("");
        await fetchStickers();
      } else {
        toast.error(res.data.message || "Failed to upload sticker");
      }
    } catch (e) {
      toast.error("Error uploading sticker");
    } finally {
      setUploading(false);
    }
  };

  // Start editing a sticker
  const handleStartEdit = (st) => {
    setEditingSticker(st);
    setEditName(st.name || "");
    setEditStickerType(st.stickerType || "Mix");
    setEditStockQuantity(st.stockQuantity !== undefined ? String(st.stockQuantity) : "50");
    setEditFile(null);
    setEditPreview(`${url}/images/${st.image}`);
  };

  const handleCloseEdit = () => {
    setEditingSticker(null);
    setEditName("");
    setEditStickerType("Mix");
    setEditStockQuantity("50");
    setEditFile(null);
    setEditPreview("");
  };

  const handleEditFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB");
      return;
    }

    setEditFile(selected);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setEditPreview(loadEvent.target.result);
    };
    reader.onerror = () => {
      try {
        setEditPreview(URL.createObjectURL(selected));
      } catch (err) { }
    };
    reader.readAsDataURL(selected);
  };

  const handleUpdateSticker = async (e) => {
    e.preventDefault();
    if (!editingSticker) return;
    if (!editName.trim()) {
      toast.error("Please enter a sticker title");
      return;
    }

    setSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append("id", editingSticker._id);
      formData.append("name", editName.trim());
      formData.append("stickerType", editStickerType);
      formData.append("stockQuantity", editStockQuantity !== "" ? editStockQuantity : "0");
      if (editFile) {
        formData.append("image", editFile);
      }

      const res = await axios.post(`${url}/api/sticker/update`, formData);
      if (res.data.success) {
        toast.success("Sticker updated successfully!");
        handleCloseEdit();
        await fetchStickers();
      } else {
        toast.error(res.data.message || "Failed to update sticker");
      }
    } catch (e) {
      toast.error("Error updating sticker");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sticker from global library?")) return;
    try {
      const res = await axios.post(`${url}/api/sticker/remove`, { id });
      if (res.data.success) {
        toast.success("Sticker removed");
        if (editingSticker?._id === id) {
          handleCloseEdit();
        }
        await fetchStickers();
      } else {
        toast.error(res.data.message || "Failed to delete");
      }
    } catch (e) {
      toast.error("Error deleting sticker");
    }
  };

  return (
    <div className="stickers-page fade-in">
      <div className="stickers-page-header">
        <div>
          <h1 className="page-heading">Global Sticker Gallery</h1>
          <p className="page-subheading">
            Manage custom graphic stickers, classifications, inventory count, and availability for customer customization
          </p>
        </div>
      </div>

      <div className="stickers-layout-grid">
        {/* Left: Upload Form */}
        <div className="sticker-upload-card aura-card">
          <div className="card-header-row">
            <div className="header-icon-badge">✨</div>
            <div>
              <h2 className="card-section-title">Upload New Sticker</h2>
              <p className="card-section-desc">Add PNG, SVG, or graphic photos under 10MB</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="sticker-form">
            <div className="sticker-dropzone">
              <input
                type="file"
                id="sticker-file-input"
                accept="image/*"
                onChange={handleFileSelect}
                hidden
              />
              <label htmlFor="sticker-file-input" className="sticker-dropzone-label">
                {preview ? (
                  <div className="sticker-preview-wrap">
                    <img src={preview} alt="Sticker Preview" className="sticker-preview-img" />
                    <span className="sticker-change-tag">Click to change</span>
                  </div>
                ) : (
                  <div className="sticker-empty-wrap">
                    <span className="sticker-upload-icon">🎨</span>
                    <span className="sticker-upload-text">Choose Sticker Graphic</span>
                    <span className="sticker-upload-hint">SVG or transparent PNG recommended (&lt;10MB)</span>
                  </div>
                )}
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Sticker Name <span className="label-req">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Aura Crown / Cosmic Butterfly"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Classification / Type <span className="label-req">*</span></label>
              <select
                className="form-input"
                value={stickerType}
                onChange={(e) => setStickerType(e.target.value)}
              >
                <option value="Mix">🎨 A. Mix (Customer chooses based on theme)</option>
                <option value="Fixed">📌 B. Fixed (Fixed placement / Standard)</option>
              </select>
              <small className="form-field-hint" style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                Classify sticker as Mix or Fixed for customer customization.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity (In-Stock Units) <span className="label-req">*</span></label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="e.g. 50"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
              <small className="form-field-hint" style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                Decreases automatically with each order. Reaching 0 marks it OUT.
              </small>
            </div>

            <button type="submit" className="btn-primary btn-block" disabled={uploading}>
              {uploading ? "Uploading Graphic..." : "Add to Library"}
            </button>
          </form>
        </div>

        {/* Right: Library Grid */}
        <div className="sticker-library-card aura-card">
          <div className="card-header-row justify-between" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 className="card-section-title">Active Library ({stickers.length})</h2>
              <p className="card-section-desc">Classified into Mix and Fixed • Click any sticker to edit details or stock</p>
            </div>

            {/* Classification Filter Tabs */}
            <div className="sticker-type-filters" style={{ display: "flex", gap: "6px" }}>
              {["All", "Mix", "Fixed"].map((type) => {
                const count = type === "All"
                  ? stickers.length
                  : stickers.filter((s) => (s.stickerType || "Mix") === type).length;
                return (
                  <button
                    key={type}
                    type="button"
                    className={`filter-btn-pill ${typeFilter === type ? "active" : ""}`}
                    onClick={() => setTypeFilter(type)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      border: "1px solid #cbd5e1",
                      background: typeFilter === type ? "#2563eb" : "#f8fafc",
                      color: typeFilter === type ? "#fff" : "#475569",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {type === "Mix" ? "🎨 Mix" : type === "Fixed" ? "📌 Fixed" : "All"} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading stickers...</p>
            </div>
          ) : stickers.length === 0 ? (
            <div className="empty-stickers-box">
              <p>No stickers in library yet. Upload your first sticker on the left.</p>
            </div>
          ) : (
            <div className="stickers-gallery-grid">
              {stickers
                .filter((st) => {
                  if (typeFilter === "All") return true;
                  return (st.stickerType || "Mix") === typeFilter;
                })
                .map((st) => {
                  const isFixed = (st.stickerType || "Mix") === "Fixed";
                  const stock = typeof st.stockQuantity === "number" ? st.stockQuantity : 50;
                  const isOut = stock <= 0;

                  return (
                      <div
                        key={st._id}
                        className={`gallery-sticker-item ${isOut ? "item-out-of-stock" : ""}`}
                        onClick={() => handleStartEdit(st)}
                        title="Click sticker to edit details or stock"
                      >
                        <button
                          type="button"
                          className="btn-delete-sticker"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(st._id);
                          }}
                          title="Delete Sticker"
                          aria-label="Delete Sticker"
                        >
                          ✕
                        </button>

                        <div className="gallery-sticker-media">
                          <img
                            src={`${url}/images/${st.image}`}
                            alt={st.name}
                            className="gallery-sticker-img"
                          />
                          <span
                            className="sticker-type-badge"
                            style={{
                              position: "absolute",
                              top: "6px",
                              left: "6px",
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              background: isFixed ? "#f1f5f9" : "#e0e7ff",
                              color: isFixed ? "#334155" : "#3730a3",
                              border: isFixed ? "1px solid #cbd5e1" : "1px solid #c7d2fe"
                            }}
                          >
                            {isFixed ? "📌 Fixed" : "🎨 Mix"}
                          </span>
                        </div>
                        <div className="gallery-sticker-meta">
                          <strong className="gallery-sticker-name" title={st.name}>{st.name}</strong>
                          {isOut ? (
                            <span className="sticker-stock-badge badge-out">🔴 OUT</span>
                          ) : (
                            <span className="sticker-stock-badge badge-in">📦 {stock} left</span>
                          )}
                          <span className="sticker-click-hint">Click to edit</span>
                        </div>
                      </div>
                      );
                })}
                    </div>
                  )
                }
        </div>
      </div>

        {/* Edit Sticker Modal */}
        {editingSticker && (
          <div className="sticker-edit-modal-backdrop" onClick={handleCloseEdit}>
            <div className="sticker-edit-modal-content aura-card" onClick={(e) => e.stopPropagation()}>
              <div className="sticker-modal-header">
                <div className="modal-title-wrap">
                  <span className="modal-icon-badge">✏️</span>
                  <div>
                    <h3 className="modal-title">Edit Sticker</h3>
                    <p className="modal-subtitle">Modify name, type, graphic, or available stock</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="sticker-modal-close"
                  onClick={handleCloseEdit}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateSticker} className="edit-sticker-form">
                <div className="edit-image-row">
                  <div className="edit-preview-box">
                    <img src={editPreview} alt="Sticker preview" className="edit-preview-img" />
                  </div>
                  <div className="edit-image-action-box">
                    <label htmlFor="edit-sticker-file-input" className="btn-secondary-sm btn-change-graphic">
                      🖼️ Change Graphic
                    </label>
                    <input
                      id="edit-sticker-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileSelect}
                      style={{ display: "none" }}
                    />
                    <small className="form-field-hint">Optional. Leave untouched to keep the current graphic.</small>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Sticker Name <span className="label-req">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Aura Crown"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Classification / Type <span className="label-req">*</span></label>
                  <select
                    className="form-input"
                    value={editStickerType}
                    onChange={(e) => setEditStickerType(e.target.value)}
                  >
                    <option value="Mix">🎨 A. Mix (Customer chooses based on theme)</option>
                    <option value="Fixed">📌 B. Fixed (Fixed placement / Standard)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Available Stock Quantity <span className="label-req">*</span></label>
                  <div className="stock-input-wrapper">
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={editStockQuantity}
                      onChange={(e) => setEditStockQuantity(e.target.value)}
                      required
                    />
                    <div className="stock-quick-actions">
                      <button
                        type="button"
                        className="btn-stock-pill mark-out"
                        onClick={() => setEditStockQuantity("0")}
                        title="Set stock to 0 (Mark OUT)"
                      >
                        Set to 0 (OUT)
                      </button>
                      <button
                        type="button"
                        className="btn-stock-pill"
                        onClick={() => setEditStockQuantity("50")}
                      >
                        50
                      </button>
                      <button
                        type="button"
                        className="btn-stock-pill"
                        onClick={() => setEditStockQuantity("100")}
                      >
                        100
                      </button>
                    </div>
                  </div>
                  <small className="form-field-hint" style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                    When stock reaches 0, the customer app flags this sticker as <strong>OUT</strong> and prevents selection.
                  </small>
                </div>

                <div className="sticker-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCloseEdit}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      );
};

      export default Stickers;
