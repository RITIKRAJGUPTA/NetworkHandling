import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.userId);
      toast.success("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 404 || data.message === "User not found")
          toast.error("User not registered! Please create an account first.");
        else if (status === 401)
          toast.error("Invalid email or password. Please try again.");
        else if (status === 400)
          toast.error(data.message || "Please check your credentials.");
        else toast.error("Something went wrong. Please try again later.");
      } else if (error.request) {
        toast.error("Cannot connect to server. Please check your connection.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
      
      <div className="snoc-login-container">
        {/* Animated background elements */}
        <div className="bg-animation">
          <div className="grid-lines"></div>
          <div className="floating-particles"></div>
          <div className="pulse-ring"></div>
        </div>

        {/* Top metrics bar */}
        <div className="metrics-bar">
          <div className="metric">
            <span className="metric-label">NETWORK TOPOLOGY</span>
            <span className="metric-value">REALTIME</span>
          </div>
          <div className="metric">
            <span className="metric-label">TRAFFIC ANALYTICS</span>
            <span className="metric-value">Ritik</span>
          </div>
          <div className="metric">
            <span className="metric-label">ALERTS</span>
            <span className="metric-value blink">3</span>
          </div>
          <div className="metric">
            <span className="metric-label">BANDWIDTH</span>
            <span className="metric-value">557K</span>
          </div>
          <div className="metric">
            <span className="metric-label">NODE STATUS</span>
            <span className="metric-value success">76%</span>
          </div>
        </div>

        {/* Main login card */}
        <div className="login-card">
          <div className="brand-header">
            <div className="logo">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z" fill="#00d4ff" stroke="#00d4ff" strokeWidth="1.2"/>
              </svg>
            </div>
            <h1>SNOC Networking <span>Operations Hub</span></h1>
            <p className="subtitle">Secure access to network monitoring & management</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>USERNAME / EMAIL</label>
              <input
                type="email"
                placeholder="admin@snoc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="input-group">
              <label>PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="options">
              <label className="checkbox">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                "LOGIN TO DASHBOARD"
              )}
            </button>
            <div className="register-link">
              New user? <Link to="/register">Create an account</Link>
            </div>
          </form>

          <div className="powered-by">
            Powered by <strong>RRG</strong>
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

        .snoc-login-container {
          min-height: 100vh;
          background: radial-gradient(circle at 20% 30%, #0a0f1e, #03060c);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          overflow: hidden;
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

        /* Metrics bar */
        .metrics-bar {
          position: relative;
          z-index: 2;
          width: 90%;
          max-width: 1200px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          background: rgba(15, 25, 45, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 28px;
          padding: 16px 28px;
          margin-bottom: 40px;
          border: 1px solid rgba(0, 212, 255, 0.3);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }

        .metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .metric-label {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 1px;
          color: #7f8fa4;
          text-transform: uppercase;
        }

        .metric-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #00d4ff;
          text-shadow: 0 0 4px #00d4ff;
        }

        .metric-value.blink {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; text-shadow: 0 0 4px #ff4444; }
          50% { opacity: 0.6; text-shadow: 0 0 12px #ff4444; }
        }

        .metric-value.success {
          color: #2ecc71;
          text-shadow: 0 0 4px #2ecc71;
        }

        /* Login card */
        .login-card {
          position: relative;
          z-index: 2;
          width: 90%;
          max-width: 480px;
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

        .login-card:hover {
          box-shadow: 0 30px 50px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(0,212,255,0.2);
        }

        .brand-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          margin-bottom: 16px;
        }

        .brand-header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff, #00d4ff);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          letter-spacing: -0.5px;
        }

        .brand-header h1 span {
          font-size: 1rem;
          font-weight: 400;
          background: none;
          color: #7f8fa4;
        }

        .subtitle {
          font-size: 0.85rem;
          color: #9aa4bf;
          margin-top: 8px;
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

        .input-group input {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid #2a3a55;
          border-radius: 20px;
          padding: 14px 20px;
          font-size: 0.9rem;
          color: #ffffff;
          transition: all 0.2s;
        }

        .input-group input:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }

        .input-group input::placeholder {
          color: #5a6e8a;
        }

        .options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          font-size: 0.8rem;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #b0bedb;
          cursor: pointer;
        }

        .checkbox input {
          width: 16px;
          height: 16px;
          accent-color: #00d4ff;
        }

        .forgot-link {
          color: #00d4ff;
          text-decoration: none;
          font-size: 0.75rem;
          transition: 0.2s;
        }

        .forgot-link:hover {
          text-decoration: underline;
          opacity: 0.8;
        }

        .login-btn {
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
          gap: 8px;
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0,180,216,0.3);
        }

        .login-btn:disabled {
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

        .register-link {
          text-align: center;
          margin-top: 28px;
          font-size: 0.8rem;
          color: #9aa4bf;
        }

        .register-link a {
          color: #00d4ff;
          text-decoration: none;
          font-weight: 600;
        }

        .powered-by {
          text-align: center;
          margin-top: 32px;
          font-size: 0.7rem;
          color: #5a6e8a;
          letter-spacing: 0.5px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .metrics-bar {
            display: none;
          }
          .login-card {
            padding: 32px 24px;
          }
          .brand-header h1 {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </>
  );
}