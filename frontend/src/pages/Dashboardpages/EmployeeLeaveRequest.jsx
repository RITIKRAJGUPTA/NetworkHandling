import { useState, useEffect } from "react";
import axios from "axios";
import { Alert, Spinner, Table, Form, Button, Modal } from "react-bootstrap";

const BACKEND_URL = "http://localhost:5000";

export default function EmployeeLeaveRequest({ userId }) {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/leave`, axiosConfig);
      setLeaveRequests(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("Fetch leaves error:", err);
      setError("Failed to load your leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${BACKEND_URL}/api/leave`, formData, axiosConfig);
      fetchMyLeaves();
      setShowModal(false);
      setFormData({ startDate: "", endDate: "", reason: "" });
    } catch (err) {
      alert("Failed to submit request: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = { pending: "warning", approved: "success", rejected: "danger" };
    return <span className={`badge bg-${colors[status]}`}>{status}</span>;
  };

  if (loading && leaveRequests.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading your leave requests...</p>
      </div>
    );
  }

  return (
    <div className="employee-leave-container">
      <div className="page-header">
        <h3>📝 Leave Requests</h3>
        <p>Request time off and track your leave history</p>
      </div>

      <button className="new-request-btn" onClick={() => setShowModal(true)}>
        + New Leave Request
      </button>

      {error && <Alert variant="danger">{error}</Alert>}

      {leaveRequests.length === 0 ? (
        <Alert variant="info">No leave requests found.</Alert>
      ) : (
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((req) => (
                <tr key={req._id}>
                  <td data-label="Start Date">{new Date(req.startDate).toLocaleDateString()}</td>
                  <td data-label="End Date">{new Date(req.endDate).toLocaleDateString()}</td>
                  <td data-label="Reason">{req.reason}</td>
                  <td data-label="Status">{getStatusBadge(req.status)}</td>
                  <td data-label="Remarks">{req.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal – keep Bootstrap but override with custom CSS */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="custom-modal">
        <Modal.Header closeButton>
          <Modal.Title>Request Leave</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="dark-input" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="dark-input" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control as="textarea" rows={3} name="reason" value={formData.reason} onChange={handleChange} required className="dark-input" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} className="cancel-modal-btn">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting} className="submit-modal-btn">
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .employee-leave-container {
          background: rgba(15, 25, 45, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 28px;
          padding: 28px;
          border: 1px solid rgba(0, 212, 255, 0.2);
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h3 {
          margin: 0;
          background: linear-gradient(135deg, #ffffff, #00d4ff);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .page-header p {
          color: #9aa4bf;
          margin-top: 6px;
        }
        .new-request-btn {
          background: linear-gradient(90deg, #00b4d8, #0077b6);
          border: none;
          color: white;
          padding: 8px 20px;
          border-radius: 40px;
          font-weight: 600;
          margin-bottom: 24px;
          transition: 0.2s;
          cursor: pointer;
        }
        .new-request-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(0,180,216,0.3);
        }
        .alert {
          border-radius: 20px;
          background: rgba(0,212,255,0.1);
          border: none;
          color: #00d4ff;
        }
        .alert-danger {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
        }
        .alert-info {
          background: rgba(0,212,255,0.1);
          color: #00d4ff;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 20px;
          border: 1px solid #2a3a55;
          background: rgba(10,18,32,0.5);
        }
        .modern-table {
          width: 100%;
          border-collapse: collapse;
          color: #cbd5e1;
        }
        .modern-table thead th {
          background: rgba(0,212,255,0.05);
          color: #00d4ff;
          border-bottom: 1px solid #2a3a55;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 12px;
        }
        .modern-table tbody td {
          padding: 12px;
          border-bottom: 1px solid #1e2a3a;
          vertical-align: middle;
        }
        .modern-table tbody tr:hover {
          background: rgba(0,212,255,0.05);
        }
        .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .bg-warning { background: #f59e0b !important; color: white; }
        .bg-success { background: #10b981 !important; color: white; }
        .bg-danger { background: #ef4444 !important; color: white; }
        /* Modal dark theme */
        .custom-modal .modal-content {
          background: #0f172a;
          border-radius: 28px;
          border: 1px solid rgba(0,212,255,0.3);
        }
        .custom-modal .modal-header {
          border-bottom: 1px solid #2a3a55;
          background: #0a0f1e;
        }
        .custom-modal .modal-title {
          color: #00d4ff;
          font-weight: 700;
        }
        .custom-modal .modal-header .btn-close {
          filter: invert(1) brightness(2);
        }
        .custom-modal .modal-body {
          color: #cbd5e1;
        }
        .custom-modal .form-label {
          color: #b0bedb;
        }
        .dark-input {
          background: rgba(0,0,0,0.4);
          border: 1px solid #2a3a55;
          border-radius: 40px;
          color: #fff;
          padding: 10px 16px;
        }
        .dark-input:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }
        .custom-modal .modal-footer {
          border-top: 1px solid #2a3a55;
        }
        .cancel-modal-btn {
          background: #1e293b;
          border: none;
          color: #cbd5e1;
          border-radius: 40px;
          padding: 8px 20px;
        }
        .cancel-modal-btn:hover {
          background: #334155;
        }
        .submit-modal-btn {
          background: linear-gradient(90deg, #00b4d8, #0077b6);
          border: none;
          border-radius: 40px;
          padding: 8px 24px;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .employee-leave-container { padding: 16px; }
          .modern-table thead { display: none; }
          .modern-table tbody tr {
            display: block;
            margin-bottom: 16px;
            border: 1px solid #2a3a55;
            border-radius: 16px;
            padding: 12px;
          }
          .modern-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid #1e2a3a;
          }
          .modern-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #00d4ff;
            width: 40%;
          }
        }
      `}</style>
    </div>
  );
}