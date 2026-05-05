import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function TaskAssignments() {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    dueDate: ""
  });

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, []);

  const fetchTasks = async () => {
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

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentUserId = localStorage.getItem("userId");
      const members = response.data.filter(user => 
        (user.role === "employee" || user.role === "manager") && 
        user._id !== currentUserId
      );
      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BACKEND_URL}/api/auth/tasks`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Task assigned successfully!");
      setShowAssignModal(false);
      setFormData({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" });
      fetchTasks();
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error(error.response?.data?.message || "Failed to assign task");
    }
  };

  const handleEditClick = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignedTo._id,
      priority: task.priority,
      dueDate: task.dueDate.split('T')[0]
    });
    setShowEditModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BACKEND_URL}/api/auth/tasks/${selectedTask._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Task updated successfully!");
      setShowEditModal(false);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.response?.data?.message || "Failed to update task");
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTask = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/api/auth/tasks/${taskToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Task deleted successfully!");
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(error.response?.data?.message || "Failed to delete task");
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

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesSearch = searchTerm === "" || 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading tasks...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="task-assignments-container">
        <div className="task-header">
          <div>
            <h3>✅ Task Assignments</h3>
            <p className="text-muted">Manage and assign tasks to team members</p>
          </div>
          <button className="assign-btn" onClick={() => setShowAssignModal(true)}>
            + Assign New Task
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-info"><h3>{tasks.length}</h3><p>Total Tasks</p></div></div>
          <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-info"><h3>{tasks.filter(t => t.status === "pending").length}</h3><p>Pending</p></div></div>
          <div className="stat-card"><div className="stat-icon">🔄</div><div className="stat-info"><h3>{tasks.filter(t => t.status === "in-progress").length}</h3><p>In Progress</p></div></div>
          <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-info"><h3>{tasks.filter(t => t.status === "completed").length}</h3><p>Completed</p></div></div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <input type="text" className="search-input" placeholder="🔍 Search by task title or team member..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="overdue">Overdue</option>
          </select>
          <select className="filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All Priority</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
          </select>
          <button className="refresh-btn" onClick={fetchTasks}>🔄 Refresh</button>
        </div>

        {/* Tasks Table */}
        <div className="table-wrapper">
          <table className="modern-table">
            <thead><tr><th>#</th><th>Task Title</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Progress</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr><td colSpan="8" className="empty-state"><div>📭 No tasks found</div></td></tr>
              ) : (
                filteredTasks.map((task, index) => (
                  <tr key={task._id}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Task Title"><strong>{task.title}</strong>{task.description && <><br /><small>{task.description.substring(0, 50)}...</small></>}</td>
                    <td data-label="Assigned To"><strong>{task.assignedTo?.name}</strong><br /><small>{task.assignedTo?.designation}</small></td>
                    <td data-label="Priority"><span className={`priority-badge ${task.priority}`}>{task.priority.toUpperCase()}</span></td>
                    <td data-label="Status"><span className={`status-badge ${task.status}`}>{task.status.toUpperCase()}</span></td>
                    <td data-label="Due Date">{new Date(task.dueDate).toLocaleDateString()}{new Date(task.dueDate) < new Date() && task.status !== "completed" && <><br /><span className="overdue-text">Overdue!</span></>}</td>
                    <td data-label="Progress"><div className="progress"><div className={`progress-bar ${task.status === "completed" ? "completed" : task.status === "in-progress" ? "in-progress" : "pending"}`} style={{ width: task.status === "completed" ? "100%" : task.status === "in-progress" ? "50%" : "25%" }}></div></div></td>
                    <td data-label="Actions"><div className="action-buttons"><button className="edit-action" onClick={() => handleEditClick(task)}>✏️</button><button className="delete-action" onClick={() => handleDeleteClick(task)}>🗑️</button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Assign Task Modal */}
        {showAssignModal && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h3>📝 Assign New Task</h3><button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button></div>
              <form onSubmit={handleAssignTask}>
                <div className="modal-body">
                  <div className="form-field"><label>Task Title *</label><input type="text" name="title" value={formData.title} onChange={handleInputChange} required /></div>
                  <div className="form-field"><label>Description</label><textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} /></div>
                  <div className="form-field"><label>Assign To *</label><select name="assignedTo" value={formData.assignedTo} onChange={handleInputChange} required><option value="">Select Team Member</option>{teamMembers.map(m => <option key={m._id} value={m._id}>{m.name} - {m.designation || m.role}</option>)}</select></div>
                  <div className="form-row"><div className="form-field"><label>Priority</label><select name="priority" value={formData.priority} onChange={handleInputChange}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div className="form-field"><label>Due Date *</label><input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} required /></div></div>
                </div>
                <div className="modal-footer"><button type="button" className="cancel-modal-btn" onClick={() => setShowAssignModal(false)}>Cancel</button><button type="submit" className="save-modal-btn">Assign Task</button></div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditModal && selectedTask && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h3>✏️ Edit Task: {selectedTask.title}</h3><button className="close-btn" onClick={() => setShowEditModal(false)}>×</button></div>
              <form onSubmit={handleUpdateTask}>
                <div className="modal-body">
                  <div className="form-field"><label>Task Title *</label><input type="text" name="title" value={formData.title} onChange={handleInputChange} required /></div>
                  <div className="form-field"><label>Description</label><textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} /></div>
                  <div className="form-field"><label>Assign To *</label><select name="assignedTo" value={formData.assignedTo} onChange={handleInputChange} required><option value="">Select Team Member</option>{teamMembers.map(m => <option key={m._id} value={m._id}>{m.name} - {m.designation || m.role}</option>)}</select></div>
                  <div className="form-row"><div className="form-field"><label>Priority</label><select name="priority" value={formData.priority} onChange={handleInputChange}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div className="form-field"><label>Due Date *</label><input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} required /></div></div>
                </div>
                <div className="modal-footer"><button type="button" className="cancel-modal-btn" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="save-modal-btn">Update Task</button></div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header"><span>⚠️ Confirm Delete</span></div>
              <div className="delete-modal-body"><p>Are you sure you want to delete task: <strong>{taskToDelete?.title}</strong>?</p><p className="warning-text">This action cannot be undone!</p></div>
              <div className="delete-modal-footer"><button className="cancel-delete-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button><button className="confirm-delete-btn" onClick={handleDeleteTask}>Delete Task</button></div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .task-assignments-container {
          background: rgba(15, 25, 45, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 28px;
          padding: 28px;
          border: 1px solid rgba(0, 212, 255, 0.2);
        }
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          border-bottom: 1px solid rgba(0,212,255,0.3);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .task-header h3 {
          margin: 0;
          background: linear-gradient(135deg, #ffffff, #00d4ff);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .text-muted { color: #9aa4bf !important; }
        .assign-btn {
          background: linear-gradient(90deg, #00b4d8, #0077b6);
          border: none;
          padding: 10px 24px;
          border-radius: 40px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        .assign-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(0,180,216,0.3); }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: rgba(10,18,32,0.7);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid rgba(0,212,255,0.2);
        }
        .stat-icon { font-size: 2rem; color: #00d4ff; }
        .stat-info h3 { margin: 0; font-size: 1.8rem; font-weight: 700; color: #fff; }
        .stat-info p { margin: 0; color: #9aa4bf; font-size: 0.8rem; }
        .filters-section {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .search-input, .filter-select {
          flex: 1;
          min-width: 150px;
          padding: 12px 16px;
          background: rgba(0,0,0,0.4);
          border: 1px solid #2a3a55;
          border-radius: 40px;
          color: #fff;
          font-size: 0.9rem;
        }
        .search-input:focus, .filter-select:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }
        .refresh-btn {
          background: rgba(0,212,255,0.15);
          border: 1px solid rgba(0,212,255,0.3);
          padding: 12px 20px;
          border-radius: 40px;
          color: #00d4ff;
          cursor: pointer;
          transition: 0.2s;
        }
        .refresh-btn:hover { background: rgba(0,212,255,0.25); }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 20px;
          border: 1px solid #2a3a55;
          background: rgba(10,18,32,0.5);
        }
        .modern-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .modern-table th {
          text-align: left;
          padding: 14px 12px;
          color: #00d4ff;
          font-size: 0.75rem;
          text-transform: uppercase;
          border-bottom: 1px solid #2a3a55;
        }
        .modern-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #1e2a3a;
          color: #cbd5e1;
          vertical-align: middle;
        }
        .modern-table tbody tr:hover { background: rgba(0,212,255,0.05); }
        .priority-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .priority-badge.low { background: #10b981; color: white; }
        .priority-badge.medium { background: #3b82f6; color: white; }
        .priority-badge.high { background: #f59e0b; color: white; }
        .priority-badge.urgent { background: #ef4444; color: white; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .status-badge.pending { background: #f59e0b; color: white; }
        .status-badge.in-progress { background: #3b82f6; color: white; }
        .status-badge.completed { background: #10b981; color: white; }
        .status-badge.overdue { background: #ef4444; color: white; }
        .overdue-text { color: #ef4444; font-size: 0.7rem; }
        .progress { background: #1e293b; border-radius: 10px; height: 6px; overflow: hidden; }
        .progress-bar { height: 100%; border-radius: 10px; }
        .progress-bar.completed { background: #10b981; width: 100%; }
        .progress-bar.in-progress { background: #3b82f6; width: 50%; }
        .progress-bar.pending { background: #f59e0b; width: 25%; }
        .action-buttons { display: flex; gap: 8px; }
        .edit-action, .delete-action {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: 0.2s;
        }
        .edit-action:hover { background: rgba(0,212,255,0.15); transform: scale(1.05); }
        .delete-action:hover { background: rgba(239,68,68,0.2); transform: scale(1.05); }
        .empty-state { text-align: center; padding: 48px; color: #7f8fa4; }
        /* Modals */
        .modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1050;
        }
        .modern-modal, .delete-modal {
          background: #0f172a;
          border-radius: 32px;
          border: 1px solid rgba(0,212,255,0.3);
        }
        .modern-modal { width: 90%; max-width: 700px; max-height: 85vh; overflow-y: auto; }
        .delete-modal { width: 90%; max-width: 450px; }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 28px; border-bottom: 1px solid #2a3a55;
        }
        .modal-header h3 { margin: 0; font-size: 1.3rem; color: #00d4ff; }
        .close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: #94a3b8; }
        .close-btn:hover { color: #00d4ff; }
        .modal-body { padding: 28px; }
        .form-field { margin-bottom: 20px; }
        .form-field label {
          display: block; font-size: 0.7rem; font-weight: 600;
          color: #b0bedb; margin-bottom: 6px; text-transform: uppercase;
        }
        .form-field input, .form-field select, .form-field textarea {
          width: 100%; padding: 12px;
          background: rgba(0,0,0,0.4);
          border: 1px solid #2a3a55;
          border-radius: 20px;
          color: #fff;
          font-size: 0.9rem;
        }
        .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
          outline: none; border-color: #00d4ff; box-shadow: 0 0 12px rgba(0,212,255,0.2);
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 12px;
          padding: 20px 28px; border-top: 1px solid #2a3a55;
        }
        .cancel-modal-btn, .cancel-delete-btn {
          background: #1e293b; border: none; padding: 10px 20px;
          border-radius: 40px; color: #cbd5e1; cursor: pointer;
        }
        .save-modal-btn {
          background: linear-gradient(90deg, #00b4d8, #0077b6);
          color: white; border: none; padding: 10px 24px;
          border-radius: 40px; font-weight: 600; cursor: pointer;
        }
        .confirm-delete-btn {
          background: #dc2626; border: none; padding: 10px 20px;
          border-radius: 40px; color: white; font-weight: 600; cursor: pointer;
        }
        .warning-text { color: #ef4444; font-size: 0.85rem; margin-top: 8px; }
        @media (max-width: 768px) {
          .task-assignments-container { padding: 16px; }
          .stats-grid { grid-template-columns: repeat(2,1fr); }
          .filters-section { flex-direction: column; }
          .form-row { grid-template-columns: 1fr; gap: 12px; }
          .modern-table thead { display: none; }
          .modern-table tbody tr {
            display: block; margin-bottom: 16px; border: 1px solid #2a3a55; border-radius: 16px; padding: 12px;
          }
          .modern-table td {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 12px; border-bottom: 1px solid #1e2a3a;
          }
          .modern-table td::before {
            content: attr(data-label); font-weight: 600; color: #00d4ff; width: 40%;
          }
        }
      `}</style>
    </>
  );
}

export default TaskAssignments;