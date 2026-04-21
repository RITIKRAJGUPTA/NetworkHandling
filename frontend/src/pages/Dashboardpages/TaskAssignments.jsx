import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL = 'http://localhost:5000';

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
      // Filter employees (not admin, not hr, not current manager)
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
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        dueDate: ""
      });
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
    const colors = {
      low: "success",
      medium: "info",
      high: "warning",
      urgent: "danger"
    };
    return colors[priority] || "secondary";
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      "in-progress": "primary",
      completed: "success",
      overdue: "danger"
    };
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
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading tasks...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="task-assignments-container">
        <div className="task-header">
          <div>
            <h3 className="mb-2">
              <i className="bi bi-check2-square"></i> Task Assignments
            </h3>
            <p className="text-muted">Manage and assign tasks to team members</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
            <i className="bi bi-plus-circle"></i> Assign New Task
          </button>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{tasks.length}</h3>
                <p>Total Tasks</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{tasks.filter(t => t.status === "pending").length}</h3>
                <p>Pending</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stat-card">
              <div className="stat-icon">🔄</div>
              <div className="stat-info">
                <h3>{tasks.filter(t => t.status === "in-progress").length}</h3>
                <p>In Progress</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{tasks.filter(t => t.status === "completed").length}</h3>
                <p>Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search by task title or team member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-primary w-100" onClick={fetchTasks}>
                <i className="bi bi-arrow-repeat"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "20%" }}>Task Title</th>
                <th style={{ width: "15%" }}>Assigned To</th>
                <th style={{ width: "10%" }}>Priority</th>
                <th style={{ width: "10%" }}>Status</th>
                <th style={{ width: "12%" }}>Due Date</th>
                <th style={{ width: "8%" }}>Progress</th>
                <th style={{ width: "20%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-inbox" style={{ fontSize: "48px" }}></i>
                      <p className="mt-2">No tasks found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, index) => (
                  <tr key={task._id}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <strong>{task.title}</strong>
                      {task.description && (
                        <>
                          <br />
                          <small className="text-muted">{task.description.substring(0, 50)}...</small>
                        </>
                      )}
                    </td>
                    <td>
                      <strong>{task.assignedTo?.name}</strong>
                      <br />
                      <small className="text-muted">{task.assignedTo?.designation}</small>
                    </td>
                    <td>
                      <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${getStatusColor(task.status)}`}>
                        {task.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {new Date(task.dueDate).toLocaleDateString()}
                      {new Date(task.dueDate) < new Date() && task.status !== "completed" && (
                        <>
                          <br />
                          <small className="text-danger">Overdue!</small>
                        </>
                      )}
                    </td>
                    <td>
                      <div className="progress" style={{ height: "5px" }}>
                        <div 
                          className={`progress-bar bg-${task.status === "completed" ? "success" : "primary"}`}
                          style={{ width: task.status === "completed" ? "100%" : task.status === "in-progress" ? "50%" : "25%" }}
                        ></div>
                      </div>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleEditClick(task)}
                          title="Edit Task"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteClick(task)}
                          title="Delete Task"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Assign Task Modal */}
        {showAssignModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Assign New Task</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAssignModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAssignTask}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Task Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the task details..."
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Assign To *</label>
                      <select
                        className="form-select"
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Team Member</option>
                        {teamMembers.map(member => (
                          <option key={member._id} value={member._id}>
                            {member.name} - {member.designation || member.role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Priority</label>
                        <select
                          className="form-select"
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Due Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAssignModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Assign Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditModal && selectedTask && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Task: {selectedTask.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleUpdateTask}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Task Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Assign To *</label>
                      <select
                        className="form-select"
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Team Member</option>
                        {teamMembers.map(member => (
                          <option key={member._id} value={member._id}>
                            {member.name} - {member.designation || member.role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Priority</label>
                        <select
                          className="form-select"
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Due Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDeleteConfirm(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete task: <strong>{taskToDelete?.title}</strong>?</p>
                  <p className="text-danger">This action cannot be undone!</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteTask}
                  >
                    Delete Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .task-assignments-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }

        .task-header h3 {
          margin: 0;
          color: #1a1a2e;
          font-weight: 600;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .stat-card .stat-icon {
          font-size: 32px;
        }

        .stat-card .stat-info h3 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }

        .stat-card .stat-info p {
          margin: 0;
          opacity: 0.9;
        }

        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
          border-top: none;
        }

        .table td {
          vertical-align: middle;
        }

        .badge {
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 6px;
        }

        .progress {
          background-color: #e9ecef;
          border-radius: 10px;
        }

        .btn-group {
          gap: 5px;
        }

        .modal.show {
          display: block;
          z-index: 1050;
        }

        @media (max-width: 768px) {
          .task-assignments-container {
            padding: 16px;
          }

          .task-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .stat-card {
            padding: 15px;
          }

          .stat-card .stat-info h3 {
            font-size: 20px;
          }

          .table {
            font-size: 12px;
          }

          .btn-group {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}

export default TaskAssignments;