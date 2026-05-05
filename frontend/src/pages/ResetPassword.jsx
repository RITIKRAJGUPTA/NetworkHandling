import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      toast.error("Please enter a new password");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/reset-password/${token}`, {
        password,
      });
      setMsg(res.data.message);
      toast.success(res.data.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to reset password";
      setMsg(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
      <div className="snoc-reset-container">
        {/* Animated background */}
        <div className="bg-animation">
          <div className="grid-lines"></div>
          <div className="floating-particles"></div>
          <div className="pulse-ring"></div>
        </div>

        {/* Top bar */}
        <div className="top-bar">
          <div className="brand-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z" fill="#00d4ff" stroke="#00d4ff" strokeWidth="1.2"/>
            </svg>
            <span>SNOC Networking</span>
          </div>
        </div>

        {/* Reset Password Card */}
        <div className="reset-card">
          <div className="card-header">
            <div className="icon-wrapper">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 8V12L15 15M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="#00d4ff" strokeWidth="1.5" fill="none"/>
                <path d="M12 16H12.01" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Reset Password</h2>
            <p>Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>NEW PASSWORD</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className={focusedField === 'password' ? 'focused' : ''}
                  required
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

            <div className="input-group">
              <label>CONFIRM PASSWORD</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField('')}
                  className={focusedField === 'confirm' ? 'focused' : ''}
                  required
                />
              </div>
            </div>

            <button type="submit" className="reset-btn" disabled={loading}>
              {loading ? <span className="spinner"></span> : "RESET PASSWORD"}
            </button>

            <div className="back-link">
              <Link to="/">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Login
              </Link>
            </div>
          </form>

          {msg && (
            <div className={`message ${msg.includes("successful") ? "success" : "error"}`}>
              {msg}
            </div>
          )}
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

        .snoc-reset-container {
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

        /* Animated background */
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
          max-width: 500px;
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

        /* Reset Card */
        .reset-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 500px;
          background: rgba(10, 18, 32, 0.85);
          backdrop-filter: blur(16px);
          border-radius: 32px;
          padding: 40px 32px;
          border: 1px solid rgba(0, 212, 255, 0.25);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,212,255,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reset-card:hover {
          box-shadow: 0 30px 50px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(0,212,255,0.2);
        }

        .card-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .icon-wrapper {
          margin-bottom: 16px;
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

        .input-group {
          margin-bottom: 24px;
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
        .password-wrapper {
          position: relative;
        }
        .password-wrapper input {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid #2a3a55;
          border-radius: 20px;
          padding: 14px 20px;
          font-size: 0.9rem;
          color: #ffffff;
          transition: all 0.2s;
          padding-right: 50px;
        }
        .password-wrapper input:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }
        .password-wrapper input::placeholder {
          color: #5a6e8a;
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

        .reset-btn {
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
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .reset-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0,180,216,0.3);
        }
        .reset-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .back-link {
          text-align: center;
          margin-top: 24px;
        }
        .back-link a {
          color: #00d4ff;
          text-decoration: none;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: 0.2s;
        }
        .back-link a:hover {
          text-decoration: underline;
          opacity: 0.8;
        }

        .message {
          margin-top: 24px;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 0.85rem;
          text-align: center;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
        }
        .message.success {
          border-left: 3px solid #2ecc71;
          color: #2ecc71;
        }
        .message.error {
          border-left: 3px solid #ef4444;
          color: #ef4444;
        }

        @media (max-width: 576px) {
          .reset-card {
            padding: 28px 20px;
          }
          .card-header h2 {
            font-size: 1.4rem;
          }
        }
          .snoc-reset-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;            /* reduced padding to prevent overflow */
  position: relative;
  overflow: hidden;         /* prevents any scroll on the container */
}

.reset-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 500px;
  background: rgba(10, 18, 32, 0.85);
  backdrop-filter: blur(16px);
  border-radius: 32px;
  padding: 32px 28px;       /* slightly reduced padding */
  border: 1px solid rgba(0, 212, 255, 0.25);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,212,255,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: slideUp 0.6s ease-out;
  /* no max-height, so it expands naturally but container ensures no overflow */
}
  @media (max-height: 700px) {
  .reset-card {
    padding: 20px 24px;
  }
  .card-header h2 {
    font-size: 1.5rem;
  }
  .input-group {
    margin-bottom: 16px;
  }
}
      `
      }</style>
    </>
  );
}