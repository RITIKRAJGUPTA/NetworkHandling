// src/pages/DashboardPages/EmployeeAttendance.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Alert, Spinner, Table, Form, Button } from "react-bootstrap";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function EmployeeAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
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
    <div className="employee-attendance-container">
      <div className="page-header">
        <h3>📅 My Attendance History</h3>
        <p>View your daily attendance records.</p>
      </div>

      <div className="filters-row">
        <div className="filter-item">
          <Form.Label>From Date</Form.Label>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="dark-input"
          />
        </div>
        <div className="filter-item">
          <Form.Label>To Date</Form.Label>
          <Form.Control
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="dark-input"
          />
        </div>
        <div className="filter-item">
          <Button variant="secondary" onClick={fetchAttendance} className="refresh-btn-dark">
            🔄 Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {records.length === 0 ? (
        <Alert variant="info">No attendance records found for the selected period.</Alert>
      ) : (
        <div className="table-wrapper">
          <Table striped bordered hover responsive className="dark-table">
            <thead>
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
                  <td data-label="Date">{new Date(rec.date).toLocaleDateString()}</td>
                  <td data-label="Status">{getStatusBadge(rec.status)}</td>
                  <td data-label="Check In">{rec.checkIn || "-"}</td>
                  <td data-label="Check Out">{rec.checkOut || "-"}</td>
                  <td data-label="Remarks">{rec.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <style>{`
        .employee-attendance-container {
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
        .filters-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-end;
          margin-bottom: 24px;
        }
        .filter-item {
          min-width: 180px;
          flex: 1;
        }
        .filter-item .form-label {
          color: #b0bedb;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .dark-input {
          background: rgba(0, 0, 0, 0.4);
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
        .refresh-btn-dark {
          background: rgba(0,212,255,0.15);
          border: 1px solid rgba(0,212,255,0.3);
          color: #00d4ff;
          padding: 10px 20px;
          border-radius: 40px;
          transition: 0.2s;
        }
        .refresh-btn-dark:hover {
          background: rgba(0,212,255,0.25);
          transform: translateY(-1px);
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
        .dark-table {
          margin: 0;
          background: transparent;
          color: #cbd5e1;
        }
        .dark-table thead th {
          background: rgba(0,212,255,0.05);
          color: #00d4ff;
          border-bottom: 1px solid #2a3a55;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 12px;
        }
        .dark-table tbody td {
          padding: 12px;
          border-bottom: 1px solid #1e2a3a;
          vertical-align: middle;
        }
        .dark-table tbody tr:hover {
          background: rgba(0,212,255,0.05);
        }
        .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .bg-success { background: #10b981 !important; color: white; }
        .bg-danger { background: #ef4444 !important; color: white; }
        .bg-warning { background: #f59e0b !important; color: white; }
        .bg-secondary { background: #64748b !important; color: white; }
        @media (max-width: 768px) {
          .employee-attendance-container { padding: 16px; }
          .filters-row { flex-direction: column; gap: 12px; }
          .filter-item { min-width: auto; }
          .dark-table thead { display: none; }
          .dark-table tbody tr {
            display: block;
            margin-bottom: 16px;
            border: 1px solid #2a3a55;
            border-radius: 16px;
            padding: 12px;
          }
          .dark-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid #1e2a3a;
          }
          .dark-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #00d4ff;
            width: 40%;
          }
          .dark-table td:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  );
}