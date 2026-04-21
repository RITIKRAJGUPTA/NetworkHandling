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

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentUserId = localStorage.getItem("userId");
      
      // Fetch all users
      const response = await axios.get(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter out admin and HR users, and exclude the current manager
      const filteredMembers = response.data.filter(user => 
        user.role !== "admin" && 
        user.role !== "hr" && 
        user._id !== currentUserId
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
    // Prevent deleting admin or HR (extra safety check)
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
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading team members...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="team-overview-container">
        <div className="team-header">
          <div>
            <h3 className="mb-2">
              <i className="bi bi-people-fill"></i> Team Overview
            </h3>
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
                className="form-control"
                placeholder="🔍 Search by name, email, phone or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
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
              <button className="btn btn-outline-primary w-100" onClick={fetchTeamMembers}>
                <i className="bi bi-arrow-repeat"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "15%" }}>Name</th>
                <th style={{ width: "20%" }}>Email</th>
                <th style={{ width: "12%" }}>Phone</th>
                <th style={{ width: "12%" }}>Designation</th>
                <th style={{ width: "8%" }}>Status</th>
                <th style={{ width: "18%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-inbox" style={{ fontSize: "48px" }}></i>
                      <p className="mt-2">No team members found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr key={member._id}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <strong>{member.name}</strong>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.phone || "—"}</td>
                    <td>
                      <span className={`badge bg-${getRoleBadgeColor(member.role)}`}>
                        {member.role?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {member.designation ? (
                        <span className={`badge bg-${getDesignationBadgeColor(member.designation)}`}>
                          {member.designation.toUpperCase()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className="badge bg-success">Active</span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleEditClick(member)}
                          title="Edit Member"
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteClick(member)}
                          title="Remove Member"
                        >
                          <i className="bi bi-person-x"></i> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Team Member Modal */}
        {showEditModal && selectedUser && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Team Member: {selectedUser?.name}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleUpdateUser}>
                  <div className="modal-body">
                    <h6 className="mb-3 text-primary">Personal Information</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={editFormData.email}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          name="phone"
                          value={editFormData.phone}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Gender</label>
                        <select
                          className="form-select"
                          name="gender"
                          value={editFormData.gender}
                          onChange={handleEditInputChange}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Designation</label>
                        <select
                          className="form-select"
                          name="designation"
                          value={editFormData.designation}
                          onChange={handleEditInputChange}
                        >
                          <option value="">Select Designation</option>
                          <option value="team lead">Team Lead</option>
                          <option value="L1">L1 Developer</option>
                          <option value="L2">L2 Developer</option>
                          <option value="FE">Frontend Engineer</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control"
                          name="dateOfBirth"
                          value={editFormData.dateOfBirth}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Address</label>
                        <textarea
                          className="form-control"
                          name="address"
                          value={editFormData.address}
                          onChange={handleEditInputChange}
                          rows="2"
                          placeholder="Enter full address"
                        ></textarea>
                      </div>
                    </div>

                    <h6 className="mb-3 text-primary mt-3">Emergency Contact</h6>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Contact Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={editFormData.emergencyContact.name}
                          onChange={handleEmergencyContactChange}
                          placeholder="Emergency contact name"
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Contact Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          name="phone"
                          value={editFormData.emergencyContact.phone}
                          onChange={handleEmergencyContactChange}
                          placeholder="Emergency contact phone"
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Relationship</label>
                        <input
                          type="text"
                          className="form-control"
                          name="relationship"
                          value={editFormData.emergencyContact.relationship}
                          onChange={handleEmergencyContactChange}
                          placeholder="e.g., Father, Mother, Spouse"
                        />
                      </div>
                    </div>

                    <h6 className="mb-3 text-primary mt-3">Bank Details</h6>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Account Number</label>
                        <input
                          type="text"
                          className="form-control"
                          name="accountNumber"
                          value={editFormData.bankDetails.accountNumber}
                          onChange={handleBankDetailsChange}
                          placeholder="Bank account number"
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Bank Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="bankName"
                          value={editFormData.bankDetails.bankName}
                          onChange={handleBankDetailsChange}
                          placeholder="Bank name"
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">IFSC Code</label>
                        <input
                          type="text"
                          className="form-control"
                          name="ifscCode"
                          value={editFormData.bankDetails.ifscCode}
                          onChange={handleBankDetailsChange}
                          placeholder="IFSC code"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Remove</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDeleteConfirm(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to remove <strong>{userToDelete?.name}</strong> from the team?</p>
                  <p className="text-danger">This action cannot be undone!</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteUser}
                  >
                    Remove Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .team-overview-container {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .team-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }

          .team-header h3 {
            margin: 0;
            color: #1a1a2e;
            font-weight: 600;
          }

          .team-stats {
            display: flex;
            gap: 15px;
          }

          .stat-badge {
            background: linear-gradient(135deg, #198754 0%, #20c997 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            text-align: center;
          }

          .stat-number {
            font-size: 24px;
            font-weight: bold;
            display: block;
          }

          .stat-label {
            font-size: 12px;
            opacity: 0.9;
          }

          .table th {
            background-color: #f8f9fa;
            font-weight: 600;
            border-top: none;
          }

          .table td {
            vertical-align: middle;
          }

          .badge {
            font-weight: 500;
            padding: 5px 10px;
            border-radius: 6px;
          }

          .btn-group {
            gap: 5px;
          }

          .modal.show {
            display: block;
            z-index: 1050;
          }

          h6.text-primary {
            font-weight: 600;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 8px;
          }

          @media (max-width: 768px) {
            .team-overview-container {
              padding: 16px;
            }

            .team-header {
              flex-direction: column;
              gap: 15px;
              text-align: center;
            }

            .table {
              font-size: 12px;
            }

            .table td, .table th {
              padding: 8px;
            }

            .btn-group {
              flex-direction: column;
              gap: 5px;
            }

            .btn-group .btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default TeamOverview;