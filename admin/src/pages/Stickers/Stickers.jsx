import React, { useEffect, useState } from "react";
import "./Stickers.css";
import axios from "axios";
import { toast } from "react-toastify";

const Stickers = ({ url }) => {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [stickerType, setStickerType] = useState("Mix"); // 'Mix' or 'Fixed'
  const [typeFilter, setTypeFilter] = useState("All");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

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
      formData.append("name", name);
      formData.append("category", category);
      formData.append("stickerType", stickerType);
      formData.append("image", file);

      const res = await axios.post(`${url}/api/sticker/add`, formData);
      if (res.data.success) {
        toast.success(`Sticker added to library as ${stickerType}!`);
        setName("");
        setStickerType("Mix");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sticker from global library?")) return;
    try {
      const res = await axios.post(`${url}/api/sticker/remove`, { id });
      if (res.data.success) {
        toast.success("Sticker removed");
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
            Manage custom graphic stickers and badges available for product attachments and customer customization
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
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Luxury">Luxury</option>
                <option value="Street">Street</option>
                <option value="Aesthetic">Aesthetic</option>
                <option value="Icons">Icons</option>
                <option value="Nature">Nature</option>
              </select>
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
              <p className="card-section-desc">Classified into Mix and Fixed for customer selection</p>
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
                  return (
                    <div key={st._id} className="gallery-sticker-item">
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
                        <strong className="gallery-sticker-name">{st.name}</strong>
                        <span className="gallery-sticker-cat">{st.category || "General"}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-delete-sticker"
                        onClick={() => handleDelete(st._id)}
                        title="Delete Sticker"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stickers;
