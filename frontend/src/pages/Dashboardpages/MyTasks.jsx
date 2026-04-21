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
    return filterStatus === "all" || task.status === filterStatus;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "completed").length
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your tasks...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="my-tasks-container">
        <div className="tasks-header">
          <h3 className="mb-2">
            <i className="bi bi-check2-square"></i> My Tasks
          </h3>
          <p className="text-muted">Track and manage your assigned tasks</p>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Tasks</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats.pending}</h3>
                <p>Pending</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stat-card progress">
              <div className="stat-icon">🔄</div>
              <div className="stat-info">
                <h3>{stats.inProgress}</h3>
                <p>In Progress</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stat-card completed">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.completed}</h3>
                <p>Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="filters-section mb-4">
          <div className="row">
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="col-md-8">
              <button className="btn btn-outline-primary" onClick={fetchMyTasks}>
                <i className="bi bi-arrow-repeat"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: "48px", color: "#ccc" }}></i>
              <p className="mt-2 text-muted">No tasks found</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task._id} className="task-card">
                <div className="task-header-info">
                  <div className="task-title-section">
                    <h5>{task.title}</h5>
                    <div className="task-badges">
                      <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span className={`badge bg-${getStatusColor(task.status)}`}>
                        {task.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setSelectedTask(task);
                      setUpdateStatus(task.status);
                      setShowUpdateModal(true);
                    }}
                  >
                    <i className="bi bi-pencil"></i> Update Status
                  </button>
                </div>
                
                {task.description && (
                  <div className="task-description">
                    <strong>Description:</strong>
                    <p>{task.description}</p>
                  </div>
                )}
                
                <div className="task-meta">
                  <div className="meta-item">
                    <i className="bi bi-person"></i>
                    <span>Assigned by: <strong>{task.assignedBy?.name}</strong></span>
                  </div>
                  <div className="meta-item">
                    <i className="bi bi-calendar"></i>
                    <span>Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong></span>
                    {new Date(task.dueDate) < new Date() && task.status !== "completed" && (
                      <span className="text-danger ms-2">(Overdue!)</span>
                    )}
                  </div>
                </div>
                
                <div className="task-progress">
                  <div className="progress-label">Progress</div>
                  <div className="progress">
                    <div 
                      className={`progress-bar bg-${task.status === "completed" ? "success" : "primary"}`}
                      style={{ 
                        width: task.status === "completed" ? "100%" : 
                               task.status === "in-progress" ? "50%" : "25%" 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Update Status Modal */}
        {showUpdateModal && selectedTask && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Update Task Status: {selectedTask.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowUpdateModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleUpdateStatus}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value)}
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowUpdateModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update Status
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .my-tasks-container {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .tasks-header {
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 16px;
            margin-bottom: 24px;
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

          .stat-card.pending {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          .stat-card.progress {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          .stat-card.completed {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }

          .stat-icon {
            font-size: 32px;
          }

          .stat-info h3 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }

          .stat-info p {
            margin: 0;
            opacity: 0.9;
          }

          .task-card {
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
          }

          .task-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          .task-header-info {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
          }

          .task-title-section h5 {
            margin: 0 0 10px 0;
            color: #1a1a2e;
          }

          .task-badges {
            display: flex;
            gap: 10px;
          }

          .task-description {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }

          .task-description p {
            margin: 5px 0 0 0;
            color: #6c757d;
          }

          .task-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
            font-size: 14px;
          }

          .meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
            color: #6c757d;
          }

          .task-progress {
            margin-top: 10px;
          }

          .progress-label {
            font-size: 12px;
            margin-bottom: 5px;
            color: #6c757d;
          }

          .progress {
            height: 8px;
            border-radius: 10px;
          }

          @media (max-width: 768px) {
            .my-tasks-container {
              padding: 16px;
            }

            .task-header-info {
              flex-direction: column;
              gap: 10px;
            }

            .task-meta {
              flex-direction: column;
              gap: 8px;
            }

            .stat-card {
              padding: 15px;
            }

            .stat-info h3 {
              font-size: 20px;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default MyTasks;