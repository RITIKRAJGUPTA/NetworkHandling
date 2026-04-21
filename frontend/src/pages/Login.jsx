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
    
    // Basic validation
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

      // Success case
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.userId);
      toast.success("Login successful! Redirecting...");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
      
    } catch (error) {
      // Handle different error scenarios
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 404 || data.message === "User not found") {
          toast.error("User not registered! Please create an account first.");
        } else if (status === 401) {
          toast.error("Invalid email or password. Please try again.");
        } else if (status === 400) {
          toast.error(data.message || "Please check your credentials.");
        } else {
          toast.error("Something went wrong. Please try again later.");
        }
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
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient">
        <div className="p-5 rounded-4 shadow-2xl bg-white" style={{ width: "420px", backdropFilter: "blur(0px)" }}>
          {/* Logo/Brand */}
          <div className="text-center mb-4">
            <div className="mx-auto mb-3 d-flex justify-content-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z" fill="#198754" stroke="#198754" strokeWidth="1.5"/>
                </svg>
              </div>
            </div>
            <h3 className="fw-bold mb-1" style={{ color: "#1a1a2e" }}>Welcome Back</h3>
            <p className="text-secondary small">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">EMAIL ADDRESS</label>
              <div className="position-relative">
                <span className="position-absolute start-0 top-50 translate-middle-y ms-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#6c757d" strokeWidth="1.5" fill="none"/>
                    <path d="M22 6L12 13L2 6" stroke="#6c757d" strokeWidth="1.5" fill="none"/>
                  </svg>
                </span>
                <input
                  className="form-control ps-5 py-2 rounded-3"
                  style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">PASSWORD</label>
              <div className="position-relative">
                <span className="position-absolute start-0 top-50 translate-middle-y ms-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" fill="#6c757d"/>
                  </svg>
                </span>
                <input
                  className="form-control ps-5 py-2 rounded-3"
                  style={{ borderColor: "#dee2e6", fontSize: "14px" }}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-end mb-3">
              <Link to="/forgot-password" className="small text-decoration-none" style={{ color: "#198754" }}>
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button 
              className="btn w-100 py-2 fw-semibold rounded-3 mb-3"
              style={{ 
                backgroundColor: "#198754", 
                color: "white",
                border: "none",
                transition: "all 0.3s ease",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = "#157347")}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = "#198754")}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-2">
              <p className="small text-secondary mb-0">
                Don't have an account?{" "}
                <Link to="/register" className="text-decoration-none fw-semibold" style={{ color: "#198754" }}>
                  Create account
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

          {/* Social Login Buttons (Optional) */}
          <div className="d-flex gap-2 justify-content-center">
            <button className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.05 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.71 16.7 5.84 14.09H2.15V16.96C3.96 20.54 7.7 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.09C5.62 13.43 5.5 12.73 5.5 12C5.5 11.27 5.62 10.57 5.84 9.91V7.04H2.15C1.4 8.52 1 10.22 1 12C1 13.78 1.4 15.48 2.15 16.96L5.84 14.09Z" fill="#FBBC05"/>
                <path d="M12 5.38C13.62 5.38 15.06 5.94 16.15 7.01L19.36 3.8C17.45 2.01 14.97 1 12 1C7.7 1 3.96 3.46 2.15 7.04L5.84 9.91C6.71 7.31 9.13 5.38 12 5.38Z" fill="#EA4335"/>
              </svg>
            </button>
            <button className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.8V15H8V12H10V9.5C10 7.57 11.57 6 13.5 6H16V9H14C13.45 9 13 9.45 13 10V12H16V15H13V21.95C18.05 21.45 22 17.19 22 12Z" fill="#1877F2"/>
              </svg>
            </button>
            <button className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.23 5.92C21.43 6.27 20.57 6.5 19.67 6.6C20.59 6.05 21.31 5.23 21.69 4.23C20.82 4.73 19.88 5.09 18.87 5.3C18.07 4.44 16.94 3.91 15.68 3.91C13.28 3.91 11.33 5.86 11.33 8.26C11.33 8.61 11.37 8.95 11.45 9.27C8.33 9.07 5.56 7.36 3.79 4.73C3.4 5.39 3.18 6.16 3.18 6.99C3.18 8.54 4.02 9.9 5.27 10.69C4.54 10.67 3.85 10.47 3.24 10.15C3.24 10.17 3.24 10.19 3.24 10.21C3.24 12.33 4.77 14.09 6.79 14.5C6.41 14.6 6.01 14.65 5.6 14.65C5.32 14.65 5.05 14.63 4.78 14.58C5.33 16.31 6.94 17.56 8.85 17.6C7.34 18.78 5.42 19.48 3.34 19.48C2.98 19.48 2.62 19.46 2.27 19.42C4.19 20.65 6.46 21.36 8.9 21.36C15.68 21.36 19.34 15.69 19.34 10.79C19.34 10.62 19.34 10.45 19.33 10.29C20.21 9.63 20.97 8.82 21.58 7.88C20.75 8.25 19.86 8.5 18.92 8.62C19.88 8.03 20.63 7.2 22.23 5.92Z" fill="#1DA1F2"/>
              </svg>
            </button>
          </div>
        </div>

        <style jsx>{`
          .bg-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background: linear-gradient(135deg, #198754 0%, #20c997 100%);
          }
          .shadow-2xl {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          .form-control:focus {
            border-color: #198754;
            box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
          }
        `}</style>
      </div>
    </>
  );
}