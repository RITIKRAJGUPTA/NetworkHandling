import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL = 'http://localhost:5000';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    role: "",
    designation: "",
    teamLead: "",
    address: "",
    dateOfBirth: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    },
    bankDetails: {
      accountNumber: "",
      bankName: "",
      ifscCode: ""
    }
  });
  const [teamLeads, setTeamLeads] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchTeamLeads();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
      setLoading(false);
    }
  };

  const fetchTeamLeads = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/api/auth/team-leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamLeads(response.data);
    } catch (error) {
      console.error("Error fetching team leads:", error);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      gender: user.gender || "",
      role: user.role || "",
      designation: user.designation || "",
      teamLead: user.teamLead?._id || user.teamLead || "",
      address: user.address || "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "",
      emergencyContact: {
        name: user.emergencyContact?.name || "",
        phone: user.emergencyContact?.phone || "",
        relationship: user.emergencyContact?.relationship || ""
      },
      bankDetails: {
        accountNumber: user.bankDetails?.accountNumber || "",
        bankName: user.bankDetails?.bankName || "",
        ifscCode: user.bankDetails?.ifscCode || ""
      }
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [name]: value }
    }));
  };

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value }
    }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const updateData = {};
      
      if (editFormData.name !== selectedUser.name) updateData.name = editFormData.name;
      if (editFormData.email !== selectedUser.email) updateData.email = editFormData.email;
      if (editFormData.phone !== selectedUser.phone) updateData.phone = editFormData.phone;
      if (editFormData.gender !== selectedUser.gender) updateData.gender = editFormData.gender;
      if (editFormData.role !== selectedUser.role) updateData.role = editFormData.role;
      if (editFormData.designation !== selectedUser.designation) updateData.designation = editFormData.designation;
      if (editFormData.address !== selectedUser.address) updateData.address = editFormData.address;
      if (editFormData.dateOfBirth !== (selectedUser.dateOfBirth ? selectedUser.dateOfBirth.split('T')[0] : "")) {
        updateData.dateOfBirth = editFormData.dateOfBirth;
      }
      if (editFormData.teamLead !== (selectedUser.teamLead?._id || selectedUser.teamLead)) {
        updateData.teamLead = editFormData.teamLead;
      }
      if (JSON.stringify(editFormData.emergencyContact) !== JSON.stringify({
        name: selectedUser.emergencyContact?.name || "",
        phone: selectedUser.emergencyContact?.phone || "",
        relationship: selectedUser.emergencyContact?.relationship || ""
      })) {
        updateData.emergencyContact = editFormData.emergencyContact;
      }
      if (JSON.stringify(editFormData.bankDetails) !== JSON.stringify({
        accountNumber: selectedUser.bankDetails?.accountNumber || "",
        bankName: selectedUser.bankDetails?.bankName || "",
        ifscCode: selectedUser.bankDetails?.ifscCode || ""
      })) {
        updateData.bankDetails = editFormData.bankDetails;
      }

      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to update");
        setShowEditModal(false);
        return;
      }

      await axios.put(`${BACKEND_URL}/api/auth/profile/${selectedUser._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("User updated successfully!");
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BACKEND_URL}/api/auth/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User role updated successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/api/auth/users/${userToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${userToDelete.name} has been deleted successfully!`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesSearch = searchTerm === "" || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    return matchesRole && matchesSearch;
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "#dc2626",
      hr: "#3b82f6",
      employer: "#f59e0b",
      manager: "#8b5cf6",
      employee: "#10b981"
    };
    return colors[role] || "#6b7280";
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading users...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="manage-users-container">
        <div className="page-header">
          <h2>👥 Manage All Users</h2>
          <div className="stats-badge">Total Users: {users.length}</div>
        </div>

        <div className="filters-section">
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-controls">
            <select
              className="role-filter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">📋 All Roles</option>
              <option value="admin">👑 Admin</option>
              <option value="hr">💼 HR</option>
              <option value="employer">🏢 Employer</option>
              <option value="manager">📊 Manager</option>
              <option value="employee">👤 Employee</option>
            </select>
            <button className="refresh-btn" onClick={fetchUsers}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Role</th>
                <th>Designation</th>
                <th>Team Lead</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <div>📭 No users found</div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Name" className="user-name">{user.name}</td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Phone">{user.phone || "—"}</td>
                    <td data-label="Gender">
                      {user.gender ? (
                        <span className="gender-badge">{user.gender.toUpperCase()}</span>
                      ) : "—"}
                    </td>
                    <td data-label="Role">
                      <select
                        className="role-select"
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                        style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                      >
                        <option value="admin">Admin</option>
                        <option value="hr">HR</option>
                        <option value="employer">Employer</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                      </select>
                    </td>
                    <td data-label="Designation">
                      {user.designation ? (
                        <span className="designation-badge">{user.designation}</span>
                      ) : "—"}
                    </td>
                    <td data-label="Team Lead">{user.teamLead?.name || user.teamLead || "—"}</td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        <button className="edit-action" onClick={() => handleEditClick(user)} title="Edit User">
                          ✏️
                        </button>
                        <button
                          className="delete-action"
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.role === "admin"}
                          title={user.role === "admin" ? "Cannot delete admin" : "Delete User"}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit User: {selectedUser?.name}</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <h4 className="section-title">Personal Information</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input type="text" name="name" value={editFormData.name} onChange={handleEditInputChange} required />
                  </div>
                  <div className="form-field">
                    <label>Email *</label>
                    <input type="email" name="email" value={editFormData.email} onChange={handleEditInputChange} required />
                  </div>
                  <div className="form-field">
                    <label>Phone</label>
                    <input type="tel" name="phone" value={editFormData.phone} onChange={handleEditInputChange} />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <select name="gender" value={editFormData.gender} onChange={handleEditInputChange}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={editFormData.dateOfBirth} onChange={handleEditInputChange} />
                  </div>
                  <div className="form-field full-width">
                    <label>Address</label>
                    <textarea name="address" value={editFormData.address} onChange={handleEditInputChange} rows="2" placeholder="Enter full address" />
                  </div>
                </div>

                <h4 className="section-title">Professional Information</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Role</label>
                    <select name="role" value={editFormData.role} onChange={handleEditInputChange}>
                      <option value="admin">Admin</option>
                      <option value="hr">HR</option>
                      <option value="employer">Employer</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>
                  {editFormData.role === "employee" && (
                    <>
                      <div className="form-field">
                        <label>Designation</label>
                        <select name="designation" value={editFormData.designation} onChange={handleEditInputChange}>
                          <option value="">Select Designation</option>
                          <option value="team lead">Team Lead</option>
                          <option value="L1">L1</option>
                          <option value="L2">L2</option>
                          <option value="FE">FE</option>
                        </select>
                      </div>
                      {editFormData.designation !== "team lead" && (
                        <div className="form-field">
                          <label>Team Lead</label>
                          <select name="teamLead" value={editFormData.teamLead} onChange={handleEditInputChange}>
                            <option value="">Select Team Lead</option>
                            {teamLeads.map(lead => (
                              <option key={lead._id} value={lead._id}>{lead.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <h4 className="section-title">Emergency Contact</h4>
                <div className="form-grid three-col">
                  <div className="form-field">
                    <label>Contact Name</label>
                    <input type="text" name="name" value={editFormData.emergencyContact.name} onChange={handleEmergencyContactChange} placeholder="Name" />
                  </div>
                  <div className="form-field">
                    <label>Contact Phone</label>
                    <input type="tel" name="phone" value={editFormData.emergencyContact.phone} onChange={handleEmergencyContactChange} placeholder="Phone" />
                  </div>
                  <div className="form-field">
                    <label>Relationship</label>
                    <input type="text" name="relationship" value={editFormData.emergencyContact.relationship} onChange={handleEmergencyContactChange} placeholder="e.g., Father, Mother" />
                  </div>
                </div>

                <h4 className="section-title">Bank Details</h4>
                <div className="form-grid three-col">
                  <div className="form-field">
                    <label>Account Number</label>
                    <input type="text" name="accountNumber" value={editFormData.bankDetails.accountNumber} onChange={handleBankDetailsChange} placeholder="Account number" />
                  </div>
                  <div className="form-field">
                    <label>Bank Name</label>
                    <input type="text" name="bankName" value={editFormData.bankDetails.bankName} onChange={handleBankDetailsChange} placeholder="Bank name" />
                  </div>
                  <div className="form-field">
                    <label>IFSC Code</label>
                    <input type="text" name="ifscCode" value={editFormData.bankDetails.ifscCode} onChange={handleBankDetailsChange} placeholder="IFSC code" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-modal-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="save-modal-btn">💾 Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <span>⚠️ Confirm Delete</span>
            </div>
            <div className="delete-modal-body">
              <p>Are you sure you want to delete <strong>{userToDelete?.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone!</p>
            </div>
            <div className="delete-modal-footer">
              <button className="cancel-delete-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleDeleteUser}>Delete User</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .manage-users-container {
          background: white;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .page-header h2 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b, #4f46e5);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .stats-badge {
          background: #f1f5f9;
          padding: 6px 14px;
          border-radius: 40px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #1e293b;
        }

        .filters-section {
          display: flex;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .search-wrapper {
          flex: 2;
          min-width: 200px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 40px;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .filter-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .role-filter {
          padding: 12px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 40px;
          background: white;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .refresh-btn {
          background: #f1f5f9;
          border: none;
          padding: 12px 24px;
          border-radius: 40px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: white;
        }

        .modern-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .modern-table thead tr {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }

        .modern-table th {
          text-align: left;
          padding: 14px 12px;
          font-weight: 600;
          color: #1e293b;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modern-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }

        .modern-table tbody tr:hover {
          background: #fefce8;
          transition: background 0.2s;
        }

        .user-name {
          font-weight: 500;
          color: #0f172a;
        }

        .gender-badge {
          background: #e2e8f0;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .role-select {
          border: none;
          padding: 4px 8px;
          border-radius: 20px;
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .role-select:hover {
          opacity: 0.85;
        }

        .designation-badge {
          background: #e0f2fe;
          color: #0284c7;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .edit-action, .delete-action {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .edit-action:hover {
          background: #e0e7ff;
          transform: scale(1.05);
        }

        .delete-action:hover:not(:disabled) {
          background: #fee2e2;
          transform: scale(1.05);
        }

        .delete-action:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 48px;
          color: #64748b;
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          animation: fadeIn 0.2s ease;
        }

        .modern-modal {
          background: white;
          border-radius: 32px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: slideUp 0.3s ease;
        }

        .delete-modal {
          background: white;
          border-radius: 28px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: slideUp 0.3s ease;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 28px;
          border-bottom: 2px solid #eef2ff;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
          background: linear-gradient(135deg, #1e293b, #4f46e5);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #94a3b8;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #1e293b;
        }

        .modal-body {
          padding: 28px;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          margin: 24px 0 16px 0;
          padding-left: 12px;
          border-left: 4px solid #10b981;
        }

        .section-title:first-of-type {
          margin-top: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .form-grid.three-col {
          grid-template-columns: repeat(3, 1fr);
        }

        .form-field.full-width {
          grid-column: span 2;
        }

        .form-field label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-field input, .form-field select, .form-field textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 28px;
          border-top: 1px solid #eef2ff;
        }

        .cancel-modal-btn, .cancel-delete-btn {
          background: #f1f5f9;
          border: none;
          padding: 10px 20px;
          border-radius: 40px;
          font-weight: 500;
          cursor: pointer;
        }

        .save-modal-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
        }

        .confirm-delete-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
        }

        .warning-text {
          color: #dc2626;
          font-size: 0.85rem;
          margin-top: 8px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .manage-users-container {
            padding: 16px;
          }
          .form-grid, .form-grid.three-col {
            grid-template-columns: 1fr;
          }
          .form-field.full-width {
            grid-column: span 1;
          }
          .modern-table thead {
            display: none;
          }
          .modern-table tbody tr {
            display: block;
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 12px;
          }
          .modern-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .modern-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #0f172a;
            width: 40%;
          }
          .modern-table td:last-child {
            border-bottom: none;
          }
          .action-buttons {
            justify-content: flex-end;
          }
        }
      `}</style>
    </>
  );
}

export default ManageUsers;