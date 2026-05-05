import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
   const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (data.role === "employee" && data.designation) {
      if (data.designation === "team lead") {
        axios
          .get(`${BACKEND_URL}/api/auth/managers`)
          .then((res) => setManagers(res.data))
          .catch((err) => console.log(err));
      } else {
        axios
          .get(`${BACKEND_URL}/api/auth/team-leads`)
          .then((res) => setTeamLeads(res.data))
          .catch((err) => console.log(err));
      }
    }
  }, [data.role, data.designation]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !data.name ||
      !data.email ||
      !data.phone ||
      !data.gender ||
      !data.role ||
      !data.password
    ) {
      toast.error("Please fill all fields", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    if (data.role === "employee") {
      if (!data.designation) {
        toast.error("Please select designation", {
          position: "top-right",
          autoClose: 4000,
        });
        return;
      }
      if (data.designation !== "team lead" && !data.teamLead) {
        toast.error("Please select a team lead", {
          position: "top-right",
          autoClose: 4000,
        });
        return;
      }
    }

    try {
      await axios.post(`${BACKEND_URL}/api/auth/register`, data);
      toast.success("Registered Successfully! Redirecting to login...", {
        position: "top-right",
        autoClose: 2000,
      });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
      <div className="snoc-register-container">
        {/* Animated background */}
        <div className="bg-animation">
          <div className="grid-lines"></div>
          <div className="floating-particles"></div>
          <div className="pulse-ring"></div>
        </div>

        {/* Minimal top bar (only brand) */}
        <div className="top-bar">
          <div className="brand-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z" fill="#00d4ff" stroke="#00d4ff" strokeWidth="1.2"/>
            </svg>
            <span>SNOC Networking</span>
          </div>
        </div>

        {/* Register Card */}
        <div className="register-card">
          <div className="card-header">
            <h2>Create Account</h2>
            <p>Join the SNOC Operations Hub</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="input-group">
                <label>FULL NAME</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={data.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                  className={focusedField === 'name' ? 'focused' : ''}
                />
              </div>
              <div className="input-group">
                <label>EMAIL ADDRESS</label>
                <input
                  type="email"
                  name="email"
                  placeholder="email@snoc.com"
                  value={data.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  className={focusedField === 'email' ? 'focused' : ''}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>PHONE NUMBER</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 1234567890"
                  value={data.phone}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField('')}
                  className={focusedField === 'phone' ? 'focused' : ''}
                />
              </div>
              <div className="input-group">
                <label>GENDER</label>
                <select
                  name="gender"
                  value={data.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>ROLE</label>
                <select
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
              {data.role === "employee" && (
                <div className="input-group">
                  <label>DESIGNATION</label>
                  <select
                    name="designation"
                    value={data.designation}
                    onChange={(e) => {
                      handleChange(e);
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
              )}
            </div>

            {data.role === "employee" && data.designation && data.designation !== "team lead" && (
              <div className="input-group">
                <label>TEAM LEAD (required)</label>
                <select
                  name="teamLead"
                  value={data.teamLead}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Team Lead</option>
                  {teamLeads.map((lead) => (
                    <option key={lead._id} value={lead._id}>{lead.name}</option>
                  ))}
                </select>
              </div>
            )}

            {data.role === "employee" && data.designation === "team lead" && (
              <div className="input-group">
                <label>MANAGER (optional)</label>
                <select
                  name="teamLead"
                  value={data.teamLead}
                  onChange={handleChange}
                >
                  <option value="">None</option>
                  {managers.map((mgr) => (
                    <option key={mgr._id} value={mgr._id}>{mgr.name}</option>
                  ))}
                </select>
                <small>If no manager selected, this team lead will have no manager.</small>
              </div>
            )}

            <div className="input-group">
              <label>PASSWORD</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={data.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className={focusedField === 'password' ? 'focused' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className="register-btn">
              CREATE ACCOUNT
            </button>

            <div className="login-link">
              Already have an account? <Link to="/">Sign In</Link>
            </div>
          </form>

          <div className="terms">
            By registering, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          margin: 0;
          overflow-x: hidden;
        }

        .snoc-register-container {
          min-height: 100vh;
          background: radial-gradient(circle at 20% 30%, #0a0f1e, #03060c);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          padding: 40px 20px;
        }

        /* Animated background (same as login) */
        .bg-animation {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }
        .grid-lines {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 212, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.08) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: moveGrid 20s linear infinite;
        }
        @keyframes moveGrid {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        .floating-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 20% 40%, rgba(0,212,255,0.1) 0%, transparent 50%);
          animation: pulseGlow 8s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200%;
          height: 200%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          animation: expandRing 12s infinite;
        }
        @keyframes expandRing {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
        }

        .top-bar {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 800px;
          margin-bottom: 30px;
          display: flex;
          justify-content: center;
        }
        .brand-icon {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(15, 25, 45, 0.7);
          backdrop-filter: blur(8px);
          padding: 8px 24px;
          border-radius: 40px;
          border: 1px solid rgba(0,212,255,0.3);
        }
        .brand-icon span {
          color: #00d4ff;
          font-weight: 600;
          letter-spacing: 1px;
          font-size: 1rem;
        }

        /* Register Card */
        .register-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 700px;
          background: rgba(10, 18, 32, 0.85);
          backdrop-filter: blur(16px);
          border-radius: 32px;
          padding: 40px 36px;
          border: 1px solid rgba(0, 212, 255, 0.25);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,212,255,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .register-card:hover {
          box-shadow: 0 30px 50px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(0,212,255,0.2);
        }

        .card-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .card-header h2 {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff, #00d4ff);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          margin-bottom: 8px;
        }
        .card-header p {
          color: #9aa4bf;
          font-size: 0.85rem;
        }

        .form-row {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .form-row .input-group {
          flex: 1;
          min-width: 200px;
        }

        .input-group {
          margin-bottom: 20px;
        }
        .input-group label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1px;
          color: #b0bedb;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .input-group input, .input-group select {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid #2a3a55;
          border-radius: 20px;
          padding: 12px 18px;
          font-size: 0.9rem;
          color: #ffffff;
          transition: all 0.2s;
        }
        .input-group input:focus, .input-group select:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }
        .input-group input::placeholder {
          color: #5a6e8a;
        }
        .input-group select option {
          background: #0a1220;
        }
        .input-group small {
          display: block;
          margin-top: 6px;
          font-size: 0.7rem;
          color: #7f8fa4;
        }

        .password-wrapper {
          position: relative;
        }
        .password-wrapper input {
          padding-right: 50px;
        }
        .toggle-password {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          opacity: 0.7;
          transition: 0.2s;
        }
        .toggle-password:hover {
          opacity: 1;
        }

        .register-btn {
          width: 100%;
          background: linear-gradient(90deg, #00b4d8, #0077b6);
          border: none;
          border-radius: 40px;
          padding: 14px;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 8px;
        }
        .register-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0,180,216,0.3);
        }

        .login-link {
          text-align: center;
          margin-top: 28px;
          font-size: 0.8rem;
          color: #9aa4bf;
        }
        .login-link a {
          color: #00d4ff;
          text-decoration: none;
          font-weight: 600;
        }
        .login-link a:hover {
          text-decoration: underline;
        }

        .terms {
          text-align: center;
          margin-top: 32px;
          font-size: 0.7rem;
          color: #5a6e8a;
        }
        .terms a {
          color: #00d4ff;
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .register-card {
            padding: 28px 20px;
          }
          .form-row {
            flex-direction: column;
            gap: 0;
          }
          .card-header h2 {
            font-size: 1.4rem;
          }
        }
          .snoc-register-container {
  min-height: 100vh;
  overflow-y: auto;
  padding: 40px 20px;
}
  .snoc-register-container {
  min-height: 100vh;
  overflow-y: auto;          /* enables vertical scrolling */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
}

.register-card {
  max-height: 90vh;          /* prevents card from exceeding viewport */
  overflow-y: auto;          /* scroll inside card if needed */
  width: 100%;
  max-width: 700px;
  /* ... existing styles ... */
}

/* Optional: style the scrollbar for a modern look */
.register-card::-webkit-scrollbar {
  width: 6px;
}
.register-card::-webkit-scrollbar-track {
  background: #1a2a3a;
  border-radius: 10px;
}
.register-card::-webkit-scrollbar-thumb {
  background: #00d4ff;
  border-radius: 10px;
}
      `}</style>
    </>
  );
}