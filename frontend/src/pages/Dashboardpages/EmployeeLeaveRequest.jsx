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
    <div className="container mt-4">
      <h3>Leave Requests</h3>
      <Button variant="primary" className="mb-3" onClick={() => setShowModal(true)}>
        + New Leave Request
      </Button>

      {error && <Alert variant="danger">{error}</Alert>}

      {leaveRequests.length === 0 ? (
        <Alert variant="info">No leave requests found.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-light">
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
                <td>{new Date(req.startDate).toLocaleDateString()}</td>
                <td>{new Date(req.endDate).toLocaleDateString()}</td>
                <td>{req.reason}</td>
                <td>{getStatusBadge(req.status)}</td>
                <td>{req.remarks || "-"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Request Leave</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control as="textarea" rows={3} name="reason" value={formData.reason} onChange={handleChange} required />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}