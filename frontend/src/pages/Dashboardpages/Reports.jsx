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
  AreaChart,
  Area,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const COLORS = [
  "#00d4ff",
  "#00b4d8",
  "#48cae4",
  "#90e0ef",
  "#caf0f8",
  "#0077b6",
  "#023e8a",
  "#03045e",
];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [dateRange, setDateRange] = useState("all");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const usersResponse = await axios.get(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tasksResponse = await axios.get(`${BACKEND_URL}/api/auth/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users = usersResponse.data;
      const tasks = tasksResponse.data;

      const userStatsData = calculateUserStats(users);
      const taskStatsData = calculateTaskStats(tasks);
      const performanceStatsData = calculatePerformanceStats(users, tasks);

      setUserStats(userStatsData);
      setTaskStats(taskStatsData);
      setPerformanceStats(performanceStatsData);

      toast.success("Reports loaded successfully!");
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(error.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = (users) => {
    const roleCount = { admin: 0, hr: 0, employer: 0, manager: 0, employee: 0 };
    const designationCount = { "team lead": 0, L1: 0, L2: 0, FE: 0 };
    users.forEach((user) => {
      if (roleCount[user.role] !== undefined) roleCount[user.role]++;
      if (user.designation && designationCount[user.designation] !== undefined)
        designationCount[user.designation]++;
    });
    const monthlyRegistrations = {};
    users.forEach((user) => {
      const date = new Date(user.createdAt);
      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
      monthlyRegistrations[monthYear] =
        (monthlyRegistrations[monthYear] || 0) + 1;
    });
    return {
      totalUsers: users.length,
      roleDistribution: roleCount,
      designationDistribution: designationCount,
      monthlyRegistrations,
      activeUsers: users.filter((u) => u.createdAt).length,
    };
  };

  const calculateTaskStats = (tasks) => {
    const statusCount = {
      pending: 0,
      "in-progress": 0,
      completed: 0,
      overdue: 0,
    };
    const priorityCount = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach((task) => {
      if (statusCount[task.status] !== undefined) statusCount[task.status]++;
      if (priorityCount[task.priority] !== undefined)
        priorityCount[task.priority]++;
    });
    const monthlyTasks = {};
    tasks.forEach((task) => {
      const date = new Date(task.createdAt);
      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
      monthlyTasks[monthYear] = (monthlyTasks[monthYear] || 0) + 1;
    });
    const monthlyCompletion = {};
    tasks
      .filter((t) => t.status === "completed")
      .forEach((task) => {
        const date = new Date(task.completedAt || task.updatedAt);
        const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
        monthlyCompletion[monthYear] = (monthlyCompletion[monthYear] || 0) + 1;
      });
    const completionRate =
      tasks.length > 0 ? (statusCount.completed / tasks.length) * 100 : 0;
    return {
      totalTasks: tasks.length,
      statusDistribution: statusCount,
      priorityDistribution: priorityCount,
      monthlyTasks,
      monthlyCompletion,
      completionRate: parseFloat(completionRate.toFixed(1)),
    };
  };

  const calculatePerformanceStats = (users, tasks) => {
    const employeePerformance = users
      .filter((u) => u.role === "employee")
      .map((emp) => {
        const employeeTasks = tasks.filter(
          (t) => t.assignedTo?._id === emp._id || t.assignedTo === emp._id,
        );
        const completedTasks = employeeTasks.filter(
          (t) => t.status === "completed",
        );
        const completionRate =
          employeeTasks.length > 0
            ? (completedTasks.length / employeeTasks.length) * 100
            : 0;
        let avgCompletionTime = 0;
        const completedWithDates = completedTasks.filter((t) => t.completedAt);
        if (completedWithDates.length > 0) {
          const totalDays = completedWithDates.reduce((sum, task) => {
            const daysToComplete = Math.ceil(
              (new Date(task.completedAt) - new Date(task.createdAt)) /
                (1000 * 60 * 60 * 24),
            );
            return sum + daysToComplete;
          }, 0);
          avgCompletionTime = totalDays / completedWithDates.length;
        }
        return {
          name: emp.name,
          designation: emp.designation || "N/A",
          totalTasks: employeeTasks.length,
          completedTasks: completedTasks.length,
          completionRate: parseFloat(completionRate.toFixed(1)),
          avgCompletionTime: parseFloat(avgCompletionTime.toFixed(1)),
        };
      })
      .filter((emp) => emp.totalTasks > 0)
      .sort((a, b) => b.completionRate - a.completionRate);

    return {
      employeePerformance,
      topPerformers: employeePerformance.slice(0, 5),
      needsAttention: employeePerformance.filter(
        (emp) => emp.completionRate < 50,
      ),
    };
  };

  const exportToExcel = async () => {
    if (!userStats || !taskStats) return;
    setExportLoading(true);
    try {
      const workbook = XLSX.utils.book_new();
      // User Summary
      const userSummary = [
        ["USER STATISTICS"],
        ["Total Users", userStats.totalUsers],
        [],
        ["Role Distribution"],
        ["Role", "Count"],
        ...Object.entries(userStats.roleDistribution).map(([role, count]) => [
          role,
          count,
        ]),
        [],
        ["Designation Distribution"],
        ["Designation", "Count"],
        ...Object.entries(userStats.designationDistribution).map(
          ([des, count]) => [des, count],
        ),
      ];
      const userSheet = XLSX.utils.aoa_to_sheet(userSummary);
      XLSX.utils.book_append_sheet(workbook, userSheet, "User Statistics");
      // Task Summary
      const taskSummary = [
        ["TASK STATISTICS"],
        ["Total Tasks", taskStats.totalTasks],
        ["Completion Rate", `${taskStats.completionRate}%`],
        [],
        ["Status Distribution"],
        ["Status", "Count"],
        ...Object.entries(taskStats.statusDistribution).map(
          ([status, count]) => [status, count],
        ),
        [],
        ["Priority Distribution"],
        ["Priority", "Count"],
        ...Object.entries(taskStats.priorityDistribution).map(
          ([priority, count]) => [priority, count],
        ),
      ];
      const taskSheet = XLSX.utils.aoa_to_sheet(taskSummary);
      XLSX.utils.book_append_sheet(workbook, taskSheet, "Task Statistics");
      if (performanceStats?.employeePerformance.length > 0) {
        const employeeSheet = XLSX.utils.json_to_sheet(
          performanceStats.employeePerformance,
        );
        XLSX.utils.book_append_sheet(
          workbook,
          employeeSheet,
          "Employee Performance",
        );
      }
      XLSX.writeFile(
        workbook,
        `System_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.success("Excel report exported successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export Excel report");
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!userStats || !taskStats) return;
    setExportLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(24);
      doc.setTextColor(0, 212, 255);
      doc.text("System Reports Dashboard", pageWidth / 2, 20, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.setTextColor(180, 190, 219);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, {
        align: "center",
      });
      // User stats
      doc.setFontSize(16);
      doc.setTextColor(0, 212, 255);
      doc.text("User Statistics", 14, 45);
      autoTable(doc, {
        startY: 50,
        head: [["Metric", "Value"]],
        body: [
          ["Total Users", userStats.totalUsers.toString()],
          ["Active Users", userStats.activeUsers.toString()],
        ],
        theme: "striped",
        headStyles: { fillColor: [0, 180, 216] },
      });
      let finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Role Distribution", 14, finalY);
      const roleData = Object.entries(userStats.roleDistribution).map(
        ([role, count]) => [role, count],
      );
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Role", "Count"]],
        body: roleData,
        theme: "striped",
        headStyles: { fillColor: [0, 180, 216] },
      });
      finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(16);
      doc.text("Task Statistics", 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Metric", "Value"]],
        body: [
          ["Total Tasks", taskStats.totalTasks.toString()],
          ["Completion Rate", `${taskStats.completionRate}%`],
        ],
        theme: "striped",
        headStyles: { fillColor: [0, 180, 216] },
      });
      finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Task Status Distribution", 14, finalY);
      const statusData = Object.entries(taskStats.statusDistribution).map(
        ([status, count]) => [status, count],
      );
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Status", "Count"]],
        body: statusData,
        theme: "striped",
        headStyles: { fillColor: [0, 180, 216] },
      });
      if (performanceStats?.topPerformers.length > 0) {
        finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text("Top 5 Performers", 14, finalY);
        const performerData = performanceStats.topPerformers.map((emp) => [
          emp.name,
          emp.designation,
          emp.totalTasks,
          emp.completedTasks,
          `${emp.completionRate}%`,
        ]);
        autoTable(doc, {
          startY: finalY + 5,
          head: [
            ["Employee", "Designation", "Total Tasks", "Completed", "Rate"],
          ],
          body: performerData,
          theme: "striped",
          headStyles: { fillColor: [0, 180, 216] },
        });
      }
      doc.save(`System_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF report exported successfully!");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("Failed to export PDF report");
    } finally {
      setExportLoading(false);
    }
  };

  const renderUserStatsCharts = () => {
    if (!userStats) return null;
    const roleData = Object.entries(userStats.roleDistribution).map(
      ([name, value]) => ({ name, value }),
    );
    const designationData = Object.entries(
      userStats.designationDistribution,
    ).map(([name, value]) => ({ name, value }));
    const monthlyData = Object.entries(userStats.monthlyRegistrations)
      .map(([month, count]) => ({ month, registrations: count }))
      .slice(-6);
    return (
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Users by Role</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={roleData}
      cx="50%"
      cy="50%"
      label={false}
      outerRadius={80}
      fill="#8884d8"
      dataKey="value"
    >
      {roleData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
    <Legend verticalAlign="bottom" height={36} />
  </PieChart>
</ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Users by Designation</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={designationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00d4ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {monthlyData.length > 0 && (
          <div className="col-md-12 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Monthly User Registrations</h5>
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
                      dataKey="registrations"
                      stroke="#00d4ff"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTaskStatsCharts = () => {
    if (!taskStats) return null;
    const statusData = Object.entries(taskStats.statusDistribution).map(
      ([name, value]) => ({ name, value }),
    );
    const priorityData = Object.entries(taskStats.priorityDistribution).map(
      ([name, value]) => ({ name, value }),
    );
    const monthlyTaskData = Object.entries(taskStats.monthlyTasks)
      .map(([month, count]) => ({
        month,
        created: count,
        completed: taskStats.monthlyCompletion[month] || 0,
      }))
      .slice(-6);
    return (
      <div className="row">
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
        {monthlyTaskData.length > 0 && (
          <div className="col-md-12 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Monthly Task Trends</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTaskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="created"
                      fill="#00d4ff"
                      fillOpacity="0.3"
                      stroke="#00d4ff"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      fill="#82ca9d"
                      fillOpacity="0.3"
                      stroke="#82ca9d"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceStats = () => {
    if (!performanceStats || performanceStats.employeePerformance.length === 0)
      return (
        <div className="card">
          <div className="card-body">
            <div className="alert alert-info">
              No performance data available yet.
            </div>
          </div>
        </div>
      );
    return (
      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Employee Performance Ranking</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Employee</th>
                      <th>Designation</th>
                      <th>Total Tasks</th>
                      <th>Completed</th>
                      <th>Completion Rate</th>
                      <th>Avg Time (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceStats.employeePerformance.map((emp, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{emp.name}</td>
                        <td>{emp.designation}</td>
                        <td>{emp.totalTasks}</td>
                        <td className="text-success">{emp.completedTasks}</td>
                        <td>
                          <div className="progress" style={{ height: "20px" }}>
                            <div
                              className={`progress-bar ${emp.completionRate >= 70 ? "bg-success" : emp.completionRate >= 40 ? "bg-warning" : "bg-danger"}`}
                              style={{ width: `${emp.completionRate}%` }}
                            >
                              {emp.completionRate}%
                            </div>
                          </div>
                        </td>
                        <td>{emp.avgCompletionTime} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        {performanceStats.topPerformers.length > 0 && (
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">🏆 Top Performers</h5>
              </div>
              <div className="card-body">
                <ul className="list-group">
                  {performanceStats.topPerformers.map((emp, idx) => (
                    <li
                      key={idx}
                      className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white"
                    >
                      <div>
                        <strong>
                          {idx + 1}. {emp.name}
                        </strong>
                        <br />
                        <small className="text-muted">{emp.designation}</small>
                      </div>
                      <span className="badge bg-success rounded-pill">
                        {emp.completionRate}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        {performanceStats.needsAttention.length > 0 && (
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">⚠️ Needs Attention</h5>
              </div>
              <div className="card-body">
                <ul className="list-group">
                  {performanceStats.needsAttention.map((emp, idx) => (
                    <li
                      key={idx}
                      className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white"
                    >
                      <div>
                        <strong>
                          {idx + 1}. {emp.name}
                        </strong>
                        <br />
                        <small className="text-muted">{emp.designation}</small>
                      </div>
                      <span className="badge bg-danger rounded-pill">
                        {emp.completionRate}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => {
    if (!userStats || !taskStats) return null;
    return (
      <>
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{userStats.totalUsers}</h3>
                <p>Total Users</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{taskStats.totalTasks}</h3>
                <p>Total Tasks</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{taskStats.completionRate}%</h3>
                <p>Completion Rate</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stat-card">
              <div className="stat-icon">👔</div>
              <div className="stat-info">
                <h3>{userStats.roleDistribution.employee}</h3>
                <p>Employees</p>
              </div>
            </div>
          </div>
        </div>
        {renderUserStatsCharts()}
      </>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info" role="status"></div>
        <p className="mt-3">Loading reports...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="reports-container">
        <div className="reports-header">
          <div>
            <h3 className="mb-2">📊 Reports Dashboard</h3>
            <p className="text-muted">
              View and export system-wide reports and analytics
            </p>
          </div>
          <div className="header-buttons">
            <button
              className="btn-export me-2"
              onClick={exportToExcel}
              disabled={exportLoading}
            >
              {exportLoading ? "Exporting..." : "📊 Export Excel"}
            </button>
            <button
              className="btn-export-pdf"
              onClick={exportToPDF}
              disabled={exportLoading}
            >
              {exportLoading ? "Exporting..." : "📄 Export PDF"}
            </button>
          </div>
        </div>
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${selectedReport === "overview" ? "active" : ""}`}
              onClick={() => setSelectedReport("overview")}
            >
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${selectedReport === "users" ? "active" : ""}`}
              onClick={() => setSelectedReport("users")}
            >
              User Reports
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${selectedReport === "tasks" ? "active" : ""}`}
              onClick={() => setSelectedReport("tasks")}
            >
              Task Reports
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${selectedReport === "performance" ? "active" : ""}`}
              onClick={() => setSelectedReport("performance")}
            >
              Performance Reports
            </button>
          </li>
        </ul>
        <div className="reports-content">
          {selectedReport === "overview" && renderOverview()}
          {selectedReport === "users" && renderUserStatsCharts()}
          {selectedReport === "tasks" && renderTaskStatsCharts()}
          {selectedReport === "performance" && renderPerformanceStats()}
        </div>
      </div>
      <style>{`
        .reports-container {
          background: rgba(15, 25, 45, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 28px;
          padding: 28px;
          border: 1px solid rgba(0, 212, 255, 0.2);
          transition: all 0.3s ease;
        }
        .reports-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0,212,255,0.3);
          padding-bottom: 20px;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .reports-header h3 {
          margin: 0;
          background: linear-gradient(135deg, #ffffff, #00d4ff);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .text-muted { color: #9aa4bf !important; }
        .btn-export, .btn-export-pdf {
          background: rgba(0,180,216,0.15);
          border: 1px solid rgba(0,212,255,0.3);
          color: #00d4ff;
          padding: 10px 24px;
          border-radius: 40px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-export:hover, .btn-export-pdf:hover { background: rgba(0,212,255,0.25); transform: translateY(-2px); }
        .btn-export-pdf { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }
        .btn-export-pdf:hover { background: rgba(239,68,68,0.25); }
        .stat-card {
          background: rgba(10,18,32,0.7);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(0,212,255,0.2);
          transition: all 0.2s;
        }
        .stat-card:hover { border-color: #00d4ff; transform: translateY(-4px); }
        .stat-icon { font-size: 2.5rem; color: #00d4ff; }
        .stat-info h3 { margin: 0; font-size: 2rem; font-weight: 700; color: #fff; }
        .stat-info p { margin: 0; color: #9aa4bf; font-size: 0.85rem; }
        .nav-tabs { border-bottom: 1px solid #2a3a55; }
        .nav-tabs .nav-link {
          background: transparent;
          border: none;
          color: #b0bedb;
          font-weight: 500;
          padding: 10px 20px;
          transition: 0.2s;
        }
        .nav-tabs .nav-link:hover { color: #00d4ff; }
        .nav-tabs .nav-link.active {
          color: #00d4ff;
          border-bottom: 2px solid #00d4ff;
          background: transparent;
        }
        .reports-content .card {
          background: rgba(10,18,32,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,212,255,0.15);
          border-radius: 24px;
          margin-bottom: 24px;
        }
        .reports-content .card-header {
          background: rgba(0,212,255,0.1);
          border-bottom: 1px solid rgba(0,212,255,0.2);
          color: #00d4ff;
          font-weight: 600;
          padding: 15px 20px;
          border-radius: 24px 24px 0 0;
        }
        .reports-content .table {
          color: #ecf0f1;
        }
        .reports-content .table th {
          background-color: #1e293b;
          color: #00d4ff;
          border-bottom: 1px solid #2a3a55;
        }
        .reports-content .table td {
          border-color: #1e2a3a;
        }
        .progress { background-color: #1e293b; border-radius: 20px; }
        .progress-bar { border-radius: 20px; font-size: 0.7rem; font-weight: 500; }
        .list-group-item {
          background: rgba(10,18,32,0.8);
          border-color: #2a3a55;
          color: #ecf0f1;
        }
        .bg-success { background: linear-gradient(90deg, #00b4d8, #0077b6) !important; }
        .bg-danger { background: linear-gradient(90deg, #ef4444, #dc2626) !important; }
        .alert-info {
          background: rgba(0,212,255,0.1);
          color: #00d4ff;
          border: 1px solid rgba(0,212,255,0.3);
          border-radius: 20px;
        }
        @media (max-width: 768px) {
          .reports-container { padding: 16px; }
          .reports-header { flex-direction: column; text-align: center; }
          .stat-card { padding: 15px; }
          .stat-info h3 { font-size: 1.5rem; }
        }
      `}</style>
    </>
  );
}
