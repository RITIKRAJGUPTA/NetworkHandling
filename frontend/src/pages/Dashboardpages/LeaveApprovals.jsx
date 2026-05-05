import { useState, useEffect } from "react";
import axios from "axios";
import { Alert, Spinner, Table, Form, Button, Modal } from "react-bootstrap";

const BACKEND_URL = "http://localhost:5000";

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("pending");

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/leave?status=${filterStatus}`, axiosConfig);
      setLeaves(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("Fetch leaves error:", err);
      setError("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filterStatus]);

  const openReviewModal = (leave, actionType) => {
    setSelectedLeave(leave);
    setAction(actionType);
    setRemarks("");
    setShowModal(true);
  };

  const handleReview = async () => {
    setSubmitting(true);
    try {
      await axios.put(`${BACKEND_URL}/api/leave/${selectedLeave._id}`, {
        status: action,
        remarks: remarks,
      }, axiosConfig);
      fetchLeaves();
      setShowModal(false);
    } catch (err) {
      alert("Failed to update: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = { pending: "warning", approved: "success", rejected: "danger" };
    return <span className={`badge bg-${colors[status]}`}>{status}</span>;
  };

  if (loading && leaves.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading leave requests...</p>
      </div>
    );
  }

  return (
    <div className="leave-approvals-container">
      <div className="page-header">
        <div>
          <h3>📅 Leave Approvals</h3>
          <p>Review and approve/reject leave requests.</p>
        </div>
      </div>

      <div className="filter-section">
        <Form.Label>Filter by Status</Form.Label>
        <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Form.Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {leaves.length === 0 ? (
        <Alert variant="info">No leave requests found.</Alert>
      ) : (
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  <td data-label="Employee">{leave.employee?.name} ({leave.employee?.designation})</td>
                  <td data-label="Start Date">{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td data-label="End Date">{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td data-label="Reason">{leave.reason}</td>
                  <td data-label="Status">{getStatusBadge(leave.status)}</td>
                  <td data-label="Actions">
                    {leave.status === "pending" && (
                      <div className="action-buttons">
                        <button className="approve-btn" onClick={() => openReviewModal(leave, "approved")}>
                          Approve
                        </button>
                        <button className="reject-btn" onClick={() => openReviewModal(leave, "rejected")}>
                          Reject
                        </button>
                      </div>
                    )}
                    {leave.status !== "pending" && <span className="reviewed-text">Reviewed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal – keep Bootstrap styling but ensure dark theme */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="custom-modal">
        <Modal.Header closeButton>
          <Modal.Title>{action === "approved" ? "Approve" : "Reject"} Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Employee:</strong> {selectedLeave?.employee?.name}</p>
          <p><strong>Dates:</strong> {selectedLeave && new Date(selectedLeave.startDate).toLocaleDateString()} to {selectedLeave && new Date(selectedLeave.endDate).toLocaleDateString()}</p>
          <p><strong>Reason:</strong> {selectedLeave?.reason}</p>
          <Form.Group className="mb-3">
            <Form.Label>Remarks (optional)</Form.Label>
            <Form.Control as="textarea" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant={action === "approved" ? "success" : "danger"} onClick={handleReview} disabled={submitting}>
            {submitting ? "Processing..." : "Confirm"}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .leave-approvals-container {
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
        .filter-section {
          max-width: 250px;
          margin-bottom: 24px;
        }
        .filter-section label {
          color: #b0bedb;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .filter-section select {
          background: rgba(0,0,0,0.4);
          border: 1px solid #2a3a55;
          border-radius: 40px;
          color: #fff;
          padding: 10px 16px;
        }
        .filter-section select:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 12px rgba(0,212,255,0.2);
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
          font-size: 0.85rem;
        }
        .modern-table th {
          text-align: left;
          padding: 14px 12px;
          color: #00d4ff;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #2a3a55;
        }
        .modern-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #1e2a3a;
          color: #cbd5e1;
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
        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .approve-btn {
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.3);
          color: #10b981;
          padding: 4px 12px;
          border-radius: 40px;
          font-size: 0.7rem;
          font-weight: 500;
          cursor: pointer;
          transition: 0.2s;
        }
        .approve-btn:hover {
          background: rgba(16,185,129,0.25);
          transform: translateY(-1px);
        }
        .reject-btn {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
          padding: 4px 12px;
          border-radius: 40px;
          font-size: 0.7rem;
          font-weight: 500;
          cursor: pointer;
          transition: 0.2s;
        }
        .reject-btn:hover {
          background: rgba(239,68,68,0.25);
          transform: translateY(-1px);
        }
        .reviewed-text {
          color: #7f8fa4;
          font-size: 0.8rem;
        }
        /* Modal dark theme overrides */
        .custom-modal .modal-content {
          background: #0f172a;
          border-radius: 28px;
          border: 1px solid rgba(0,212,255,0.3);
        }
        .custom-modal .modal-header {
          border-bottom: 1px solid #2a3a55;
          background: #0a0f1e;
          color: white;
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
        .custom-modal .modal-body strong {
          color: #00d4ff;
        }
        .custom-modal .form-label {
          color: #b0bedb;
        }
        .custom-modal .form-control {
          background: rgba(0,0,0,0.4);
          border: 1px solid #2a3a55;
          color: #fff;
          border-radius: 20px;
        }
        .custom-modal .form-control:focus {
          border-color: #00d4ff;
          box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }
        .custom-modal .modal-footer {
          border-top: 1px solid #2a3a55;
        }
        .custom-modal .btn-secondary {
          background: #1e293b;
          border: none;
          color: #cbd5e1;
          border-radius: 40px;
        }
        .custom-modal .btn-secondary:hover {
          background: #334155;
        }
        .custom-modal .btn-success {
          background: #10b981;
          border: none;
          border-radius: 40px;
        }
        .custom-modal .btn-danger {
          background: #ef4444;
          border: none;
          border-radius: 40px;
        }
        @media (max-width: 768px) {
          .leave-approvals-container { padding: 16px; }
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
          .action-buttons { justify-content: flex-end; }
        }
      `}</style>
    </div>
  );
}