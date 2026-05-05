import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BACKEND_URL = "http://localhost:5000";
const COLORS = ["#00d4ff", "#00b4d8", "#48cae4", "#90e0ef", "#caf0f8"];

export default function Performance({ managerId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    if (managerId) {
      fetchTeamPerformance();
    } else {
      setError("Manager ID not found");
      setLoading(false);
    }
  }, [managerId]);

  const fetchTeamPerformance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/api/performance/team-performance/${managerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        setData(response.data);
        if (response.data.employeePerformance?.length === 0) {
          toast.info(response.data.message || "No data available");
        } else {
          toast.success("Performance data loaded successfully!");
        }
      } else {
        setError(response.data.message || "Failed to load performance data");
        toast.error(response.data.message || "Failed to load performance data");
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to load performance data";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcelReport = () => {
    if (
      !data ||
      !data.employeePerformance ||
      data.employeePerformance.length === 0
    ) {
      toast.warning("No data available to export");
      return;
    }
    try {
      const employeeSummary = data.employeePerformance.map((emp) => ({
        "Employee Name": emp.employeeName,
        Designation: emp.designation,
        "Role Type": emp.isTeamLead ? "Team Lead" : "Team Member",
        "Reports To":
          emp.reportsTo?.name || (emp.isTeamLead ? "Manager" : "Team Lead"),
        "Total Tasks": emp.totalTasks,
        "Completed Tasks": emp.completedTasks,
        "Pending Tasks": emp.pendingTasks,
        "In Progress": emp.inProgressTasks,
        "Overdue Tasks": emp.overdueTasks,
        "Completion Rate (%)": emp.completionRate,
        "Avg Completion Time (days)": emp.avgCompletionTime,
      }));
      const detailedTasks = [];
      data.employeePerformance.forEach((emp) => {
        if (emp.tasks && emp.tasks.length > 0) {
          emp.tasks.forEach((task) => {
            detailedTasks.push({
              Employee: emp.employeeName,
              Designation: emp.designation,
              "Task Title": task.title,
              Status: task.status,
              Priority: task.priority,
              "Due Date": new Date(task.dueDate).toLocaleDateString(),
              "Completed At": task.completedAt
                ? new Date(task.completedAt).toLocaleDateString()
                : "N/A",
              "Assigned By": task.assignedBy,
            });
          });
        }
      });
      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.json_to_sheet(employeeSummary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Employee Summary");
      if (detailedTasks.length > 0) {
        const tasksSheet = XLSX.utils.json_to_sheet(detailedTasks);
        XLSX.utils.book_append_sheet(workbook, tasksSheet, "Detailed Tasks");
      }
      XLSX.writeFile(
        workbook,
        `Performance_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.success("Excel report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel report");
    }
  };

  const downloadPDFReport = () => {
    if (
      !data ||
      !data.employeePerformance ||
      data.employeePerformance.length === 0
    ) {
      toast.warning("No data available to export");
      return;
    }
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(20);
      doc.setTextColor(0, 212, 255);
      doc.text("Team Performance Report", pageWidth / 2, 20, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.setTextColor(180, 190, 219);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, {
        align: "center",
      });
      doc.setFontSize(14);
      doc.setTextColor(0, 212, 255);
      doc.text("Team Overview", 14, 45);
      const teamStats = [
        ["Total Team Members", data.teamStats?.totalMembers?.toString() || "0"],
        ["Team Leads", data.teamStats?.totalTeamLeads?.toString() || "0"],
        ["Team Members", data.teamStats?.totalEmployees?.toString() || "0"],
        ["Total Tasks", data.teamStats?.totalTasks?.toString() || "0"],
        ["Completed Tasks", data.teamStats?.completedTasks?.toString() || "0"],
        ["Team Completion Rate", `${data.teamStats?.teamCompletionRate || 0}%`],
      ];
      autoTable(doc, {
        startY: 50,
        head: [["Metric", "Value"]],
        body: teamStats,
        theme: "striped",
        headStyles: { fillColor: [0, 180, 216] },
        margin: { left: 14 },
      });
      let finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Employee Performance Summary", 14, finalY);
      const employeeData = data.employeePerformance.map((emp) => [
        emp.employeeName,
        emp.designation || "N/A",
        emp.totalTasks?.toString() || "0",
        emp.completedTasks?.toString() || "0",
        `${emp.completionRate || 0}%`,
        `${emp.avgCompletionTime || 0} days`,
      ]);
      autoTable(doc, {
        startY: finalY + 5,
        head: [
          ["Employee", "Designation", "Total", "Completed", "Rate", "Avg Time"],
        ],
        body: employeeData,
        theme: "striped",
        headStyles: { fillColor: [0, 180, 216] },
        margin: { left: 14 },
      });
      doc.save(
        `Performance_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF report: " + error.message);
    }
  };

  const renderCharts = () => {
    if (
      !data ||
      !data.employeePerformance ||
      data.employeePerformance.length === 0
    ) {
      return (
        <div className="alert alert-info">
          No data available to display charts. Please ensure you have team
          members and tasks assigned.
        </div>
      );
    }
    const barChartData = data.employeePerformance.map((emp) => ({
      name: emp.employeeName.split(" ")[0],
      Completed: emp.completedTasks || 0,
      Pending: emp.pendingTasks || 0,
      "In Progress": emp.inProgressTasks || 0,
    }));
    const priorityData = data.teamStats?.tasksByPriority
      ? [
          { name: "Low", value: data.teamStats.tasksByPriority.low || 0 },
          { name: "Medium", value: data.teamStats.tasksByPriority.medium || 0 },
          { name: "High", value: data.teamStats.tasksByPriority.high || 0 },
          { name: "Urgent", value: data.teamStats.tasksByPriority.urgent || 0 },
        ].filter((item) => item.value > 0)
      : [];
    const statusData = data.teamStats?.tasksByStatus
      ? [
          {
            name: "Completed",
            value: data.teamStats.tasksByStatus.completed || 0,
          },
          {
            name: "In Progress",
            value: data.teamStats.tasksByStatus.inProgress || 0,
          },
          { name: "Pending", value: data.teamStats.tasksByStatus.pending || 0 },
          { name: "Overdue", value: data.teamStats.tasksByStatus.overdue || 0 },
        ].filter((item) => item.value > 0)
      : [];
    const monthlyData = data.teamStats?.monthlyCompletion
      ? Object.entries(data.teamStats.monthlyCompletion).map(
          ([month, tasks]) => ({ month, tasks }),
        )
      : [];
    return (
      <div className="charts-container">
        <div className="row mb-4">
          <div className="col-md-12 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Team Performance Overview</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Completed" fill="#10b981" />
                    <Bar dataKey="In Progress" fill="#f59e0b" />
                    <Bar dataKey="Pending" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        {(priorityData.length > 0 || statusData.length > 0) && (
          <div className="row mb-4">
            {priorityData.length > 0 && (
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="mb-0">Tasks by Priority</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          dataKey="value"
                        >
                          {priorityData.map((_, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={COLORS[idx % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            {statusData.length > 0 && (
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="mb-0">Tasks by Status</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          dataKey="value"
                        >
                          {statusData.map((_, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={COLORS[idx % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {monthlyData.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Monthly Task Completion Trend</h5>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="tasks"
                        stroke="#00d4ff"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTeamHierarchy = () => {
    if (!data || !data.teamHierarchy || data.teamHierarchy.length === 0) {
      return (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Team Structure</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-warning mb-0">
              No team leads found under this manager.{" "}
              {data?.teamStats?.totalMembers === 0 &&
                " Please register team leads first."}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            Team Structure (Manager → Team Lead → Members)
          </h5>
        </div>
        <div className="card-body">
          {data.teamHierarchy.map((teamLead, index) => (
            <div key={teamLead.id || index} className="mb-3 border-bottom pb-3">
              <h6 className="text-primary">👔 Team Lead: {teamLead.name}</h6>
              <div className="ms-4">
                {teamLead.members && teamLead.members.length > 0 ? (
                  <ul className="list-unstyled">
                    {teamLead.members.map((member) => (
                      <li key={member.id} className="mb-1">
                        📍 {member.name} ({member.designation})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-primary">
                    No team members assigned yet
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmployeeTable = () => {
    if (
      !data ||
      !data.employeePerformance ||
      data.employeePerformance.length === 0
    ) {
      return (
        <div className="card">
          <div className="card-body">
            <div className="alert alert-info">
              <h5>No Performance Data Available</h5>
              <p className="mb-0">
                {data?.teamStats?.totalMembers === 0
                  ? "No team members found under your hierarchy. Please add team leads and employees first."
                  : "No tasks have been assigned to team members yet. Go to Task Assignments tab to create tasks."}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Employee Performance Details</h5>
          <div>
            <button className="btn-excel me-2" onClick={downloadExcelReport}>
              📊 Download Excel
            </button>
            <button className="btn-pdf me-2" onClick={downloadPDFReport}>
              📄 Download PDF
            </button>
            <button className="btn-refresh" onClick={fetchTeamPerformance}>
              🔄 Refresh
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Reports To</th>
                  <th>Total Tasks</th>
                  <th>Completed</th>
                  <th>Pending</th>
                  <th>In Progress</th>
                  <th>Overdue</th>
                  <th>Completion Rate</th>
                  <th>Avg Time (days)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.employeePerformance.map((emp) => (
                  <tr
                    key={emp.employeeId}
                    className={emp.isTeamLead ? "team-lead-row" : ""}
                  >
                    <td>
                      {emp.employeeName}
                      {emp.isTeamLead && (
                        <span className="lead-badge ms-2">Team Lead</span>
                      )}
                    </td>
                    <td>{emp.designation || "N/A"}</td>
                    <td>
                      {emp.isTeamLead
                        ? "Manager"
                        : emp.reportsTo?.name || "Team Lead"}
                    </td>
                    <td>{emp.totalTasks || 0}</td>
                    <td className="text-success">{emp.completedTasks || 0}</td>
                    <td className="text-warning">{emp.pendingTasks || 0}</td>
                    <td className="text-info">{emp.inProgressTasks || 0}</td>
                    <td className="text-danger">{emp.overdueTasks || 0}</td>
                    <td>
                      <div className="progress">
                        <div
                          className="progress-bar"
                          style={{ width: `${emp.completionRate || 0}%` }}
                        >
                          {emp.completionRate || 0}%
                        </div>
                      </div>
                    </td>
                    <td>{emp.avgCompletionTime || 0}</td>
                    <td>
                      {emp.tasks && emp.tasks.length > 0 && (
                        <button
                          className="view-tasks-btn"
                          onClick={() =>
                            setSelectedEmployee(
                              selectedEmployee === emp.employeeId
                                ? null
                                : emp.employeeId,
                            )
                          }
                        >
                          {selectedEmployee === emp.employeeId
                            ? "Hide Tasks"
                            : "View Tasks"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedEmployee && (
            <div className="mt-4">
              <h6>Task Details</h6>
              <div className="table-responsive">
                <table className="modern-table-sm">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Completed At</th>
                      <th>Assigned By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.employeePerformance
                      .find((emp) => emp.employeeId === selectedEmployee)
                      ?.tasks.map((task) => (
                        <tr key={task._id}>
                          <td>{task.title}</td>
                          <td>
                            <span className={`priority-badge ${task.priority}`}>
                              {task.priority?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${task.status}`}>
                              {task.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td>
                            {task.completedAt
                              ? new Date(task.completedAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td>{task.assignedBy}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info" role="status"></div>
        <p className="mt-3">Loading performance data...</p>
      </div>
    );
  if (error)
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Performance Data</h4>
        <p>{error}</p>
        <button className="btn-refresh" onClick={fetchTeamPerformance}>
          Try Again
        </button>
      </div>
    );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="performance-dashboard">
        <div className="stats-summary">
          <div className="summary-card">
            <span className="summary-label">Total Team Members</span>
            <span className="summary-value">
              {data?.teamStats?.totalMembers || 0}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Team Leads</span>
            <span className="summary-value">
              {data?.teamStats?.totalTeamLeads || 0}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Team Members</span>
            <span className="summary-value">
              {data?.teamStats?.totalEmployees || 0}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Completion Rate</span>
            <span className="summary-value">
              {data?.teamStats?.teamCompletionRate || 0}%
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Tasks Completed</span>
            <span className="summary-value">
              {data?.teamStats?.completedTasks || 0}/
              {data?.teamStats?.totalTasks || 0}
            </span>
          </div>
        </div>
        {renderTeamHierarchy()}
        {renderEmployeeTable()}
        {data?.teamStats?.totalTasks > 0 && renderCharts()}
      </div>
      <style>{`
        .performance-dashboard {
          background: rgba(15, 25, 45, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 28px;
          padding: 28px;
          border: 1px solid rgba(0, 212, 255, 0.2);
        }
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }
        .summary-card {
          background: rgba(10,18,32,0.7);
          border-radius: 20px;
          padding: 16px;
          text-align: center;
          border: 1px solid rgba(0,212,255,0.2);
        }
        .summary-label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #9aa4bf;
          margin-bottom: 6px;
        }
        .summary-value {
          display: block;
          font-size: 1.8rem;
          font-weight: 700;
          color: #00d4ff;
        }
        .card {
          background: rgba(10,18,32,0.5);
          border: 1px solid rgba(0,212,255,0.15);
          border-radius: 24px;
          margin-bottom: 24px;
          overflow: hidden;
        }
        .card-header {
          background: rgba(0,212,255,0.1);
          border-bottom: 1px solid rgba(0,212,255,0.2);
          padding: 16px 20px;
          color: #00d4ff;
          font-weight: 600;
        }
        .card-body {
          padding: 20px;
        }
        .alert {
          border-radius: 16px;
          background: rgba(0,212,255,0.1);
          color: #00d4ff;
          border: none;
        }
        .alert-warning {
          background: rgba(245,158,11,0.1);
          color: #f59e0b;
        }
        .text-primary { color: #00d4ff !important; }
        .modern-table {
          width: 100%;
          border-collapse: collapse;
          color: #cbd5e1;
        }
        .modern-table th {
          text-align: left;
          padding: 12px;
          background: rgba(0,212,255,0.05);
          color: #00d4ff;
          font-size: 0.75rem;
          text-transform: uppercase;
          border-bottom: 1px solid #2a3a55;
        }
        .modern-table td {
          padding: 12px;
          border-bottom: 1px solid #1e2a3a;
          vertical-align: middle;
        }
        .modern-table tbody tr:hover {
          background: rgba(0,212,255,0.05);
        }
        .team-lead-row {
          background: rgba(0,212,255,0.03);
        }
        .lead-badge {
          background: #00d4ff;
          color: #0a0f1e;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .progress {
          background: #1e293b;
          border-radius: 20px;
          height: 24px;
          overflow: hidden;
        }
        .progress-bar {
          background: linear-gradient(90deg, #00b4d8, #00d4ff);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 600;
          color: white;
        }
        .btn-excel, .btn-pdf, .btn-refresh, .view-tasks-btn {
          background: rgba(0,212,255,0.15);
          border: 1px solid rgba(0,212,255,0.3);
          padding: 6px 14px;
          border-radius: 40px;
          color: #00d4ff;
          font-size: 0.8rem;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-excel:hover, .btn-pdf:hover, .btn-refresh:hover, .view-tasks-btn:hover {
          background: rgba(0,212,255,0.25);
          transform: translateY(-1px);
        }
        .btn-pdf {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
          color: #ef4444;
        }
        .btn-pdf:hover { background: rgba(239,68,68,0.25); }
        .priority-badge, .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .priority-badge.low { background: #10b981; color: white; }
        .priority-badge.medium { background: #3b82f6; color: white; }
        .priority-badge.high { background: #f59e0b; color: white; }
        .priority-badge.urgent { background: #ef4444; color: white; }
        .status-badge.pending { background: #f59e0b; color: white; }
        .status-badge.in-progress { background: #3b82f6; color: white; }
        .status-badge.completed { background: #10b981; color: white; }
        .status-badge.overdue { background: #ef4444; color: white; }
        .text-success { color: #10b981 !important; }
        .text-warning { color: #f59e0b !important; }
        .text-info { color: #3b82f6 !important; }
        .text-danger { color: #ef4444 !important; }
        @media (max-width: 768px) {
          .performance-dashboard { padding: 16px; }
          .stats-summary { grid-template-columns: repeat(2,1fr); gap: 12px; }
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
          /* Force table text to be light */
.performance-dashboard .modern-table td,
.performance-dashboard .modern-table-sm td,
.performance-dashboard .list-unstyled li {
  color: #e2e8f0 !important;   /* bright light gray */
}

/* Team lead name - bright cyan */
.performance-dashboard .text-primary {
  color: #4fd1ff !important;
}

/* Team hierarchy list items */
.performance-dashboard .list-unstyled li {
  margin-bottom: 8px;
  color: #cbd5e1;
}

/* Task Details sub‑table headers and cells */
.performance-dashboard .modern-table-sm th {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
  padding: 8px 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.performance-dashboard .modern-table-sm td {
  background: transparent;
  color: #e2e8f0;
  padding: 8px 12px;
  border-bottom: 1px solid #2a3a55;
}

/* Ensure alert messages are readable */
.performance-dashboard .alert-info,
.performance-dashboard .alert-warning {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
  border: none;
}
.performance-dashboard .alert-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #fcd34d;
}

/* Override any leftover light backgrounds */
.performance-dashboard .card-body,
.performance-dashboard .card {
  background: rgba(10, 18, 32, 0.6);
}

/* Improvement for the progress bar text (percentage) */
.performance-dashboard .progress-bar {
  font-weight: 600;
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
}
      `}</style>
    </>
  );
}
