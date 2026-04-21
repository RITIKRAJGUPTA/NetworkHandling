import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL = 'http://localhost:5000';

export default function MyProfile({ userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    console.log("MyProfile mounted with userId:", userId);
    if (userId) {
      fetchProfile();
    } else {
      console.log("No userId provided");
      setLoading(false);
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = `${BACKEND_URL}/api/auth/profile/${userId}`;
      
      const response = await axios.get(apiUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Profile API Response:", response.data);
      setProfile(response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(error.response?.data?.message || "Failed to load profile");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [name]: value }
    }));
  };

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create update object with only fields that have changed
    const updateData = {};
    
    // Only include fields that exist and have changed
    if (formData.name !== profile.name) updateData.name = formData.name;
    if (formData.email !== profile.email) updateData.email = formData.email;
    if (formData.phone !== profile.phone) updateData.phone = formData.phone;
    if (formData.gender !== profile.gender) updateData.gender = formData.gender;
    if (formData.designation !== profile.designation) updateData.designation = formData.designation;
    if (formData.address !== profile.address) updateData.address = formData.address;
    if (formData.dateOfBirth !== profile.dateOfBirth) updateData.dateOfBirth = formData.dateOfBirth;
    
    // Check emergency contact changes
    if (JSON.stringify(formData.emergencyContact) !== JSON.stringify(profile.emergencyContact)) {
      updateData.emergencyContact = formData.emergencyContact;
    }
    
    // Check bank details changes
    if (JSON.stringify(formData.bankDetails) !== JSON.stringify(profile.bankDetails)) {
      updateData.bankDetails = formData.bankDetails;
    }
    
    // If no changes, show message and return
    if (Object.keys(updateData).length === 0) {
      toast.info("No changes to update");
      setEditing(false);
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${BACKEND_URL}/api/auth/profile/${userId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.user) {
        setProfile(response.data.user);
        setFormData(response.data.user);
      } else {
        // Fallback: fetch fresh profile data
        await fetchProfile();
      }
      
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <p>No profile data found</p>
        <button onClick={fetchProfile}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="my-profile-container">
        <div className="profile-header">
          <h2>My Profile</h2>
          {!editing && (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {!editing ? (
          // View Mode - Display all profile data
          <div className="profile-view">
            <div className="profile-info-grid">
              {/* Column 1 - Personal Information */}
              <div className="info-card">
                <h3 className="card-title">Personal Information</h3>
                
                <div className="info-group">
                  <label>FULL NAME:</label>
                  <p className="info-value">{profile.name || "Not provided"}</p>
                </div>
                
                <div className="info-group">
                  <label>EMAIL:</label>
                  <p className="info-value">{profile.email || "Not provided"}</p>
                </div>
                
                <div className="info-group">
                  <label>PHONE:</label>
                  <p className="info-value">{profile.phone || "Not provided"}</p>
                </div>
                
                <div className="info-group">
                  <label>GENDER:</label>
                  <p className="info-value">
                    {profile.gender ? profile.gender.toUpperCase() : "Not provided"}
                  </p>
                </div>
                
                <div className="info-group">
                  <label>DATE OF BIRTH:</label>
                  <p className="info-value">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not provided"}
                  </p>
                </div>
              </div>

              {/* Column 2 - Professional Information */}
              <div className="info-card">
                <h3 className="card-title">Professional Information</h3>
                
                <div className="info-group">
                  <label>ROLE:</label>
                  <p className="info-value">
                    <span className="role-badge">{profile.role?.toUpperCase() || "Not provided"}</span>
                  </p>
                </div>
                
                {profile.designation && (
                  <div className="info-group">
                    <label>DESIGNATION:</label>
                    <p className="info-value">{profile.designation}</p>
                  </div>
                )}
                
                {profile.teamLead && (
                  <div className="info-group">
                    <label>TEAM LEAD:</label>
                    <p className="info-value">{profile.teamLead.name || "Not assigned"}</p>
                  </div>
                )}
              </div>

              {/* Column 3 - Address */}
              <div className="info-card">
                <h3 className="card-title">Address</h3>
                <div className="info-group">
                  <label>ADDRESS:</label>
                  <p className="info-value">{profile.address || "Not provided"}</p>
                </div>
              </div>

              {/* Column 4 - Emergency Contact */}
              <div className="info-card">
                <h3 className="card-title">Emergency Contact</h3>
                
                <div className="info-group">
                  <label>CONTACT NAME:</label>
                  <p className="info-value">{profile.emergencyContact?.name || "Not provided"}</p>
                </div>
                
                <div className="info-group">
                  <label>CONTACT PHONE:</label>
                  <p className="info-value">{profile.emergencyContact?.phone || "Not provided"}</p>
                </div>
                
                <div className="info-group">
                  <label>RELATIONSHIP:</label>
                  <p className="info-value">{profile.emergencyContact?.relationship || "Not provided"}</p>
                </div>
              </div>

              {/* Column 5 - Bank Details */}
              <div className="info-card">
                <h3 className="card-title">Bank Details</h3>
                
                <div className="info-group">
                  <label>ACCOUNT NUMBER:</label>
                  <p className="info-value">{profile.bankDetails?.accountNumber || "Not provided"}</p>
                </div>
                
                <div className="info-group">
                  <label>BANK NAME:</label>
                  <p className="info-value">{profile.bankDetails?.bankName || "Not provided"}</p>
                </div>
                
                <div className="info-group">
                  <label>IFSC CODE:</label>
                  <p className="info-value">{profile.bankDetails?.ifscCode || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode Form - All fields
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <h3 className="form-section-title">Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender || ""} onChange={handleInputChange}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ""}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation || ""}
                  onChange={handleInputChange}
                  placeholder="Enter designation"
                  disabled={profile.role !== "employee"} // Only employees can change designation
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  placeholder="Enter your full address"
                  rows="3"
                />
              </div>
            </div>

            <h3 className="form-section-title">Emergency Contact</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Contact Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.emergencyContact?.name || ""}
                  onChange={handleEmergencyContactChange}
                  placeholder="Emergency contact name"
                />
              </div>
              
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.emergencyContact?.phone || ""}
                  onChange={handleEmergencyContactChange}
                  placeholder="Emergency contact phone"
                />
              </div>
              
              <div className="form-group">
                <label>Relationship</label>
                <input
                  type="text"
                  name="relationship"
                  value={formData.emergencyContact?.relationship || ""}
                  onChange={handleEmergencyContactChange}
                  placeholder="e.g., Father, Mother, Spouse"
                />
              </div>
            </div>

            <h3 className="form-section-title">Bank Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.bankDetails?.accountNumber || ""}
                  onChange={handleBankDetailsChange}
                  placeholder="Bank account number"
                />
              </div>
              
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankDetails?.bankName || ""}
                  onChange={handleBankDetailsChange}
                  placeholder="Bank name"
                />
              </div>
              
              <div className="form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.bankDetails?.ifscCode || ""}
                  onChange={handleBankDetailsChange}
                  placeholder="IFSC code"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">💾 Save Changes</button>
              <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>
                ❌ Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .my-profile-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }

        .profile-header h2 {
          margin: 0;
          color: #1a1a2e;
          font-size: 24px;
          font-weight: 600;
        }

        .edit-btn {
          background: #198754;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .edit-btn:hover {
          background: #157347;
        }

        .profile-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
        }

        .info-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .info-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .card-title {
          margin: 0 0 16px 0;
          color: #198754;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 2px solid #198754;
          padding-bottom: 8px;
        }

        .info-group {
          margin-bottom: 16px;
        }

        .info-group label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #6c757d;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          margin: 0;
          font-size: 14px;
          color: #212529;
          font-weight: 500;
          line-height: 1.5;
        }

        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          background: linear-gradient(135deg, #198754 0%, #20c997 100%);
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        /* Edit Form Styles */
        .profile-edit-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .form-section-title {
          color: #198754;
          font-size: 18px;
          margin: 24px 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #198754;
        }

        .form-section-title:first-of-type {
          margin-top: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: span 2;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #495057;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group input:disabled {
          background-color: #e9ecef;
          cursor: not-allowed;
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #198754;
          box-shadow: 0 0 0 3px rgba(25, 135, 84, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          justify-content: flex-end;
        }

        .save-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .save-btn:hover {
          background: #218838;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        .profile-loading {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }

        .profile-error {
          text-align: center;
          padding: 40px;
          color: #dc3545;
          background: #f8d7da;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .form-group.full-width {
            grid-column: span 1;
          }
          
          .profile-info-grid {
            grid-template-columns: 1fr;
          }
          
          .profile-header {
            flex-direction: column;
            gap: 16px;
          }
          
          .edit-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}