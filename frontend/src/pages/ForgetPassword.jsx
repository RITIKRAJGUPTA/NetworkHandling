import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    
    try {
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setMsg(res.data.message);
      setEmail("");
    } catch (err) {
      setMsg(err.response?.data?.message || "Error sending reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient overflow-auto">
      <div 
        className="p-5 rounded-4 shadow-2xl bg-white forgot-card"
        style={{ width: "450px", maxWidth: "90%", animation: "slideUp 0.5s ease-out" }}
      >
        {/* Header Section */}
        <div className="text-center mb-4">
          <div className="mx-auto mb-3 d-flex justify-content-center">
            <div className="rounded-circle bg-warning bg-opacity-10 p-3 animate-pulse">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="#ffc107" strokeWidth="1.5" fill="none"/>
                <path d="M12 16H12.01" stroke="#ffc107" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h3 className="fw-bold mb-1" style={{ color: "#1a1a2e" }}>Forgot Password?</h3>
          <p className="text-secondary small mt-2">
            Don't worry! Enter your email address and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">EMAIL ADDRESS</label>
            <div className="position-relative">
              <span className="position-absolute start-0 top-50 translate-middle-y ms-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#6c757d" strokeWidth="1.5" fill="none"/>
                  <path d="M22 6L12 13L2 6" stroke="#6c757d" strokeWidth="1.5" fill="none"/>
                </svg>
              </span>
              <input
                className={`form-control ps-5 py-2 rounded-3 transition-input ${focusedField === 'email' ? 'shadow-sm' : ''}`}
                style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            className="btn w-100 py-2 fw-semibold rounded-3 mb-3 btn-gradient"
            disabled={loading}
            style={{ 
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Sending...
              </span>
            ) : (
              <span className="position-relative">Send Reset Link</span>
            )}
          </button>

          {/* Back to Login Link */}
          <div className="text-center pt-2">
            <Link to="/" className="text-decoration-none fw-semibold d-inline-flex align-items-center gap-1" style={{ color: "#0d6efd" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Login
            </Link>
          </div>
        </form>

        {/* Success/Error Message */}
        {msg && (
          <div className={`alert ${msg.includes("sent") ? "alert-success" : "alert-danger"} mt-4 animate-slideDown`} role="alert">
            <div className="d-flex align-items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {msg.includes("sent") ? (
                  <path d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z" fill="currentColor"/>
                ) : (
                  <path d="M12 8V12M12 16H12.01M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                )}
              </svg>
              <span className="small">{msg}</span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="position-relative my-4">
          <hr className="text-secondary" />
          <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 small text-secondary">
            need help?
          </span>
        </div>

        {/* Help Section */}
        <div className="text-center">
          <p className="small text-secondary mb-2">
            Having trouble? Contact our support team
          </p>
          <a 
            href="mailto:support@example.com" 
            className="text-decoration-none small fw-semibold d-inline-flex align-items-center gap-1"
            style={{ color: "#0d6efd" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L15 9M22 2L15 9M22 2H15M22 2V9M2 22L9 15M2 22L9 15M2 22H9M2 22V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M15 2H22V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 15L2 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            support@example.com
          </a>
        </div>
      </div>

      <style jsx>{`
        .bg-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
        }
        
        .shadow-2xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .transition-input {
          transition: all 0.3s ease;
        }
        
        .transition-input:focus {
          border-color: #ffc107;
          box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25);
          transform: translateY(-1px);
        }
        
        .btn-gradient {
          background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
          color: #000;
          border: none;
        }
        
        .btn-gradient:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(255, 193, 7, 0.3);
          background: linear-gradient(135deg, #ffb300 0%, #ff8c00 100%);
        }
        
        .btn-gradient:active:not(:disabled) {
          transform: translateY(0px);
        }
        
        .btn-gradient:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .forgot-card {
          animation: slideUp 0.5s ease-out;
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
        
        /* Responsive adjustments */
        @media (max-width: 576px) {
          .forgot-card {
            padding: 1.5rem !important;
          }
        }
        
        /* Custom alert styles */
        .alert {
          border: none;
          border-radius: 10px;
          padding: 0.75rem 1rem;
        }
        
        .alert-success {
          background-color: #d4edda;
          color: #155724;
        }
        
        .alert-danger {
          background-color: #f8d7da;
          color: #721c24;
        }
      `}</style>
    </div>
  );
}