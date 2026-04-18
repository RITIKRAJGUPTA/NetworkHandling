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

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  // ✅ Fetch team leads when needed
  useEffect(() => {
    if (
      data.role === "employee" &&
      data.designation &&
      data.designation !== "team lead"
    ) {
      axios
        .get("http://localhost:5000/api/auth/team-leads")
        .then((res) => setTeamLeads(res.data))
        .catch((err) => console.log(err));
    }
  }, [data.role, data.designation]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Basic validation
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

    // ✅ Employee validation
    if (data.role === "employee") {
      if (!data.designation) {
        alert("Please select designation");
        return;
      }

      if (data.designation !== "team lead" && !data.teamLead) {
        alert("Please select team lead");
        return;
      }
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", data);

      alert("Registered Successfully");

      // ✅ Redirect to login page
      navigate("/"); // change to "/login" if needed

    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div
        className="p-4 rounded shadow-lg bg-white"
        style={{ width: "400px" }}
      >
        <h3 className="text-center mb-3">Register</h3>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <input
            className="form-control mb-2"
            name="name"
            placeholder="Name"
            value={data.name}
            onChange={handleChange}
          />

          {/* Email */}
          <input
            className="form-control mb-2"
            name="email"
            placeholder="Email"
            value={data.email}
            onChange={handleChange}
          />

          {/* Phone */}
          <input
            className="form-control mb-2"
            name="phone"
            placeholder="Phone"
            value={data.phone}
            onChange={handleChange}
          />

          {/* Gender */}
          <select
            className="form-control mb-2"
            name="gender"
            value={data.gender}
            onChange={handleChange}
          >
            <option value="">Choose Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          {/* Role */}
          <select
            className="form-control mb-2"
            name="role"
            value={data.role}
            onChange={(e) => {
              handleChange(e);

              // reset dependent fields
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

          {/* Designation */}
          {data.role === "employee" && (
            <select
              className="form-control mb-2"
              name="designation"
              value={data.designation}
              onChange={(e) => {
                handleChange(e);

                // reset teamLead if designation is TL
                if (e.target.value === "team lead") {
                  setData((prev) => ({ ...prev, teamLead: "" }));
                }
              }}
            >
              <option value="">Select Designation</option>
              <option value="team lead">Team Lead</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="FE">FE</option>
            </select>
          )}

          {/* Team Lead Dropdown */}
          {data.role === "employee" &&
            data.designation &&
            data.designation !== "team lead" && (
              <select
                className="form-control mb-2"
                name="teamLead"
                value={data.teamLead}
                onChange={handleChange}
              >
                <option value="">Select Team Lead</option>
                {teamLeads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.name}
                  </option>
                ))}
              </select>
            )}

          {/* Password */}
          <input
            className="form-control mb-3"
            name="password"
            placeholder="Password"
            type="password"
            value={data.password}
            onChange={handleChange}
          />

          <button className="btn btn-primary w-100">
            Register
          </button>
        </form>

        <p className="text-center mt-3">
          Already have an account?{" "}
          <Link to="/" className="text-success">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}