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
    
    if (formData.name !== profile.name) updateData.name = formData.name;
    if (formData.email !== profile.email) updateData.email = formData.email;
    if (formData.phone !== profile.phone) updateData.phone = formData.phone;
    if (formData.gender !== profile.gender) updateData.gender = formData.gender;
    if (formData.designation !== profile.designation) updateData.designation = formData.designation;
    if (formData.address !== profile.address) updateData.address = formData.address;
    if (formData.dateOfBirth !== profile.dateOfBirth) updateData.dateOfBirth = formData.dateOfBirth;
    
    if (JSON.stringify(formData.emergencyContact) !== JSON.stringify(profile.emergencyContact)) {
      updateData.emergencyContact = formData.emergencyContact;
    }
    
    if (JSON.stringify(formData.bankDetails) !== JSON.stringify(profile.bankDetails)) {
      updateData.bankDetails = formData.bankDetails;
    }
    
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
      <ToastContainer position="top-right" autoClose={3000} />
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
          <div className="profile-view">
            <div className="profile-info-grid">
              {/* Personal Information */}
              <div className="info-card">
                <h3 className="card-title">👤 Personal Information</h3>
                <div className="info-group"><label>FULL NAME</label><p>{profile.name || "Not provided"}</p></div>
                <div className="info-group"><label>EMAIL</label><p>{profile.email || "Not provided"}</p></div>
                <div className="info-group"><label>PHONE</label><p>{profile.phone || "Not provided"}</p></div>
                <div className="info-group"><label>GENDER</label><p>{profile.gender ? profile.gender.toUpperCase() : "Not provided"}</p></div>
                <div className="info-group"><label>DATE OF BIRTH</label><p>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not provided"}</p></div>
              </div>

              {/* Professional Information */}
              <div className="info-card">
                <h3 className="card-title">💼 Professional Information</h3>
                <div className="info-group"><label>ROLE</label><p><span className="role-badge">{profile.role?.toUpperCase() || "Not provided"}</span></p></div>
                {profile.designation && <div className="info-group"><label>DESIGNATION</label><p>{profile.designation}</p></div>}
                {profile.teamLead && <div className="info-group"><label>MANAGER / TEAM LEAD</label><p>{profile.teamLead.name || "Not assigned"}</p></div>}
              </div>

              {/* Address */}
              <div className="info-card">
                <h3 className="card-title">📍 Address</h3>
                <div className="info-group"><label>ADDRESS</label><p>{profile.address || "Not provided"}</p></div>
              </div>

              {/* Emergency Contact */}
              <div className="info-card">
                <h3 className="card-title">🚨 Emergency Contact</h3>
                <div className="info-group"><label>NAME</label><p>{profile.emergencyContact?.name || "Not provided"}</p></div>
                <div className="info-group"><label>PHONE</label><p>{profile.emergencyContact?.phone || "Not provided"}</p></div>
                <div className="info-group"><label>RELATIONSHIP</label><p>{profile.emergencyContact?.relationship || "Not provided"}</p></div>
              </div>

              {/* Bank Details */}
              <div className="info-card">
                <h3 className="card-title">🏦 Bank Details</h3>
                <div className="info-group"><label>ACCOUNT NUMBER</label><p>{profile.bankDetails?.accountNumber || "Not provided"}</p></div>
                <div className="info-group"><label>BANK NAME</label><p>{profile.bankDetails?.bankName || "Not provided"}</p></div>
                <div className="info-group"><label>IFSC CODE</label><p>{profile.bankDetails?.ifscCode || "Not provided"}</p></div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <h3 className="form-section-title">Personal Information</h3>
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input type="text" name="name" value={formData.name || ""} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Email *</label><input type="email" name="email" value={formData.email || ""} onChange={handleInputChange} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input type="tel" name="phone" value={formData.phone || ""} onChange={handleInputChange} placeholder="Enter phone number" /></div>
              <div className="form-group"><label>Gender</label><select name="gender" value={formData.gender || ""} onChange={handleInputChange}>
                <option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ""} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Designation</label><input type="text" name="designation" value={formData.designation || ""} onChange={handleInputChange} placeholder="Enter designation" disabled={profile.role !== "employee"} /></div>
            </div>
            <div className="form-row">
              <div className="form-group full-width"><label>Address</label><textarea name="address" value={formData.address || ""} onChange={handleInputChange} placeholder="Enter your full address" rows="3" /></div>
            </div>

            <h3 className="form-section-title">Emergency Contact</h3>
            <div className="form-row">
              <div className="form-group"><label>Contact Name</label><input type="text" name="name" value={formData.emergencyContact?.name || ""} onChange={handleEmergencyContactChange} placeholder="Emergency contact name" /></div>
              <div className="form-group"><label>Contact Phone</label><input type="tel" name="phone" value={formData.emergencyContact?.phone || ""} onChange={handleEmergencyContactChange} placeholder="Emergency contact phone" /></div>
              <div className="form-group"><label>Relationship</label><input type="text" name="relationship" value={formData.emergencyContact?.relationship || ""} onChange={handleEmergencyContactChange} placeholder="e.g., Father, Mother, Spouse" /></div>
            </div>

            <h3 className="form-section-title">Bank Details</h3>
            <div className="form-row">
              <div className="form-group"><label>Account Number</label><input type="text" name="accountNumber" value={formData.bankDetails?.accountNumber || ""} onChange={handleBankDetailsChange} placeholder="Bank account number" /></div>
              <div className="form-group"><label>Bank Name</label><input type="text" name="bankName" value={formData.bankDetails?.bankName || ""} onChange={handleBankDetailsChange} placeholder="Bank name" /></div>
              <div className="form-group"><label>IFSC Code</label><input type="text" name="ifscCode" value={formData.bankDetails?.ifscCode || ""} onChange={handleBankDetailsChange} placeholder="IFSC code" /></div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">💾 Save Changes</button>
              <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>❌ Cancel</button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .my-profile-container {
          background: white;
          border-radius: 24px;
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
          transition: all 0.3s ease;
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eef2ff;
        }

        .profile-header h2 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b, #4f46e5);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .edit-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .edit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        .profile-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .info-card {
          background: #f8fafc;
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
        }

        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.15);
          border-color: #cbd5e1;
        }

        .card-title {
          margin: 0 0 20px 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #0f172a;
          border-left: 4px solid #10b981;
          padding-left: 12px;
        }

        .info-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }

        .info-group label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .info-group p {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          color: #1e293b;
          word-break: break-word;
        }

        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          border-radius: 40px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Edit Form Styles */
        .profile-edit-form {
          max-width: 900px;
          margin: 0 auto;
        }

        .form-section-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #0f172a;
          margin: 28px 0 20px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }

        .form-section-title:first-of-type {
          margin-top: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
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
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 0.9rem;
          font-family: inherit;
          transition: all 0.2s ease;
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .form-group input:disabled {
          background-color: #f1f5f9;
          cursor: not-allowed;
          color: #64748b;
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 32px;
          justify-content: flex-end;
        }

        .save-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .save-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(16, 185, 129, 0.4);
        }

        .cancel-btn {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 12px 28px;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover {
          background: #e2e8f0;
        }

        .profile-loading {
          text-align: center;
          padding: 48px;
          color: #64748b;
          font-size: 1rem;
        }

        .profile-error {
          text-align: center;
          padding: 48px;
          background: #fef2f2;
          border-radius: 24px;
          color: #dc2626;
        }
        
        .profile-error button {
          margin-top: 16px;
          padding: 8px 20px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 40px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .my-profile-container {
            padding: 20px;
          }
          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
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
            align-items: stretch;
            text-align: center;
          }
          .edit-btn {
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}