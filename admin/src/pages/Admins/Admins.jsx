import React, { useState, useEffect, useContext } from "react";
import "./Admins.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";

const Admins = ({ url }) => {
  const { adminUser, getAuthHeaders, token } = useContext(StoreContext);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Admin Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirmation modal state
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${url}/api/user/admin-list`, getAuthHeaders());
      if (res.data.success) {
        setAdmins(res.data.data || []);
      } else {
        toast.error(res.data.message || "Failed to load admin accounts");
      }
    } catch (err) {
      console.error("Error fetching admins:", err);
      toast.error(err.response?.data?.message || "Error fetching admin accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdmins();
    }
  }, [token, url]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newAdminPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (newAdminPassword !== newAdminConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setCreating(true);
    try {
      const res = await axios.post(
        `${url}/api/user/admin-create`,
        {
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword
        },
        getAuthHeaders()
      );

      if (res.data.success) {
        toast.success(res.data.message || "Administrator added successfully!");
        setShowAddModal(false);
        setNewAdminName("");
        setNewAdminEmail("");
        setNewAdminPassword("");
        setNewAdminConfirmPassword("");
        fetchAdmins();
      } else {
        toast.error(res.data.message || "Failed to create administrator");
      }
    } catch (err) {
      console.error("Error creating admin:", err);
      toast.error(err.response?.data?.message || "Error creating administrator");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    setDeleting(true);
    try {
      const res = await axios.delete(
        `${url}/api/user/admin-delete/${adminToDelete._id}`,
        getAuthHeaders()
      );

      if (res.data.success) {
        toast.success(res.data.message || "Admin account deleted successfully");
        setAdminToDelete(null);
        fetchAdmins();
      } else {
        toast.error(res.data.message || "Failed to delete administrator");
      }
    } catch (err) {
      console.error("Error deleting admin:", err);
      toast.error(err.response?.data?.message || "Error deleting administrator");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admins-management-page fade-in">
      {/* Top Header */}
      <div className="admins-page-header">
        <div className="header-info">
          <h1 className="admins-title">Administrator Accounts</h1>
          <p className="admins-subtitle">
            Manage authorized staff members with access to the Aura Admin Control Panel
          </p>
        </div>

        <button
          type="button"
          className="btn-add-admin-trigger"
          onClick={() => setShowAddModal(true)}
        >
          <span className="btn-icon">＋</span>
          <span>Add New Admin</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="admin-stats-cards">
        <div className="admin-stat-card">
          <span className="stat-label">Total Administrators</span>
          <strong className="stat-number">{admins.length}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Your Active Account</span>
          <strong className="stat-user-email">{adminUser?.email || "Logged in"}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Access Level</span>
          <strong className="stat-access-tag">Full Super Admin</strong>
        </div>
      </div>

      {/* Admins Table Card */}
      <div className="admins-table-card">
        <div className="table-card-header">
          <h3 className="card-heading">Active Administrator Team ({admins.length})</h3>
          <button
            type="button"
            className="btn-refresh-list"
            onClick={fetchAdmins}
            title="Refresh list"
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="admins-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading administrator accounts...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="admins-empty-state">
            <p>No administrator accounts found.</p>
          </div>
        ) : (
          <div className="admins-table-responsive">
            <table className="admins-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((adm) => {
                  const isCurrent = adminUser && (adminUser.id === adm._id || adminUser.email === adm.email);
                  const initials = adm.name
                    ? adm.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "AD";

                  return (
                    <tr key={adm._id} className={isCurrent ? "current-admin-row" : ""}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar-badge">{initials}</div>
                          <div className="admin-name-wrap">
                            <strong className="admin-name">{adm.name}</strong>
                            {isCurrent && <span className="you-pill">You (Active)</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-email-text">{adm.email}</span>
                      </td>
                      <td>
                        <span className="role-tag">Admin</span>
                      </td>
                      <td>
                        <span className="date-text">
                          {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          }) : "System Default"}
                        </span>
                      </td>
                      <td className="text-right">
                        {isCurrent ? (
                          <span className="current-user-note">Active Session</span>
                        ) : (
                          <button
                            type="button"
                            className="btn-delete-admin"
                            onClick={() => setAdminToDelete(adm)}
                            title={`Remove ${adm.name}`}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE NEW ADMIN MODAL ─────────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => !creating && setShowAddModal(false)}>
          <div className="admin-modal-card fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-badge-icon">👤</span>
                <div>
                  <h2 className="modal-title">Create New Administrator</h2>
                  <p className="modal-subtitle">Grant administrative access to a new team member</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => !creating && setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="modal-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Abebe Bekele"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="e.g. abebe@aura.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Password (Min 8 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="form-input"
                    placeholder="••••••••"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="form-input"
                    placeholder="••••••••"
                    value={newAdminConfirmPassword}
                    onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  disabled={creating}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={creating}
                >
                  {creating ? "Creating Admin..." : "Create Admin Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE ADMIN CONFIRMATION MODAL ───────────────────────────── */}
      {adminToDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setAdminToDelete(null)}>
          <div className="admin-modal-card delete-modal fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-badge-icon danger">⚠️</span>
                <div>
                  <h2 className="modal-title">Delete Administrator Account</h2>
                  <p className="modal-subtitle">This action cannot be undone</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => !deleting && setAdminToDelete(null)}
              >
                ✕
              </button>
            </div>

            <div className="delete-modal-body">
              <p>
                Are you sure you want to permanently delete administrator{" "}
                <strong>{adminToDelete.name}</strong> (<code>{adminToDelete.email}</code>)?
              </p>
              <p className="warning-note">
                They will immediately lose all access to the Aura Admin Control Panel.
              </p>
            </div>

            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                disabled={deleting}
                onClick={() => setAdminToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-delete-confirm"
                disabled={deleting}
                onClick={handleDeleteAdmin}
              >
                {deleting ? "Deleting..." : "Yes, Delete Administrator"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;
