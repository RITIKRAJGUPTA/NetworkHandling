import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    role: "",
    designation: "",
    teamLead: "",
    password: "",
  });

  const [teamLeads, setTeamLeads] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  // Fetch team leads or managers based on role & designation
  useEffect(() => {
    if (data.role === "employee" && data.designation) {
      if (data.designation === "team lead") {
        // Fetch managers (for team leads)
        axios
          .get("http://localhost:5000/api/auth/managers")
          .then((res) => setManagers(res.data))
          .catch((err) => console.log(err));
      } else {
        // Fetch team leads (for regular employees)
        axios
          .get("http://localhost:5000/api/auth/team-leads")
          .then((res) => setTeamLeads(res.data))
          .catch((err) => console.log(err));
      }
    }
  }, [data.role, data.designation]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !data.name ||
      !data.email ||
      !data.phone ||
      !data.gender ||
      !data.role ||
      !data.password
    ) {
      alert("Please fill all fields");
      return;
    }

    // Employee validation
    if (data.role === "employee") {
      if (!data.designation) {
        alert("Please select designation");
        return;
      }
      // Regular employees (non‑team‑lead) must have a team lead
      if (data.designation !== "team lead" && !data.teamLead) {
        alert("Please select a team lead");
        return;
      }
      // For team lead, teamLead is optional (can be empty string)
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", data);
      alert("Registered Successfully");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient overflow-auto py-4">
      <div 
        className="p-5 rounded-4 shadow-2xl bg-white register-card"
        style={{ width: "500px", maxWidth: "90%", animation: "slideUp 0.5s ease-out" }}
      >
        {/* Header Section */}
        <div className="text-center mb-4">
          <div className="mx-auto mb-3 d-flex justify-content-center">
            <div className="rounded-circle bg-primary bg-opacity-10 p-3 animate-pulse">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#0d6efd"/>
              </svg>
            </div>
          </div>
          <h3 className="fw-bold mb-1" style={{ color: "#1a1a2e" }}>Create Account</h3>
          <p className="text-secondary small">Join us and start your journey</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">FULL NAME</label>
            <div className="position-relative">
              <span className="position-absolute start-0 top-50 translate-middle-y ms-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#6c757d"/>
                </svg>
              </span>
              <input
                className={`form-control ps-5 py-2 rounded-3 transition-input ${focusedField === 'name' ? 'shadow-sm' : ''}`}
                style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                name="name"
                placeholder="Enter your full name"
                value={data.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField('')}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">EMAIL ADDRESS</label>
            <div className="position-relative">
              <span className="position-absolute start-0 top-50 translate-middle-y ms-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#6c757d" strokeWidth="1.5" fill="none"/>
                  <path d="M22 6L12 13L2 6" stroke="#6c757d" strokeWidth="1.5" fill="none"/>
                </svg>
              </span>
              <input
                className={`form-control ps-5 py-2 rounded-3 transition-input ${focusedField === 'email' ? 'shadow-sm' : ''}`}
                style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                name="email"
                placeholder="Enter your email"
                value={data.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">PHONE NUMBER</label>
            <div className="position-relative">
              <span className="position-absolute start-0 top-50 translate-middle-y ms-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="#6c757d"/>
                </svg>
              </span>
              <input
                className={`form-control ps-5 py-2 rounded-3 transition-input ${focusedField === 'phone' ? 'shadow-sm' : ''}`}
                style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                name="phone"
                placeholder="Enter your phone number"
                value={data.phone}
                onChange={handleChange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
              />
            </div>
          </div>

          {/* Gender & Role Row */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">GENDER</label>
              <select
                className="form-select py-2 rounded-3 transition-input"
                style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                name="gender"
                value={data.gender}
                onChange={handleChange}
              >
                <option value="">Choose Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">ROLE</label>
              <select
                className="form-select py-2 rounded-3 transition-input"
                style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                name="role"
                value={data.role}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value !== "employee") {
                    setData((prev) => ({
                      ...prev,
                      designation: "",
                      teamLead: "",
                    }));
                  }
                }}
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="employer">Employer</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>

          {/* Conditional fields for employees */}
          {data.role === "employee" && (
            <>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">DESIGNATION</label>
                <select
                  className="form-select py-2 rounded-3 transition-input"
                  style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                  name="designation"
                  value={data.designation}
                  onChange={(e) => {
                    handleChange(e);
                    // Clear teamLead when designation changes
                    setData((prev) => ({ ...prev, teamLead: "" }));
                  }}
                >
                  <option value="">Select Designation</option>
                  <option value="team lead">Team Lead</option>
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="FE">FE</option>
                </select>
              </div>

              {/* Team Lead (for regular employees) */}
              {data.designation && data.designation !== "team lead" && (
                <div className="mb-3 animate-slideDown">
                  <label className="form-label small fw-semibold text-secondary">TEAM LEAD (required)</label>
                  <select
                    className="form-select py-2 rounded-3 transition-input"
                    name="teamLead"
                    value={data.teamLead}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Team Lead</option>
                    {teamLeads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Manager (for team leads – optional) */}
              {data.designation === "team lead" && (
                <div className="mb-3 animate-slideDown">
                  <label className="form-label small fw-semibold text-secondary">MANAGER (optional but recommended)</label>
                  <select
                    className="form-select py-2 rounded-3 transition-input"
                    name="teamLead"
                    value={data.teamLead}
                    onChange={handleChange}
                  >
                    <option value="">Select Manager (optional)</option>
                    {managers.map((mgr) => (
                      <option key={mgr._id} value={mgr._id}>
                        {mgr.name}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">If no manager selected, this team lead will have no manager.</small>
                </div>
              )}
            </>
          )}

          {/* Password Field */}
          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">PASSWORD</label>
            <div className="position-relative">
              <span className="position-absolute start-0 top-50 translate-middle-y ms-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" fill="#6c757d"/>
                </svg>
              </span>
              <input
                className={`form-control ps-5 py-2 rounded-3 transition-input ${focusedField === 'password' ? 'shadow-sm' : ''}`}
                style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                name="password"
                placeholder="Create a password"
                type={showPassword ? "text" : "password"}
                value={data.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
              />
              <span 
                className="position-absolute end-0 top-50 translate-middle-y me-3"
                style={{ cursor: "pointer" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  {showPassword ? (
                    <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.5 22.27 13.86 23 12C21.3 8.32 17.84 5.5 13.73 5.06L16.18 7.51C15.06 7.19 13.89 7 12.71 7H12Z" fill="#6c757d"/>
                  ) : (
                    <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.5 22.27 13.86 23 12C21.3 8.32 17.84 5.5 13.73 5.06L16.18 7.51C15.06 7.19 13.89 7 12.71 7H12Z" fill="#6c757d"/>
                  )}
                </svg>
              </span>
            </div>
          </div>

          {/* Register Button */}
          <button 
            type="submit"
            className="btn w-100 py-2 fw-semibold rounded-3 mb-3 btn-gradient"
            style={{ 
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <span className="position-relative">Create Account</span>
          </button>

          {/* Login Link */}
          <div className="text-center pt-2">
            <p className="small text-secondary mb-0">
              Already have an account?{" "}
              <Link to="/" className="text-decoration-none fw-semibold" style={{ color: "#0d6efd" }}>
                Sign In
              </Link>
            </p>
          </div>
        </form>

        {/* Divider */}
        <div className="position-relative my-4">
          <hr className="text-secondary" />
          <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 small text-secondary">
            or
          </span>
        </div>

        {/* Terms & Conditions */}
        <p className="text-center small text-secondary mb-0">
          By registering, you agree to our{" "}
          <a href="#" className="text-decoration-none" style={{ color: "#0d6efd" }}>Terms</a> and{" "}
          <a href="#" className="text-decoration-none" style={{ color: "#0d6efd" }}>Privacy Policy</a>
        </p>
      </div>

      <style jsx>{`
        .bg-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
        }
        
        .shadow-2xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .transition-input {
          transition: all 0.3s ease;
        }
        
        .transition-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
          transform: translateY(-1px);
        }
        
        .btn-gradient {
          background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
          color: white;
          border: none;
        }
        
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(13, 110, 253, 0.3);
          background: linear-gradient(135deg, #0b5ed7 0%, #0dcaf0 100%);
        }
        
        .btn-gradient:active {
          transform: translateY(0px);
        }
        
        .register-card {
          animation: slideUp 0.5s ease-out;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .register-card::-webkit-scrollbar {
          width: 6px;
        }
        
        .register-card::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .register-card::-webkit-scrollbar-thumb {
          background: #0d6efd;
          border-radius: 10px;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @media (max-width: 576px) {
          .register-card {
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}