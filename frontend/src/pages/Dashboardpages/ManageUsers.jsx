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
      
      // Basic fields
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
      
      // Team lead
      if (editFormData.teamLead !== (selectedUser.teamLead?._id || selectedUser.teamLead)) {
        updateData.teamLead = editFormData.teamLead;
      }
      
      // Emergency contact
      if (JSON.stringify(editFormData.emergencyContact) !== JSON.stringify({
        name: selectedUser.emergencyContact?.name || "",
        phone: selectedUser.emergencyContact?.phone || "",
        relationship: selectedUser.emergencyContact?.relationship || ""
      })) {
        updateData.emergencyContact = editFormData.emergencyContact;
      }
      
      // Bank details
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
      admin: "danger",
      hr: "info",
      employer: "warning",
      manager: "primary",
      employee: "success"
    };
    return colors[role] || "secondary";
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
      <ToastContainer />
      <div className="manage-users-container">
        <div className="manage-users-header">
          <h3 className="mb-2">
            <i className="bi bi-people-fill"></i> Manage All Users
          </h3>
          <p className="text-muted">Total Users: {users.length}</p>
        </div>

        <div className="filters-section mb-4">
          <div className="row g-3">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="employer">Employer</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-primary w-100" onClick={fetchUsers}>
                <i className="bi bi-arrow-repeat"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="table-dark">
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "15%" }}>Name</th>
                <th style={{ width: "20%" }}>Email</th>
                <th style={{ width: "12%" }}>Phone</th>
                <th style={{ width: "8%" }}>Gender</th>
                <th style={{ width: "10%" }}>Role</th>
                <th style={{ width: "10%" }}>Designation</th>
                <th style={{ width: "12%" }}>Team Lead</th>
                <th style={{ width: "8%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-inbox" style={{ fontSize: "48px" }}></i>
                      <p className="mt-2">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <strong>{user.name}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || "—"}</td>
                    <td className="text-center">
                      {user.gender ? (
                        <span className="badge bg-secondary">
                          {user.gender.toUpperCase()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                        style={{ 
                          backgroundColor: `var(--bs-${getRoleBadgeColor(user.role)})`,
                          color: 'white',
                          fontWeight: 'bold',
                          border: 'none'
                        }}
                      >
                        <option value="admin" style={{ backgroundColor: 'white', color: 'black' }}>Admin</option>
                        <option value="hr" style={{ backgroundColor: 'white', color: 'black' }}>HR</option>
                        <option value="employer" style={{ backgroundColor: 'white', color: 'black' }}>Employer</option>
                        <option value="manager" style={{ backgroundColor: 'white', color: 'black' }}>Manager</option>
                        <option value="employee" style={{ backgroundColor: 'white', color: 'black' }}>Employee</option>
                      </select>
                    </td>
                    <td>
                      {user.designation ? (
                        <span className="badge bg-info text-dark">
                          {user.designation}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {user.teamLead?.name || user.teamLead || "—"}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleEditClick(user)}
                          title="Edit User"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteClick(user)}
                          title="Delete User"
                          disabled={user.role === "admin"}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit User: {selectedUser?.name}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleUpdateUser}>
                  <div className="modal-body">
                    {/* Personal Information */}
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
                        <label className="form-label">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control"
                          name="dateOfBirth"
                          value={editFormData.dateOfBirth}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
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

                    {/* Professional Information */}
                    <h6 className="mb-3 text-primary mt-3">Professional Information</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Role</label>
                        <select
                          className="form-select"
                          name="role"
                          value={editFormData.role}
                          onChange={handleEditInputChange}
                        >
                          <option value="admin">Admin</option>
                          <option value="hr">HR</option>
                          <option value="employer">Employer</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                        </select>
                      </div>
                      {editFormData.role === "employee" && (
                        <>
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
                              <option value="L1">L1</option>
                              <option value="L2">L2</option>
                              <option value="FE">FE</option>
                            </select>
                          </div>
                          {editFormData.designation !== "team lead" && (
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Team Lead</label>
                              <select
                                className="form-select"
                                name="teamLead"
                                value={editFormData.teamLead}
                                onChange={handleEditInputChange}
                              >
                                <option value="">Select Team Lead</option>
                                {teamLeads.map(lead => (
                                  <option key={lead._id} value={lead._id}>
                                    {lead.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Emergency Contact */}
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

                    {/* Bank Details */}
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
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDeleteConfirm(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete <strong>{userToDelete?.name}</strong>?</p>
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
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .manage-users-container {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .manage-users-header {
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }

          .manage-users-header h3 {
            color: #1a1a2e;
            font-weight: 600;
          }

          .table {
            margin-bottom: 0;
            font-size: 14px;
          }

          .table th {
            background-color: #212529;
            color: white;
            font-weight: 600;
            border: none;
            vertical-align: middle;
          }

          .table td {
            vertical-align: middle;
            padding: 12px;
          }

          .table-hover tbody tr:hover {
            background-color: #f8f9fa;
          }

          .badge {
            font-weight: 500;
            padding: 6px 12px;
            border-radius: 6px;
          }

          .btn-group {
            gap: 5px;
          }

          .form-select-sm {
            font-size: 12px;
            padding: 4px 8px;
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
            .manage-users-container {
              padding: 16px;
            }
            
            .table {
              font-size: 12px;
            }
            
            .table td, .table th {
              padding: 8px;
            }
            
            .btn-group .btn {
              padding: 4px 8px;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default ManageUsers;