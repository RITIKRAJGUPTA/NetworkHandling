// src/pages/DashboardPages/EmployeeAttendance.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Alert, Spinner, Table, Form, Button } from "react-bootstrap";

const BACKEND_URL = "http://localhost:5000";

export default function EmployeeAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // first day of current month
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/attendance?startDate=${startDate}&endDate=${endDate}`,
        axiosConfig
      );
      setRecords(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("Fetch attendance error:", err);
      setError("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate]);

  const getStatusBadge = (status) => {
    const colors = {
      present: "success",
      absent: "danger",
      "half-day": "warning",
      leave: "secondary",
    };
    return <span className={`badge bg-${colors[status] || "light"}`}>{status}</span>;
  };

  if (loading && records.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading your attendance...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h3>My Attendance History</h3>
      <p>View your daily attendance records.</p>

      <div className="row mb-4 align-items-end">
        <div className="col-md-3">
          <Form.Label>From Date</Form.Label>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <Form.Label>To Date</Form.Label>
          <Form.Control
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <Button variant="secondary" onClick={fetchAttendance}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {records.length === 0 ? (
        <Alert variant="info">No attendance records found for the selected period.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec._id}>
                <td>{new Date(rec.date).toLocaleDateString()}</td>
                <td>{getStatusBadge(rec.status)}</td>
                <td>{rec.checkIn || "-"}</td>
                <td>{rec.checkOut || "-"}</td>
                <td>{rec.remarks || "-"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}