import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Alert, Spinner, Table, Form, Button, Modal } from "react-bootstrap";
import * as XLSX from "xlsx";

const BACKEND_URL = "http://localhost:5000";

export default function AttendanceManagement() {
  // Existing state (daily)
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    status: "present",
    checkIn: "10:00",
    checkOut: "18:00",
    remarks: "Present",
  });
  const [submitting, setSubmitting] = useState(false);

  // Bulk selection
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    status: "present",
    checkIn: "10:00",
    checkOut: "18:00",
    remarks: "Present",
  });
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyStartDate, setHistoryStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [historyEndDate, setHistoryEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch all employees (for daily view)
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/attendance/employees`, axiosConfig);
      if (Array.isArray(res.data)) setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employee list");
      toast.error("Failed to load employee list");
    }
  };

  // Fetch attendance for selected date (daily)
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/attendance?date=${selectedDate}`, axiosConfig);
      setAttendanceRecords(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance records");
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  // Fetch history based on date range
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/attendance?startDate=${historyStartDate}&endDate=${historyEndDate}`,
        axiosConfig
      );
      setHistoryRecords(Array.isArray(res.data) ? res.data : []);
      toast.success("History loaded");
    } catch (err) {
      console.error("Error fetching history:", err);
      toast.error("Failed to load attendance history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedDate) fetchAttendance();
  }, [selectedDate]);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, historyStartDate, historyEndDate]);

  // When status changes in single modal, update remarks accordingly
  const handleSingleStatusChange = (e) => {
    const newStatus = e.target.value;
    let remarks = "";
    switch (newStatus) {
      case "present": remarks = "Present"; break;
      case "absent": remarks = "Absent"; break;
      case "half-day": remarks = "Half Day"; break;
      case "leave": remarks = "On Leave"; break;
      default: remarks = "";
    }
    setFormData(prev => ({ ...prev, status: newStatus, remarks }));
  };

  // Single employee modal handlers
  const handleMarkAttendance = (employee) => {
    setSelectedEmployee(employee);
    const existing = attendanceRecords.find((rec) => rec.employee?._id === employee._id);
    setFormData({
      status: existing?.status || "present",
      checkIn: existing?.checkIn || "10:00",
      checkOut: existing?.checkOut || "18:00",
      remarks: existing?.remarks || (existing?.status === "present" ? "Present" : existing?.status === "absent" ? "Absent" : existing?.status === "half-day" ? "Half Day" : existing?.status === "leave" ? "On Leave" : ""),
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/attendance`,
        {
          employeeId: selectedEmployee._id,
          date: selectedDate,
          status: formData.status,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          remarks: formData.remarks,
        },
        axiosConfig
      );
      toast.success("Attendance saved successfully");
      fetchAttendance();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(employees.map((emp) => emp._id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (empId) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleBulkUpdate = () => {
    if (selectedEmployees.length === 0) {
      toast.warning("Please select at least one employee.");
      return;
    }
    setBulkFormData({
      status: "present",
      checkIn: "10:00",
      checkOut: "18:00",
      remarks: "Present",
    });
    setShowBulkModal(true);
  };

  const handleBulkChange = (e) => {
    const { name, value } = e.target;
    let newRemarks = bulkFormData.remarks;
    if (name === "status") {
      switch (value) {
        case "present": newRemarks = "Present"; break;
        case "absent": newRemarks = "Absent"; break;
        case "half-day": newRemarks = "Half Day"; break;
        case "leave": newRemarks = "On Leave"; break;
        default: newRemarks = "";
      }
    }
    setBulkFormData(prev => ({ ...prev, [name]: value, remarks: name === "status" ? newRemarks : prev.remarks }));
  };

  const handleBulkSubmit = async () => {
    setBulkSubmitting(true);
    try {
      const validEmployeeIds = selectedEmployees.filter(
        (id) => id && typeof id === "string" && id.trim() !== ""
      );
      if (validEmployeeIds.length === 0) {
        toast.warning("No valid employees selected.");
        setBulkSubmitting(false);
        return;
      }
      const records = validEmployeeIds.map((empId) => ({
        employeeId: empId,
        status: bulkFormData.status,
        checkIn: bulkFormData.checkIn,
        checkOut: bulkFormData.checkOut,
        remarks: bulkFormData.remarks,
      }));
      const response = await axios.post(
        `${BACKEND_URL}/api/attendance/bulk`,
        { date: selectedDate, records },
        axiosConfig
      );
      const { succeeded, failed, validationErrors } = response.data;
      let message = `Bulk update completed: ${succeeded} succeeded, ${failed} failed.`;
      if (validationErrors && validationErrors.length > 0) {
        message += `\nDetails: ${validationErrors.map((e) => `ID ${e.employeeId}: ${e.error}`).join(", ")}`;
      }
      toast.success(message);
      setShowBulkModal(false);
      setSelectedEmployees([]);
      fetchAttendance();
    } catch (err) {
      console.error("Bulk update error:", err);
      toast.error(err.response?.data?.message || "Bulk update failed");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Export functions
  const exportToExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const exportToday = () => {
    if (employees.length === 0) {
      toast.warning("No employee data to export");
      return;
    }
    const todayData = employees.map((emp) => {
      const record = attendanceRecords.find((r) => r.employee?._id === emp._id);
      return {
        "Employee Name": emp.name,
        Designation: emp.designation || "-",
        Status: record?.status || "absent",
        "Check In": record?.checkIn || "-",
        "Check Out": record?.checkOut || "-",
        Remarks: record?.remarks || "-",
        Date: selectedDate,
      };
    });
    exportToExcel(todayData, `attendance_${selectedDate}`);
  };

  const exportHistory = () => {
    if (historyRecords.length === 0) {
      toast.warning("No history data to export");
      return;
    }
    const historyData = historyRecords.map((rec) => ({
      "Employee Name": rec.employee?.name || "Unknown",
      Designation: rec.employee?.designation || "-",
      Date: new Date(rec.date).toLocaleDateString(),
      Status: rec.status,
      "Check In": rec.checkIn || "-",
      "Check Out": rec.checkOut || "-",
      Remarks: rec.remarks || "-",
    }));
    exportToExcel(historyData, `attendance_history_${historyStartDate}_to_${historyEndDate}`);
  };

  const getStatusBadge = (status) => {
    const colors = {
      present: "success",
      absent: "danger",
      "half-day": "warning",
      leave: "secondary",
    };
    return <span className={`badge bg-${colors[status] || "light"}`}>{status}</span>;
  };

  if (loading && attendanceRecords.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading attendance...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="attendance-management-container">
        <div className="page-header">
          <h3>📅 Attendance Management</h3>
          <p>Mark daily attendance for employees</p>
        </div>

        {/* Daily view controls */}
        <div className="controls-row">
          <div className="control-group">
            <Form.Label>Select Date</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="dark-input"
            />
          </div>
          <div className="control-group">
            <Button variant="success" onClick={exportToday} className="btn-excel">
              📥 Export Today
            </Button>
          </div>
          <div className="control-group">
            {selectedEmployees.length > 0 && (
              <Button variant="primary" onClick={handleBulkUpdate} className="btn-bulk">
                Bulk Update ({selectedEmployees.length})
              </Button>
            )}
          </div>
          <div className="control-group">
            <Button variant="secondary" onClick={() => setShowHistory(!showHistory)} className="btn-history">
              {showHistory ? "Hide History" : "📋 View All History"}
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Daily attendance table */}
        <div className="table-wrapper">
          <Table striped bordered hover responsive className="dark-table">
            <thead>
              <tr>
                <th>
                  <Form.Check
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={employees.length > 0 && selectedEmployees.length === employees.length}
                    indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < employees.length}
                    className="dark-checkbox"
                  />
                </th>
                <th>Employee Name</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const record = attendanceRecords.find((r) => r.employee?._id === emp._id);
                return (
                  <tr key={emp._id}>
                    <td data-label="Select">
                      <Form.Check
                        type="checkbox"
                        checked={selectedEmployees.includes(emp._id)}
                        onChange={() => handleSelectEmployee(emp._id)}
                        className="dark-checkbox"
                      />
                    </td>
                    <td data-label="Employee Name">{emp.name}</td>
                    <td data-label="Designation">{emp.designation || "-"}</td>
                    <td data-label="Status">{record ? getStatusBadge(record.status) : getStatusBadge("absent")}</td>
                    <td data-label="Check In">{record?.checkIn || "-"}</td>
                    <td data-label="Check Out">{record?.checkOut || "-"}</td>
                    <td data-label="Remarks">{record?.remarks || "-"}</td>
                    <td data-label="Actions">
                      <Button size="sm" variant="outline-primary" onClick={() => handleMarkAttendance(emp)} className="mark-btn">
                        {record ? "Update" : "Mark"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {/* Attendance History Section */}
        {showHistory && (
          <div className="history-section">
            <h4>Attendance History</h4>
            <div className="history-controls">
              <div className="control-group">
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                  className="dark-input"
                />
              </div>
              <div className="control-group">
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                  className="dark-input"
                />
              </div>
              <div className="control-group">
                <Button variant="success" onClick={exportHistory} className="btn-excel">
                  📥 Export History
                </Button>
              </div>
              <div className="control-group">
                <Button variant="secondary" onClick={fetchHistory} className="btn-refresh">
                  🔄 Refresh
                </Button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p>Loading history...</p>
              </div>
            ) : historyRecords.length === 0 ? (
              <Alert variant="info">No attendance records found for the selected period.</Alert>
            ) : (
              <div className="table-wrapper">
                <Table striped bordered hover responsive className="dark-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((rec) => (
                      <tr key={rec._id}>
                        <td data-label="Employee">{rec.employee?.name} ({rec.employee?.designation})</td>
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
          </div>
        )}

        {/* Single employee modal (dark themed) */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered className="custom-modal">
          <Modal.Header closeButton>
            <Modal.Title>Mark Attendance - {selectedEmployee?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select name="status" value={formData.status} onChange={handleSingleStatusChange} className="dark-input">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half Day</option>
                  <option value="leave">Leave</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Check In Time (HH:MM)</Form.Label>
                <Form.Control type="time" name="checkIn" value={formData.checkIn} onChange={handleChange} className="dark-input" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Check Out Time (HH:MM)</Form.Label>
                <Form.Control type="time" name="checkOut" value={formData.checkOut} onChange={handleChange} className="dark-input" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Remarks</Form.Label>
                <Form.Control as="textarea" rows={2} name="remarks" value={formData.remarks} onChange={handleChange} className="dark-input" />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} className="cancel-modal-btn">Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting} className="submit-modal-btn">
              {submitting ? "Saving..." : "Save Attendance"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Bulk update modal (dark themed) */}
        <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered className="custom-modal">
          <Modal.Header closeButton>
            <Modal.Title>Bulk Update Attendance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Applying to <strong>{selectedEmployees.length}</strong> employee(s) for date <strong>{selectedDate}</strong>.
            </p>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select name="status" value={bulkFormData.status} onChange={handleBulkChange} className="dark-input">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half Day</option>
                  <option value="leave">Leave</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Check In Time (HH:MM)</Form.Label>
                <Form.Control type="time" name="checkIn" value={bulkFormData.checkIn} onChange={handleBulkChange} className="dark-input" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Check Out Time (HH:MM)</Form.Label>
                <Form.Control type="time" name="checkOut" value={bulkFormData.checkOut} onChange={handleBulkChange} className="dark-input" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Remarks (applies to all)</Form.Label>
                <Form.Control as="textarea" rows={2} name="remarks" value={bulkFormData.remarks} onChange={handleBulkChange} className="dark-input" />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBulkModal(false)} className="cancel-modal-btn">Cancel</Button>
            <Button variant="primary" onClick={handleBulkSubmit} disabled={bulkSubmitting} className="submit-modal-btn">
              {bulkSubmitting ? "Updating..." : "Update All"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <style>{`
        .attendance-management-container {
          background: rgba(15, 25, 45, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 28px;
          padding: 28px;
          border: 1px solid rgba(0, 212, 255, 0.2);
        }
        .page-header {
          margin-bottom: 28px;
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
        .controls-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-end;
          margin-bottom: 24px;
        }
        .control-group {
          min-width: 160px;
          flex: 1;
        }
        .control-group .form-label {
          color: #b0bedb;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
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
        .btn-excel, .btn-bulk, .btn-history, .btn-refresh {
          background: rgba(0,212,255,0.15);
          border: 1px solid rgba(0,212,255,0.3);
          color: #00d4ff;
          padding: 10px 20px;
          border-radius: 40px;
          transition: 0.2s;
        }
        .btn-excel:hover, .btn-bulk:hover, .btn-history:hover, .btn-refresh:hover {
          background: rgba(0,212,255,0.25);
          transform: translateY(-1px);
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 20px;
          border: 1px solid #2a3a55;
          background: rgba(10,18,32,0.5);
          margin-bottom: 24px;
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
        .dark-checkbox {
          background-color: transparent;
          accent-color: #00d4ff;
        }
        .mark-btn {
          background: rgba(0,212,255,0.15);
          border: 1px solid rgba(0,212,255,0.3);
          color: #00d4ff;
          border-radius: 40px;
          padding: 4px 12px;
        }
        .mark-btn:hover {
          background: rgba(0,212,255,0.25);
        }
        .history-section {
          margin-top: 32px;
          border-top: 1px solid rgba(0,212,255,0.2);
          padding-top: 24px;
        }
        .history-section h4 {
          color: #00d4ff;
          margin-bottom: 20px;
        }
        .history-controls {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-end;
          margin-bottom: 24px;
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
        /* Modal dark theme */
        .custom-modal .modal-content {
          background: #0f172a;
          border-radius: 28px;
          border: 1px solid rgba(0,212,255,0.3);
        }
        .custom-modal .modal-header {
          border-bottom: 1px solid #2a3a55;
          background: #0a0f1e;
          border-radius: 28px 28px 0 0;
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
        .custom-modal .dark-input {
          background: rgba(0,0,0,0.4);
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
        .submit-modal-btn {
          background: linear-gradient(90deg, #00b4d8, #0077b6);
          border: none;
          border-radius: 40px;
          padding: 8px 24px;
          font-weight: 600;
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
          .attendance-management-container { padding: 16px; }
          .controls-row, .history-controls { flex-direction: column; gap: 12px; }
          .control-group { min-width: auto; }
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
            border-bottom: none;
          }
          .dark-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #00d4ff;
            width: 40%;
          }
        }
      `}</style>
    </>
  );
}