import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./AddItemModal.css";
import axios from "axios";
import { toast } from "react-toastify";

/**
 * AddItemModal — dual-mode: Add new item OR Edit existing item.
 * Props:
 *   isOpen      {boolean}  — controls visibility
 *   onClose     {fn}       — called when closing
 *   url         {string}   — backend base URL
 *   onItemAdded {fn}       — called after a successful save (refresh list)
 *   editItem    {object|null} — if set, modal opens in Edit mode pre-filled with this item's data
 */
const AddItemModal = ({ isOpen, onClose, url, onItemAdded, editItem = null }) => {
  const isEditMode = Boolean(editItem);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);          // new file upload (null = keep existing)
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  // Stickers library
  const [allStickers, setAllStickers] = useState([]);
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [showStickerUpload, setShowStickerUpload] = useState(false);
  const [newStickerName, setNewStickerName] = useState("");
  const [newStickerFile, setNewStickerFile] = useState(null);
  const [newStickerPreview, setNewStickerPreview] = useState("");

  const fetchStickers = async () => {
    try {
      const res = await axios.get(`${url}/api/sticker/list`);
      if (res.data.success) {
        setAllStickers(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // When modal opens, load stickers and pre-fill form if editing
  useEffect(() => {
    if (isOpen) {
      fetchStickers();
      if (isEditMode && editItem) {
        setName(editItem.name || "");
        setPrice(String(editItem.price || ""));
        setDescription(editItem.description || "");
        setSelectedStickers(editItem.stickers || []);
        setImage(null); // no new upload yet
        setImagePreview(""); // will show existing via existingImageUrl below
      } else {
        // Reset for Add mode
        setName("");
        setPrice("");
        setDescription("");
        setSelectedStickers([]);
        setImage(null);
        setImagePreview("");
      }
    }
  }, [isOpen, editItem]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Existing image URL (Edit mode, no new file selected)
  const existingImageUrl = isEditMode && editItem?.image
    ? `${url}/images/${editItem.image}`
    : null;

  const displayPreview = imagePreview || existingImageUrl;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit. Please choose a smaller photo.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Invalid format. Please upload photo formats only (JPG, PNG, WEBP, SVG, GIF).");
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const toggleSticker = (stickerName) => {
    if (selectedStickers.includes(stickerName)) {
      setSelectedStickers(selectedStickers.filter((s) => s !== stickerName));
    } else {
      setSelectedStickers([...selectedStickers, stickerName]);
    }
  };

  const handleQuickUploadSticker = async (e) => {
    e.preventDefault();
    if (!newStickerFile) {
      toast.error("Please choose a sticker image (< 10MB)");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", newStickerName || "Sticker");
      formData.append("image", newStickerFile);

      const res = await axios.post(`${url}/api/sticker/add`, formData);
      if (res.data.success) {
        toast.success("Sticker added to gallery!");
        await fetchStickers();
        setSelectedStickers([...selectedStickers, res.data.data.name]);
        setShowStickerUpload(false);
        setNewStickerName("");
        setNewStickerFile(null);
        setNewStickerPreview("");
      }
    } catch (err) {
      toast.error("Failed to upload sticker");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditMode && !image) {
      toast.error("Please upload an item photo");
      return;
    }
    if (!name.trim() || !price) {
      toast.error("Please fill in item name and price");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("price", price);
      formData.append("description", description);
      formData.append("stickers", JSON.stringify(selectedStickers));

      if (isEditMode) {
        formData.append("id", editItem._id);
        if (image) formData.append("image", image); // only send if new image selected
        const res = await axios.post(`${url}/api/food/update`, formData);
        if (res.data.success) {
          toast.success("Item updated successfully!");
          onItemAdded();
          onClose();
        } else {
          toast.error(res.data.message || "Failed to update item");
        }
      } else {
        formData.append("image", image);
        const res = await axios.post(`${url}/api/food/add`, formData);
        if (res.data.success) {
          toast.success("Item added to catalog!");
          onItemAdded();
          onClose();
        } else {
          toast.error(res.data.message || "Failed to add item");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving item");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {isEditMode ? "Edit Catalog Item" : "Add New Catalog Item"}
            </h2>
            <p className="modal-subtitle">
              {isEditMode
                ? "Update product details, pricing, or photo"
                : "Add custom apparel, merchandise, or accessories"}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-wrap">
          <div className="modal-body">
            <div className="modal-grid">
            {/* Left Col: Photo upload */}
            <div className="form-group">
              <label className="form-label">
                Item Photo {!isEditMode && <span className="label-req">*</span>}
                <span className="label-hint">(&lt; 10MB, JPG/PNG/WEBP)</span>
                {isEditMode && !image && (
                  <span className="label-hint" style={{ color: "#10b981" }}> — Current photo kept</span>
                )}
              </label>
              <div className="upload-dropzone">
                <input
                  type="file"
                  id="item-photo-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
                <label htmlFor="item-photo-input" className="dropzone-label">
                  {displayPreview ? (
                    <div className="dropzone-preview-wrap">
                      <img src={displayPreview} alt="Preview" className="dropzone-img" />
                      <div className="dropzone-overlay">Click to {isEditMode ? "replace" : "change"} photo</div>
                    </div>
                  ) : (
                    <div className="dropzone-empty">
                      <div className="dropzone-icon">📷</div>
                      <p className="dropzone-text">Click to upload photo</p>
                      <p className="dropzone-sub">Max size 10MB. Photo formats only.</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Right Col: Details */}
            <div className="form-fields">
              <div className="form-group">
                <label className="form-label">Item Name <span className="label-req">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aura Vintage Oversized Tee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price <span className="label-req">*</span></label>
                  <div className="input-prefix-wrap">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input with-prefix"
                      placeholder="e.g. 1200"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description <span className="label-opt">(Optional)</span></label>
                <textarea
                  rows="3"
                  className="form-input"
                  placeholder="Material specifications, fabric details, sizing info..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sticker Attachments Section */}
          <div className="form-group stickers-section">
            <div className="stickers-header">
              <div>
                <label className="form-label">Attach Printable Stickers</label>
                <p className="label-subtext">
                  Choose which stickers customers can select when customizing this item
                </p>
              </div>
              <button
                type="button"
                className="btn-text-action"
                onClick={() => setShowStickerUpload(!showStickerUpload)}
              >
                {showStickerUpload ? "− Cancel" : "+ Upload New Sticker"}
              </button>
            </div>

            {showStickerUpload && (
              <div className="quick-sticker-upload">
                <div className="quick-upload-row">
                  <input
                    type="text"
                    placeholder="Sticker Name"
                    className="form-input form-input-sm"
                    value={newStickerName}
                    onChange={(e) => setNewStickerName(e.target.value)}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="form-file-sm"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (f && f.size <= 10 * 1024 * 1024) {
                        setNewStickerFile(f);
                        setNewStickerPreview(URL.createObjectURL(f));
                      } else if (f) {
                        toast.error("Max file size 10MB");
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-accent-sm"
                    onClick={handleQuickUploadSticker}
                  >
                    Add to Gallery
                  </button>
                </div>
              </div>
            )}

            <div className="stickers-picker-grid">
              {allStickers.length === 0 ? (
                <p className="no-stickers-text">No stickers in gallery yet. Click "Upload New Sticker" above.</p>
              ) : (
                allStickers.map((sticker) => {
                  const isSelected = selectedStickers.includes(sticker.name);
                  return (
                    <div
                      key={sticker._id}
                      className={`sticker-chip ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSticker(sticker.name)}
                    >
                      <img
                        src={`${url}/images/${sticker.image}`}
                        alt={sticker.name}
                        className="sticker-chip-img"
                      />
                      <span className="sticker-chip-title">{sticker.name}</span>
                      {isSelected && <span className="sticker-check">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? isEditMode ? "Saving Changes..." : "Adding Item..."
              : isEditMode ? "Save Changes" : "Publish Item"}
          </button>
        </div>
      </form>
      </div>
    </div>,
    document.body
  );
};

export default AddItemModal;
