import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

const BACKEND_URL = 'http://localhost:5000';
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

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
      
      const response = await axios.get(`${BACKEND_URL}/api/performance/team-performance/${managerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("API Response:", response.data);
      
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
      const errorMsg = error.response?.data?.message || error.message || "Failed to load performance data";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcelReport = () => {
    if (!data || !data.employeePerformance || data.employeePerformance.length === 0) {
      toast.warning("No data available to export");
      return;
    }

    try {
      const employeeSummary = data.employeePerformance.map(emp => ({
        "Employee Name": emp.employeeName,
        "Designation": emp.designation,
        "Role Type": emp.isTeamLead ? "Team Lead" : "Team Member",
        "Reports To": emp.reportsTo?.name || (emp.isTeamLead ? "Manager" : "Team Lead"),
        "Total Tasks": emp.totalTasks,
        "Completed Tasks": emp.completedTasks,
        "Pending Tasks": emp.pendingTasks,
        "In Progress": emp.inProgressTasks,
        "Overdue Tasks": emp.overdueTasks,
        "Completion Rate (%)": emp.completionRate,
        "Avg Completion Time (days)": emp.avgCompletionTime
      }));

      const detailedTasks = [];
      data.employeePerformance.forEach(emp => {
        if (emp.tasks && emp.tasks.length > 0) {
          emp.tasks.forEach(task => {
            detailedTasks.push({
              "Employee": emp.employeeName,
              "Designation": emp.designation,
              "Task Title": task.title,
              "Status": task.status,
              "Priority": task.priority,
              "Due Date": new Date(task.dueDate).toLocaleDateString(),
              "Completed At": task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "N/A",
              "Assigned By": task.assignedBy
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
      
      XLSX.writeFile(workbook, `Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Excel report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel report");
    }
  };

  const downloadPDFReport = () => {
    if (!data || !data.employeePerformance || data.employeePerformance.length === 0) {
      toast.warning("No data available to export");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text("Team Performance Report", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text("Team Overview", 14, 45);
      
      const teamStats = [
        ["Total Team Members", data.teamStats?.totalMembers?.toString() || "0"],
        ["Team Leads", data.teamStats?.totalTeamLeads?.toString() || "0"],
        ["Team Members", data.teamStats?.totalEmployees?.toString() || "0"],
        ["Total Tasks", data.teamStats?.totalTasks?.toString() || "0"],
        ["Completed Tasks", data.teamStats?.completedTasks?.toString() || "0"],
        ["Team Completion Rate", `${data.teamStats?.teamCompletionRate || 0}%`]
      ];
      
      autoTable(doc, {
        startY: 50,
        head: [["Metric", "Value"]],
        body: teamStats,
        theme: "striped",
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: 14 }
      });
      
      let finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Employee Performance Summary", 14, finalY);
      
      const employeeData = data.employeePerformance.map(emp => [
        emp.employeeName,
        emp.designation || "N/A",
        emp.totalTasks?.toString() || "0",
        emp.completedTasks?.toString() || "0",
        `${emp.completionRate || 0}%`,
        `${emp.avgCompletionTime || 0} days`
      ]);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Employee", "Designation", "Total", "Completed", "Rate", "Avg Time"]],
        body: employeeData,
        theme: "striped",
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: 14 }
      });
      
      doc.save(`Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF report: " + error.message);
    }
  };

  const renderCharts = () => {
    if (!data || !data.employeePerformance || data.employeePerformance.length === 0) {
      return (
        <div className="alert alert-info">
          No data available to display charts. Please ensure you have team members and tasks assigned.
        </div>
      );
    }

    const barChartData = data.employeePerformance.map(emp => ({
      name: emp.employeeName.split(" ")[0],
      Completed: emp.completedTasks || 0,
      Pending: emp.pendingTasks || 0,
      "In Progress": emp.inProgressTasks || 0
    }));

    const priorityData = data.teamStats?.tasksByPriority ? [
      { name: "Low", value: data.teamStats.tasksByPriority.low || 0 },
      { name: "Medium", value: data.teamStats.tasksByPriority.medium || 0 },
      { name: "High", value: data.teamStats.tasksByPriority.high || 0 },
      { name: "Urgent", value: data.teamStats.tasksByPriority.urgent || 0 }
    ].filter(item => item.value > 0) : [];

    const statusData = data.teamStats?.tasksByStatus ? [
      { name: "Completed", value: data.teamStats.tasksByStatus.completed || 0 },
      { name: "In Progress", value: data.teamStats.tasksByStatus.inProgress || 0 },
      { name: "Pending", value: data.teamStats.tasksByStatus.pending || 0 },
      { name: "Overdue", value: data.teamStats.tasksByStatus.overdue || 0 }
    ].filter(item => item.value > 0) : [];

    const monthlyData = data.teamStats?.monthlyCompletion ? 
      Object.entries(data.teamStats.monthlyCompletion).map(([month, tasks]) => ({
        month,
        tasks
      })) : [];

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
                    <Bar dataKey="Completed" fill="#00C49F" />
                    <Bar dataKey="In Progress" fill="#FFBB28" />
                    <Bar dataKey="Pending" fill="#FF8042" />
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
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                      <Line type="monotone" dataKey="tasks" stroke="#8884d8" strokeWidth={2} />
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
              No team leads found under this manager. 
              {data?.teamStats?.totalMembers === 0 && " Please register team leads first."}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Team Structure (Manager → Team Lead → Members)</h5>
        </div>
        <div className="card-body">
          {data.teamHierarchy.map((teamLead, index) => (
            <div key={teamLead.id || index} className="mb-3 border-bottom pb-3">
              <h6 className="text-primary">👔 Team Lead: {teamLead.name}</h6>
              <div className="ms-4">
                {teamLead.members && teamLead.members.length > 0 ? (
                  <ul className="list-unstyled">
                    {teamLead.members.map(member => (
                      <li key={member.id} className="mb-1">
                        📍 {member.name} ({member.designation})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted ms-3">No team members assigned yet</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmployeeTable = () => {
    if (!data || !data.employeePerformance || data.employeePerformance.length === 0) {
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
            <button className="btn btn-success btn-sm me-2" onClick={downloadExcelReport}>
              📊 Download Excel
            </button>
            <button className="btn btn-danger btn-sm me-2" onClick={downloadPDFReport}>
              📄 Download PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={fetchTeamPerformance}>
              🔄 Refresh
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
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
                {data.employeePerformance.map(emp => (
                  <tr key={emp.employeeId} className={emp.isTeamLead ? "table-primary" : ""}>
                    <td>
                      {emp.employeeName}
                      {emp.isTeamLead && <span className="badge bg-primary ms-2">Team Lead</span>}
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
                      <div className="progress" style={{ height: "20px" }}>
                        <div
                          className="progress-bar bg-success"
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
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedEmployee(selectedEmployee === emp.employeeId ? null : emp.employeeId)}
                        >
                          {selectedEmployee === emp.employeeId ? "Hide Tasks" : "View Tasks"}
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
                <table className="table table-sm">
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
                      .find(emp => emp.employeeId === selectedEmployee)
                      ?.tasks.map(task => (
                        <tr key={task._id}>
                          <td>{task.title}</td>
                          <td>
                            <span className={`badge bg-${task.priority === "urgent" ? "danger" : 
                              task.priority === "high" ? "warning" : 
                              task.priority === "medium" ? "info" : "secondary"}`}>
                              {task.priority?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${task.status === "completed" ? "success" : 
                              task.status === "in-progress" ? "primary" : 
                              task.status === "overdue" ? "danger" : "secondary"}`}>
                              {task.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td>{task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "N/A"}</td>
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Performance Data</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchTeamPerformance}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="performance-dashboard">
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="alert alert-info">
              <h5 className="mb-2">
                📊 Team Performance Dashboard
              </h5>
              <p className="mb-0">
                Total Team Members: {data?.teamStats?.totalMembers || 0} | 
                Team Leads: {data?.teamStats?.totalTeamLeads || 0} |
                Team Members: {data?.teamStats?.totalEmployees || 0} |
                Completion Rate: {data?.teamStats?.teamCompletionRate || 0}% |
                Tasks Completed: {data?.teamStats?.completedTasks || 0}/{data?.teamStats?.totalTasks || 0}
              </p>
            </div>
          </div>
        </div>

        {renderTeamHierarchy()}
        {renderEmployeeTable()}
        
        {data?.teamStats?.totalTasks > 0 && renderCharts()}
      </div>

      <style>{`
        .performance-dashboard {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .performance-dashboard .card {
          border: none;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .performance-dashboard .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px 10px 0 0;
          padding: 15px 20px;
        }

        .performance-dashboard .card-header h5 {
          margin: 0;
        }

        .performance-dashboard .table th {
          background-color: #f8f9fa;
          font-weight: 600;
        }

        .performance-dashboard .table td {
          vertical-align: middle;
        }

        .performance-dashboard .progress {
          background-color: #e9ecef;
          border-radius: 10px;
        }

        .performance-dashboard .badge {
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .performance-dashboard {
            padding: 16px;
          }
          
          .table {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}