import { useState } from "react";
import axios from "axios";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
    setMsg(res.data.message);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="p-4 rounded shadow-lg bg-white" style={{ width: "380px" }}>
        <h3 className="text-center mb-3">Forgot Password</h3>

        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-3"
            placeholder="Enter your registered email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="btn btn-primary w-100">Send Reset Link</button>
        </form>

        {msg && <p className="text-success text-center mt-3">{msg}</p>}
      </div>
    </div>
  );
}
