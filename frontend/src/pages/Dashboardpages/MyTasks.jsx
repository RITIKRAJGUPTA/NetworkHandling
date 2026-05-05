import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL = 'http://localhost:5000';

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/api/auth/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BACKEND_URL}/api/auth/tasks/${selectedTask._id}/status`, 
        { status: updateStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Task status updated successfully!");
      setShowUpdateModal(false);
      fetchMyTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error(error.response?.data?.message || "Failed to update task status");
    }
  };

  const getPriorityColor = (priority) => {
    const colors = { low: "success", medium: "info", high: "warning", urgent: "danger" };
    return colors[priority] || "secondary";
  };

  const getStatusColor = (status) => {
    const colors = { pending: "warning", "in-progress": "primary", completed: "success", overdue: "danger" };
    return colors[status] || "secondary";
  };

  const filteredTasks = tasks.filter(task => filterStatus === "all" || task.status === filterStatus);
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "completed").length
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your tasks...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="my-tasks-container">
        <div className="tasks-header">
          <h3>📌 My Tasks</h3>
          <p className="text-muted">Track and manage your assigned tasks</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-info"><h3>{stats.total}</h3><p>Total Tasks</p></div></div>
          <div className="stat-card pending"><div className="stat-icon">⏳</div><div className="stat-info"><h3>{stats.pending}</h3><p>Pending</p></div></div>
          <div className="stat-card progress"><div className="stat-icon">🔄</div><div className="stat-info"><h3>{stats.inProgress}</h3><p>In Progress</p></div></div>
          <div className="stat-card completed"><div className="stat-icon">✅</div><div className="stat-info"><h3>{stats.completed}</h3><p>Completed</p></div></div>
        </div>

        {/* Filter & Refresh */}
        <div className="filters-section">
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button className="refresh-btn" onClick={fetchMyTasks}>🔄 Refresh</button>
        </div>

        {/* Tasks List */}
        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state"><div>📭 No tasks found</div></div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task._id} className="task-card">
                <div className="task-header-info">
                  <div className="task-title-section">
                    <h5>{task.title}</h5>
                    <div className="task-badges">
                      <span className={`priority-badge ${task.priority}`}>{task.priority.toUpperCase()}</span>
                      <span className={`status-badge ${task.status}`}>{task.status.toUpperCase()}</span>
                    </div>
                  </div>
                  <button className="update-status-btn" onClick={() => { setSelectedTask(task); setUpdateStatus(task.status); setShowUpdateModal(true); }}>
                    ✏️ Update Status
                  </button>
                </div>
                {task.description && (
                  <div className="task-description">
                    <strong>Description:</strong>
                    <p>{task.description}</p>
                  </div>
                )}
                <div className="task-meta">
                  <div className="meta-item">👤 Assigned by: <strong>{task.assignedBy?.name}</strong></div>
                  <div className="meta-item">📅 Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong>{new Date(task.dueDate) < new Date() && task.status !== "completed" && <span className="overdue-text">(Overdue!)</span>}</div>
                </div>
                <div className="task-progress">
                  <div className="progress-label">Progress</div>
                  <div className="progress"><div className={`progress-bar ${task.status === "completed" ? "completed" : task.status === "in-progress" ? "in-progress" : "pending"}`} style={{ width: task.status === "completed" ? "100%" : task.status === "in-progress" ? "50%" : "25%" }}></div></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Update Status Modal */}
        {showUpdateModal && selectedTask && (
          <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
            <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h3>✏️ Update Task: {selectedTask.title}</h3><button className="close-btn" onClick={() => setShowUpdateModal(false)}>×</button></div>
              <form onSubmit={handleUpdateStatus}>
                <div className="modal-body">
                  <div className="form-field"><label>Status</label><select className="form-select-dark" value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} required><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></select></div>
                </div>
                <div className="modal-footer"><button type="button" className="cancel-modal-btn" onClick={() => setShowUpdateModal(false)}>Cancel</button><button type="submit" className="save-modal-btn">Update Status</button></div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          .my-tasks-container {
            background: rgba(15, 25, 45, 0.6);
            backdrop-filter: blur(12px);
            border-radius: 28px;
            padding: 28px;
            border: 1px solid rgba(0, 212, 255, 0.2);
          }
          .tasks-header {
            border-bottom: 1px solid rgba(0,212,255,0.3);
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .tasks-header h3 {
            margin: 0;
            background: linear-gradient(135deg, #ffffff, #00d4ff);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            font-weight: 700;
          }
          .text-muted { color: #9aa4bf !important; }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 28px;
          }
          .stat-card {
            background: rgba(10,18,32,0.7);
            backdrop-filter: blur(8px);
            border-radius: 20px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 14px;
            border: 1px solid rgba(0,212,255,0.2);
          }
          .stat-card.pending { border-left: 3px solid #f59e0b; }
          .stat-card.progress { border-left: 3px solid #3b82f6; }
          .stat-card.completed { border-left: 3px solid #10b981; }
          .stat-icon { font-size: 2rem; color: #00d4ff; }
          .stat-info h3 { margin: 0; font-size: 1.8rem; font-weight: 700; color: #fff; }
          .stat-info p { margin: 0; color: #9aa4bf; font-size: 0.8rem; }
          .filters-section {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }
          .filter-select {
            flex: 1;
            min-width: 150px;
            padding: 10px 16px;
            background: rgba(0,0,0,0.4);
            border: 1px solid #2a3a55;
            border-radius: 40px;
            color: #fff;
          }
          .filter-select:focus {
            outline: none;
            border-color: #00d4ff;
            box-shadow: 0 0 12px rgba(0,212,255,0.2);
          }
          .refresh-btn {
            background: rgba(0,212,255,0.15);
            border: 1px solid rgba(0,212,255,0.3);
            padding: 10px 20px;
            border-radius: 40px;
            color: #00d4ff;
            cursor: pointer;
            transition: 0.2s;
          }
          .refresh-btn:hover { background: rgba(0,212,255,0.25); }
          .task-card {
            background: rgba(10,18,32,0.5);
            border: 1px solid #2a3a55;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 16px;
            transition: 0.2s;
          }
          .task-card:hover { border-color: #00d4ff; transform: translateY(-2px); }
          .task-header-info {
            display: flex;
            justify-content: space-between;
            align-items: start;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 16px;
          }
          .task-title-section h5 { margin: 0 0 8px 0; color: #fff; font-size: 1.1rem; }
          .task-badges { display: flex; gap: 8px; flex-wrap: wrap; }
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
          .update-status-btn {
            background: rgba(0,212,255,0.15);
            border: 1px solid rgba(0,212,255,0.3);
            color: #00d4ff;
            padding: 6px 14px;
            border-radius: 40px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: 0.2s;
          }
          .update-status-btn:hover { background: rgba(0,212,255,0.25); transform: translateY(-1px); }
          .task-description {
            background: rgba(0,0,0,0.2);
            border-radius: 16px;
            padding: 12px;
            margin-bottom: 16px;
          }
          .task-description p { margin: 5px 0 0 0; color: #b0bedb; }
          .task-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; font-size: 0.85rem; color: #b0bedb; }
          .meta-item { display: flex; align-items: center; gap: 6px; color: #b0bedb; }
          .meta-item strong { color: #00d4ff; }
          .overdue-text { color: #ef4444; margin-left: 8px; }
          .task-progress { margin-top: 8px; }
          .progress-label { font-size: 0.7rem; color: #9aa4bf; margin-bottom: 4px; }
          .progress { background: #1e293b; border-radius: 20px; height: 6px; overflow: hidden; }
          .progress-bar { height: 100%; border-radius: 20px; }
          .progress-bar.completed { background: #10b981; width: 100%; }
          .progress-bar.in-progress { background: #3b82f6; width: 50%; }
          .progress-bar.pending { background: #f59e0b; width: 25%; }
          .empty-state { text-align: center; padding: 48px; color: #7f8fa4; }
          /* Modal dark */
          .modal-overlay {
            position: fixed; top:0; left:0; right:0; bottom:0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            z-index: 1050;
          }
          .modern-modal {
            background: #0f172a;
            border-radius: 28px;
            border: 1px solid rgba(0,212,255,0.3);
            width: 90%;
            max-width: 450px;
          }
          .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 18px 24px;
            border-bottom: 1px solid #2a3a55;
          }
          .modal-header h3 { margin: 0; font-size: 1.2rem; color: #00d4ff; }
          .close-btn { background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #94a3b8; }
          .close-btn:hover { color: #00d4ff; }
          .modal-body { padding: 24px; }
          .form-field label { display: block; font-size: 0.7rem; font-weight: 600; color: #b0bedb; margin-bottom: 6px; text-transform: uppercase; }
          .form-select-dark {
            width: 100%;
            padding: 10px;
            background: rgba(0,0,0,0.4);
            border: 1px solid #2a3a55;
            border-radius: 20px;
            color: #fff;
          }
          .form-select-dark:focus {
            outline: none;
            border-color: #00d4ff;
            box-shadow: 0 0 12px rgba(0,212,255,0.2);
          }
          .modal-footer {
            display: flex; justify-content: flex-end; gap: 12px;
            padding: 16px 24px;
            border-top: 1px solid #2a3a55;
          }
          .cancel-modal-btn {
            background: #1e293b;
            border: none;
            padding: 8px 20px;
            border-radius: 40px;
            color: #cbd5e1;
            cursor: pointer;
          }
          .save-modal-btn {
            background: linear-gradient(90deg, #00b4d8, #0077b6);
            border: none;
            padding: 8px 24px;
            border-radius: 40px;
            color: white;
            font-weight: 600;
            cursor: pointer;
          }
          @media (max-width: 768px) {
            .my-tasks-container { padding: 16px; }
            .stats-grid { grid-template-columns: repeat(2,1fr); gap: 12px; }
            .task-header-info { flex-direction: column; }
            .task-meta { flex-direction: column; gap: 8px; }
          }
        `}</style>
      </div>
    </>
  );
}

export default MyTasks;