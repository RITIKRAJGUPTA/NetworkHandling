// src/pages/DashboardPages/EmployeeManagement.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const BACKEND_URL = "http://localhost:5000";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", gender: "", designation: "", teamLead: "",
    address: "", dateOfBirth: "",
    emergencyContact: { name: "", phone: "", relationship: "" },
    bankDetails: { accountNumber: "", bankName: "", ifscCode: "" },
  });
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/users/role/employee`, axiosConfig);
      console.log("Employees API response:", res.data);

      if (Array.isArray(res.data)) {
        setEmployees(res.data);
        setError("");
      } else {
        throw new Error("Invalid response format: expected array");
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to load employees: ${msg}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeads = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/team-leads`, axiosConfig);
      if (Array.isArray(res.data)) setTeamLeads(res.data);
    } catch (err) {
      console.error("Fetch team leads error:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTeamLeads();
  }, []);

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      gender: emp.gender || "",
      designation: emp.designation || "",
      teamLead: emp.teamLead?._id || emp.teamLead || "",
      address: emp.address || "",
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split("T")[0] : "",
      emergencyContact: {
        name: emp.emergencyContact?.name || "",
        phone: emp.emergencyContact?.phone || "",
        relationship: emp.emergencyContact?.relationship || "",
      },
      bankDetails: {
        accountNumber: emp.bankDetails?.accountNumber || "",
        bankName: emp.bankDetails?.bankName || "",
        ifscCode: emp.bankDetails?.ifscCode || "",
      },
    });
    setShowModal(true);
  };

  const handleChange = (e, section = null, field = null) => {
    const { name, value } = e.target;
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        designation: formData.designation,
        teamLead: formData.teamLead || null,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth || null,
        emergencyContact: formData.emergencyContact,
        bankDetails: formData.bankDetails,
      };
      await axios.put(`${BACKEND_URL}/api/auth/profile/${editingEmployee._id}`, payload, axiosConfig);
      fetchEmployees();
      setShowModal(false);
      setEditingEmployee(null);
    } catch (err) {
      console.error("Update error:", err);
      alert("Update failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading employees...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!Array.isArray(employees)) {
    return <Alert variant="danger">Data error: employees list is invalid.</Alert>;
  }

  return (
    <>
      <div className="employee-management-container">
        <div className="page-header">
          <h2>👥 Employee Management</h2>
          <p>Manage all employee records – edit personal details, designation, team lead, etc.</p>
        </div>

        {employees.length === 0 ? (
          <Alert variant="info">No employees found.</Alert>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Designation</th>
                  <th>Team Lead</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td data-label="Name">{emp.name}</td>
                    <td data-label="Email">{emp.email}</td>
                    <td data-label="Phone">{emp.phone}</td>
                    <td data-label="Gender">{emp.gender}</td>
                    <td data-label="Designation">{emp.designation || "-"}</td>
                    <td data-label="Team Lead">{emp.teamLead?.name || "None"}</td>
                    <td data-label="Actions">
                      <button className="edit-employee-btn" onClick={() => handleEdit(emp)}>
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal – same Bootstrap modal but enhanced with custom styling */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" className="modern-modal">
        <Modal.Header closeButton>
          <Modal.Title>✏️ Edit Employee: {editingEmployee?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="form-grid">
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Designation</Form.Label>
                <Form.Select name="designation" value={formData.designation} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="team lead">Team Lead</option>
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="FE">FE</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Team Lead</Form.Label>
                <Form.Select name="teamLead" value={formData.teamLead} onChange={handleChange}>
                  <option value="">None</option>
                  {teamLeads.map((lead) => (
                    <option key={lead._id} value={lead._id}>
                      {lead.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3 full-width">
                <Form.Label>Address</Form.Label>
                <Form.Control type="text" name="address" value={formData.address} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3 full-width">
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
              </Form.Group>
            </div>

            <h5 className="section-title">🚨 Emergency Contact</h5>
            <div className="form-grid">
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleChange(e, "emergencyContact", "name")}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleChange(e, "emergencyContact", "phone")}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Relationship</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleChange(e, "emergencyContact", "relationship")}
                />
              </Form.Group>
            </div>

            <h5 className="section-title">🏦 Bank Details</h5>
            <div className="form-grid">
              <Form.Group className="mb-3">
                <Form.Label>Account Number</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => handleChange(e, "bankDetails", "accountNumber")}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Bank Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.bankDetails.bankName}
                  onChange={(e) => handleChange(e, "bankDetails", "bankName")}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>IFSC Code</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) => handleChange(e, "bankDetails", "ifscCode")}
                />
              </Form.Group>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate} disabled={updating} className="save-btn">
            {updating ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .employee-management-container {
          background: white;
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }

        .page-header {
          margin-bottom: 28px;
        }

        .page-header h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #1e293b, #4f46e5);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .page-header p {
          color: #64748b;
          margin: 0;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: white;
        }

        .modern-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .modern-table thead tr {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }

        .modern-table th {
          text-align: left;
          padding: 16px 16px;
          font-weight: 600;
          color: #1e293b;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }

        .modern-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        .modern-table tbody tr:hover {
          background: #fefce8;
          transition: background 0.2s ease;
        }

        .edit-employee-btn {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: none;
          color: white;
          padding: 6px 14px;
          border-radius: 40px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-employee-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        /* Modern Modal Overrides */
        .modern-modal .modal-content {
          border-radius: 28px;
          border: none;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modern-modal .modal-header {
          border-bottom: 2px solid #eef2ff;
          padding: 20px 28px;
          background: #fafbff;
          border-radius: 28px 28px 0 0;
        }

        .modern-modal .modal-title {
          font-weight: 700;
          font-size: 1.3rem;
          background: linear-gradient(135deg, #1e293b, #4f46e5);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .modern-modal .modal-body {
          padding: 28px;
        }

        .modal-footer {
          border-top: 1px solid #eef2ff;
          padding: 20px 28px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .full-width {
          grid-column: span 2;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 24px 0 16px 0;
          color: #0f172a;
          border-left: 4px solid #10b981;
          padding-left: 12px;
        }

        .form-label {
          font-weight: 600;
          color: #334155;
          font-size: 0.8rem;
          margin-bottom: 6px;
        }

        .form-control, .form-select {
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          padding: 10px 14px;
          transition: all 0.2s;
        }

        .form-control:focus, .form-select:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .save-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          padding: 10px 24px;
          border-radius: 40px;
          font-weight: 600;
        }

        .save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(16, 185, 129, 0.3);
        }

        @media (max-width: 768px) {
          .employee-management-container {
            padding: 16px;
          }
          .form-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .full-width {
            grid-column: span 1;
          }
          .modern-table thead {
            display: none;
          }
          .modern-table tbody tr {
            display: block;
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 12px;
          }
          .modern-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 0;
          }
          .modern-table td:last-child {
            border-bottom: none;
          }
          .modern-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #0f172a;
            width: 40%;
          }
        }
      `}</style>
    </>
  );
}