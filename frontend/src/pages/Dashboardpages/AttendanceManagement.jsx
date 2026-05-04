import { useState, useEffect } from "react";
import axios from "axios";
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
    checkIn: "",
    checkOut: "",
    remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Bulk selection
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    status: "present",
    checkIn: "",
    checkOut: "",
    remarks: "",
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
    } catch (err) {
      console.error("Error fetching history:", err);
      alert("Failed to load attendance history");
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

  // Single employee modal handlers
  const handleMarkAttendance = (employee) => {
    setSelectedEmployee(employee);
    const existing = attendanceRecords.find((rec) => rec.employee?._id === employee._id);
    setFormData({
      status: existing?.status || "present",
      checkIn: existing?.checkIn || "",
      checkOut: existing?.checkOut || "",
      remarks: existing?.remarks || "",
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
      fetchAttendance();
      setShowModal(false);
    } catch (err) {
      alert("Failed to save attendance: " + (err.response?.data?.message || err.message));
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
      alert("Please select at least one employee.");
      return;
    }
    setBulkFormData({
      status: "present",
      checkIn: "",
      checkOut: "",
      remarks: "",
    });
    setShowBulkModal(true);
  };

  const handleBulkChange = (e) => {
    setBulkFormData({ ...bulkFormData, [e.target.name]: e.target.value });
  };

  const handleBulkSubmit = async () => {
    setBulkSubmitting(true);
    try {
      const validEmployeeIds = selectedEmployees.filter(
        (id) => id && typeof id === "string" && id.trim() !== ""
      );
      if (validEmployeeIds.length === 0) {
        alert("No valid employees selected.");
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
      alert(message);
      setShowBulkModal(false);
      setSelectedEmployees([]);
      fetchAttendance();
    } catch (err) {
      console.error("Bulk update error:", err);
      alert("Bulk update failed: " + (err.response?.data?.message || err.message));
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
  };

  const exportToday = () => {
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
    <div className="container mt-4">
      <h3>Attendance Management</h3>
      <p>Mark daily attendance for employees</p>

      {/* Daily view controls */}
      <div className="row mb-4 align-items-end">
        <div className="col-md-3">
          <Form.Label>Select Date</Form.Label>
          <Form.Control
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <Button variant="success" onClick={exportToday}>
            📥 Export Today
          </Button>
        </div>
        <div className="col-md-2">
          {selectedEmployees.length > 0 && (
            <Button variant="primary" onClick={handleBulkUpdate}>
              Bulk Update ({selectedEmployees.length})
            </Button>
          )}
        </div>
        <div className="col-md-3">
          <Button variant="secondary" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? "Hide History" : "📋 View All History"}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Daily attendance table */}
      <Table striped bordered hover responsive>
        <thead className="table-light">
          <tr>
            <th>
              <Form.Check
                type="checkbox"
                onChange={handleSelectAll}
                checked={employees.length > 0 && selectedEmployees.length === employees.length}
                indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < employees.length}
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
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedEmployees.includes(emp._id)}
                    onChange={() => handleSelectEmployee(emp._id)}
                  />
                </td>
                <td>{emp.name}</td>
                <td>{emp.designation || "-"}</td>
                <td>{record ? getStatusBadge(record.status) : getStatusBadge("absent")}</td>
                <td>{record?.checkIn || "-"}</td>
                <td>{record?.checkOut || "-"}</td>
                <td>{record?.remarks || "-"}</td>
                <td>
                  <Button size="sm" variant="outline-primary" onClick={() => handleMarkAttendance(emp)}>
                    {record ? "Update" : "Mark"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Attendance History Section */}
      {showHistory && (
        <div className="mt-5">
          <h4>Attendance History</h4>
          <div className="row mb-3 align-items-end">
            <div className="col-md-3">
              <Form.Label>From Date</Form.Label>
              <Form.Control
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <Form.Label>To Date</Form.Label>
              <Form.Control
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <Button variant="success" onClick={exportHistory}>
                📥 Export History
              </Button>
            </div>
            <div className="col-md-2">
              <Button variant="secondary" onClick={fetchHistory}>
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
            <Table striped bordered hover responsive>
              <thead className="table-dark">
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
                    <td>{rec.employee?.name} ({rec.employee?.designation})</td>
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
      )}

      {/* Single employee modal (unchanged) */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mark Attendance - {selectedEmployee?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={formData.status} onChange={handleChange}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
                <option value="leave">Leave</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Check In Time (HH:MM)</Form.Label>
              <Form.Control type="time" name="checkIn" value={formData.checkIn} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Check Out Time (HH:MM)</Form.Label>
              <Form.Control type="time" name="checkOut" value={formData.checkOut} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control as="textarea" rows={2} name="remarks" value={formData.remarks} onChange={handleChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Attendance"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk update modal (unchanged) */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Bulk Update Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Applying to <strong>{selectedEmployees.length}</strong> employee(s) for date{" "}
            <strong>{selectedDate}</strong>.
          </p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={bulkFormData.status} onChange={handleBulkChange}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
                <option value="leave">Leave</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Check In Time (HH:MM)</Form.Label>
              <Form.Control type="time" name="checkIn" value={bulkFormData.checkIn} onChange={handleBulkChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Check Out Time (HH:MM)</Form.Label>
              <Form.Control type="time" name="checkOut" value={bulkFormData.checkOut} onChange={handleBulkChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remarks (applies to all)</Form.Label>
              <Form.Control as="textarea" rows={2} name="remarks" value={bulkFormData.remarks} onChange={handleBulkChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleBulkSubmit} disabled={bulkSubmitting}>
            {bulkSubmitting ? "Updating..." : "Update All"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}