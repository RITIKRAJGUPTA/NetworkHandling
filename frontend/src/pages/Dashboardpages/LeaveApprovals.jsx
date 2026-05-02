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
    <div className="container mt-4">
      <h3>Leave Approvals</h3>
      <p>Review and approve/reject leave requests.</p>

      <div className="row mb-4">
        <div className="col-md-3">
          <Form.Label>Filter by Status</Form.Label>
          <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Form.Select>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {leaves.length === 0 ? (
        <Alert variant="info">No leave requests found.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-light">
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
                <td>{leave.employee?.name} ({leave.employee?.designation})</td>
                <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                <td>{leave.reason}</td>
                <td>{getStatusBadge(leave.status)}</td>
                <td>
                  {leave.status === "pending" && (
                    <>
                      <Button size="sm" variant="success" onClick={() => openReviewModal(leave, "approved")}>
                        Approve
                      </Button>{" "}
                      <Button size="sm" variant="danger" onClick={() => openReviewModal(leave, "rejected")}>
                        Reject
                      </Button>
                    </>
                  )}
                  {leave.status !== "pending" && (
                    <span className="text-muted">Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
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
    </div>
  );
}