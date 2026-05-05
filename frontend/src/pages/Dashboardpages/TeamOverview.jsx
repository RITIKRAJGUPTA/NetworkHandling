import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL = 'http://localhost:5000';

function TeamOverview() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filterDesignation, setFilterDesignation] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    designation: "",
    address: "",
    dateOfBirth: "",
    emergencyContact: { name: "", phone: "", relationship: "" },
    bankDetails: { accountNumber: "", bankName: "", ifscCode: "" }
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentUserId = localStorage.getItem("userId");
      const response = await axios.get(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filteredMembers = response.data.filter(user => 
        user.role !== "admin" && user.role !== "hr" && user._id !== currentUserId
      );
      setTeamMembers(filteredMembers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error(error.response?.data?.message || "Failed to fetch team members");
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      gender: user.gender || "",
      designation: user.designation || "",
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
      if (editFormData.designation !== selectedUser.designation) updateData.designation = editFormData.designation;
      if (editFormData.address !== selectedUser.address) updateData.address = editFormData.address;
      if (editFormData.dateOfBirth !== (selectedUser.dateOfBirth ? selectedUser.dateOfBirth.split('T')[0] : "")) {
        updateData.dateOfBirth = editFormData.dateOfBirth;
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
      toast.success("Team member updated successfully!");
      setShowEditModal(false);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Failed to update team member");
    }
  };

  const handleDeleteClick = (user) => {
    if (user.role === "admin" || user.role === "hr") {
      toast.error("You cannot delete Admin or HR users");
      return;
    }
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/api/auth/users/${userToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${userToDelete.name} has been removed from the team!`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to remove team member");
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesDesignation = filterDesignation === "all" || member.designation === filterDesignation;
    const matchesSearch = searchTerm === "" || 
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm) ||
      member.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDesignation && matchesSearch;
  });

  const getDesignationBadgeColor = (designation) => {
    const colors = {
      "team lead": "danger",
      "L1": "info",
      "L2": "primary",
      "FE": "success"
    };
    return colors[designation] || "secondary";
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      manager: "warning",
      employee: "success",
      employer: "info"
    };
    return colors[role] || "secondary";
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading team members...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="team-overview-container">
        <div className="team-header">
          <div>
            <h3 className="mb-2">👥 Team Overview</h3>
            <p className="text-muted">Manage your team members</p>
          </div>
          <div className="team-stats">
            <div className="stat-badge">
              <span className="stat-number">{teamMembers.length}</span>
              <span className="stat-label">Total Members</span>
            </div>
          </div>
        </div>

        <div className="filters-section mb-4">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search by name, email, phone or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="role-filter"
                value={filterDesignation}
                onChange={(e) => setFilterDesignation(e.target.value)}
              >
                <option value="all">All Designations</option>
                <option value="team lead">Team Lead</option>
                <option value="L1">L1 Developer</option>
                <option value="L2">L2 Developer</option>
                <option value="FE">Frontend Engineer</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="refresh-btn w-100" onClick={fetchTeamMembers}>
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Designation</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr><td colSpan="7" className="empty-state"><div>📭 No team members found</div></td></tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr key={member._id}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Name" className="user-name">{member.name}</td>
                    <td data-label="Email">{member.email}</td>
                    <td data-label="Phone">{member.phone || "—"}</td>
                    <td data-label="Designation">{member.designation ? <span className={`designation-badge bg-${getDesignationBadgeColor(member.designation)}`}>{member.designation.toUpperCase()}</span> : "—"}</td>
                    <td data-label="Status"><span className="status-badge active">Active</span></td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        <button className="edit-action" onClick={() => handleEditClick(member)} title="Edit Member">✏️</button>
                        <button className="delete-action" onClick={() => handleDeleteClick(member)} title="Remove Member">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h3>✏️ Edit Team Member: {selectedUser?.name}</h3><button className="close-btn" onClick={() => setShowEditModal(false)}>×</button></div>
              <form onSubmit={handleUpdateUser}>
                <div className="modal-body">
                  <h4 className="section-title">Personal Information</h4>
                  <div className="form-grid">
                    <div className="form-field"><label>Full Name *</label><input type="text" name="name" value={editFormData.name} onChange={handleEditInputChange} required /></div>
                    <div className="form-field"><label>Email *</label><input type="email" name="email" value={editFormData.email} onChange={handleEditInputChange} required /></div>
                    <div className="form-field"><label>Phone</label><input type="tel" name="phone" value={editFormData.phone} onChange={handleEditInputChange} /></div>
                    <div className="form-field"><label>Gender</label><select name="gender" value={editFormData.gender} onChange={handleEditInputChange}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                    <div className="form-field"><label>Designation</label><select name="designation" value={editFormData.designation} onChange={handleEditInputChange}><option value="">Select</option><option value="team lead">Team Lead</option><option value="L1">L1 Developer</option><option value="L2">L2 Developer</option><option value="FE">Frontend Engineer</option></select></div>
                    <div className="form-field"><label>Date of Birth</label><input type="date" name="dateOfBirth" value={editFormData.dateOfBirth} onChange={handleEditInputChange} /></div>
                    <div className="form-field full-width"><label>Address</label><textarea name="address" value={editFormData.address} onChange={handleEditInputChange} rows="2" /></div>
                  </div>
                  <h4 className="section-title">Emergency Contact</h4>
                  <div className="form-grid three-col">
                    <div className="form-field"><label>Name</label><input type="text" name="name" value={editFormData.emergencyContact.name} onChange={handleEmergencyContactChange} /></div>
                    <div className="form-field"><label>Phone</label><input type="tel" name="phone" value={editFormData.emergencyContact.phone} onChange={handleEmergencyContactChange} /></div>
                    <div className="form-field"><label>Relationship</label><input type="text" name="relationship" value={editFormData.emergencyContact.relationship} onChange={handleEmergencyContactChange} /></div>
                  </div>
                  <h4 className="section-title">Bank Details</h4>
                  <div className="form-grid three-col">
                    <div className="form-field"><label>Account Number</label><input type="text" name="accountNumber" value={editFormData.bankDetails.accountNumber} onChange={handleBankDetailsChange} /></div>
                    <div className="form-field"><label>Bank Name</label><input type="text" name="bankName" value={editFormData.bankDetails.bankName} onChange={handleBankDetailsChange} /></div>
                    <div className="form-field"><label>IFSC Code</label><input type="text" name="ifscCode" value={editFormData.bankDetails.ifscCode} onChange={handleBankDetailsChange} /></div>
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

        {/* Delete Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header"><span>⚠️ Confirm Remove</span></div>
              <div className="delete-modal-body"><p>Are you sure you want to remove <strong>{userToDelete?.name}</strong> from the team?</p><p className="warning-text">This action cannot be undone!</p></div>
              <div className="delete-modal-footer">
                <button className="cancel-delete-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="confirm-delete-btn" onClick={handleDeleteUser}>Remove Member</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .team-overview-container {
          background: rgba(15, 25, 45, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 28px;
          padding: 28px;
          border: 1px solid rgba(0, 212, 255, 0.2);
        }
        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0,212,255,0.3);
          padding-bottom: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .team-header h3 {
          margin: 0;
          background: linear-gradient(135deg, #ffffff, #00d4ff);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .text-muted { color: #9aa4bf !important; }
        .stat-badge {
          background: rgba(0,212,255,0.15);
          padding: 8px 20px;
          border-radius: 40px;
          text-align: center;
          border: 1px solid rgba(0,212,255,0.3);
        }
        .stat-number { font-size: 1.8rem; font-weight: 700; color: #00d4ff; display: block; }
        .stat-label { font-size: 0.7rem; color: #b0bedb; text-transform: uppercase; }
        .search-input, .role-filter {
          width: 100%;
          padding: 12px 16px;
          background: rgba(0,0,0,0.4);
          border: 1px solid #2a3a55;
          border-radius: 40px;
          color: #fff;
          font-size: 0.9rem;
          transition: 0.2s;
        }
        .search-input:focus, .role-filter:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }
        .refresh-btn {
          background: rgba(0,212,255,0.15);
          border: 1px solid rgba(0,212,255,0.3);
          padding: 12px;
          border-radius: 40px;
          color: #00d4ff;
          font-weight: 500;
          cursor: pointer;
        }
        .refresh-btn:hover { background: rgba(0,212,255,0.25); }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 20px;
          border: 1px solid #2a3a55;
          background: rgba(10,18,32,0.5);
        }
        .modern-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .modern-table th {
          text-align: left;
          padding: 14px 12px;
          color: #00d4ff;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #2a3a55;
        }
        .modern-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #1e2a3a;
          color: #cbd5e1;
          vertical-align: middle;
        }
        .modern-table tbody tr:hover { background: rgba(0,212,255,0.05); }
        .user-name { font-weight: 500; color: #fff; }
        .designation-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; }
        .bg-danger { background: #ef4444; color: white; }
        .bg-info { background: #3b82f6; color: white; }
        .bg-primary { background: #8b5cf6; color: white; }
        .bg-success { background: #10b981; color: white; }
        .bg-warning { background: #f59e0b; color: white; }
        .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; background: rgba(16,185,129,0.2); color: #10b981; }
        .action-buttons { display: flex; gap: 8px; }
        .edit-action, .delete-action {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: 0.2s;
        }
        .edit-action:hover { background: rgba(0,212,255,0.15); transform: scale(1.05); }
        .delete-action:hover { background: rgba(239,68,68,0.2); transform: scale(1.05); }
        .empty-state { text-align: center; padding: 48px; color: #7f8fa4; }
        /* Modals */
        .modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1050;
        }
        .modern-modal, .delete-modal {
          background: #0f172a;
          border-radius: 32px;
          border: 1px solid rgba(0,212,255,0.3);
        }
        .modern-modal { width: 90%; max-width: 800px; max-height: 85vh; overflow-y: auto; }
        .delete-modal { width: 90%; max-width: 450px; }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 28px; border-bottom: 1px solid #2a3a55;
        }
        .modal-header h3 { margin: 0; font-size: 1.3rem; color: #00d4ff; }
        .close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: #94a3b8; }
        .close-btn:hover { color: #00d4ff; }
        .modal-body { padding: 28px; }
        .section-title {
          font-size: 1rem; font-weight: 600; color: #00d4ff;
          margin: 24px 0 16px 0; padding-left: 12px; border-left: 4px solid #00d4ff;
        }
        .section-title:first-of-type { margin-top: 0; }
        .form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
        .form-grid.three-col { grid-template-columns: repeat(3,1fr); }
        .form-field.full-width { grid-column: span 2; }
        .form-field label {
          display: block; font-size: 0.7rem; font-weight: 600;
          color: #b0bedb; margin-bottom: 6px; text-transform: uppercase;
        }
        .form-field input, .form-field select, .form-field textarea {
          width: 100%; padding: 10px 12px;
          background: rgba(0,0,0,0.4); border: 1px solid #2a3a55;
          border-radius: 20px; color: #fff; font-size: 0.9rem;
          transition: 0.2s;
        }
        .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
          outline: none; border-color: #00d4ff; box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 12px;
          padding: 20px 28px; border-top: 1px solid #2a3a55;
        }
        .cancel-modal-btn, .cancel-delete-btn {
          background: #1e293b; border: none; padding: 10px 20px;
          border-radius: 40px; color: #cbd5e1; cursor: pointer;
        }
        .save-modal-btn {
          background: linear-gradient(90deg, #00b4d8, #0077b6);
          color: white; border: none; padding: 10px 24px;
          border-radius: 40px; font-weight: 600; cursor: pointer;
        }
        .confirm-delete-btn {
          background: #dc2626; border: none; padding: 10px 20px;
          border-radius: 40px; color: white; font-weight: 600; cursor: pointer;
        }
        .warning-text { color: #ef4444; font-size: 0.85rem; margin-top: 8px; }
        @media (max-width: 768px) {
          .team-overview-container { padding: 16px; }
          .form-grid, .form-grid.three-col { grid-template-columns: 1fr; }
          .form-field.full-width { grid-column: span 1; }
          .modern-table thead { display: none; }
          .modern-table tbody tr {
            display: block; margin-bottom: 16px; border: 1px solid #2a3a55; border-radius: 16px; padding: 12px;
          }
          .modern-table td {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 12px; border-bottom: 1px solid #1e2a3a;
          }
          .modern-table td::before {
            content: attr(data-label); font-weight: 600; color: #00d4ff; width: 40%;
          }
          .action-buttons { justify-content: flex-end; }
        }
      `}</style>
    </>
  );
}

export default TeamOverview;