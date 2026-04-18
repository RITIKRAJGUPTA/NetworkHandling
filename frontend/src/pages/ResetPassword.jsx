import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
      password,
    });
    setMsg(res.data.message);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="p-4 rounded shadow-lg bg-white" style={{ width: "380px" }}>
        <h3 className="text-center mb-3">Reset Password</h3>

        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-3"
            placeholder="New Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-success w-100">Reset Password</button>
        </form>

        {msg && <p className="text-success text-center mt-3">{msg}</p>}
      </div>
    </div>
  );
}
