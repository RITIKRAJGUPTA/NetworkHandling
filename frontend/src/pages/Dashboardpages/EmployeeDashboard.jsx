// src/pages/DashboardPages/EmployeeDashboard.jsx
import MyTasks from "./MyTasks";
import EmployeePerformance from "./EmployeePerformance";
import EmployeeAttendance from "./EmployeeAttendance";
import EmployeeLeaveRequest from "./EmployeeLeaveRequest";
import SiteDataManagement from "./SiteDataManagement"; 

export default function EmployeeDashboard({ activeMenu = "overview", user }) {
  if (activeMenu === "my-tasks") {
    return <MyTasks />;
  }

  if (activeMenu === "performance") {
    return <EmployeePerformance userId={user?._id} />;
  }

  if (activeMenu === "attendance") {
    return <EmployeeAttendance />;
  }

  if (activeMenu === "leave-request") {
    return <EmployeeLeaveRequest userId={user?._id} />;
  }
  if (activeMenu === "site-data") {
  return <SiteDataManagement />;
}

  if (activeMenu === "reviews") {
    return (
      <div className="employee-dashboard-container">
        <div className="alert alert-info mt-3">
          <h4>Performance Reviews</h4>
          <p>View your performance reviews and feedback...</p>
        </div>
      </div>
    );
  }

  // Default overview
  return (
    <div className="employee-dashboard-container">
      <div className="welcome-card">
        <div className="welcome-icon">👋</div>
        <div className="welcome-content">
          <h5 className="welcome-title">Welcome, {user?.name}!</h5>
          <p className="welcome-text">Your employee dashboard is ready. Use the sidebar to manage tasks, attendance, leave, and performance.</p>
        </div>
      </div>
    </div>
  );
}

// Add embedded styles for dark theme – these will apply only when overview is shown
// (child components already have their own styling)
const style = document.createElement('style');
style.textContent = `
  .employee-dashboard-container {
    background: rgba(15, 25, 45, 0.6);
    backdrop-filter: blur(12px);
    border-radius: 28px;
    padding: 28px;
    border: 1px solid rgba(0, 212, 255, 0.2);
  }
  .welcome-card {
    background: rgba(10, 18, 32, 0.7);
    border-radius: 24px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    border: 1px solid rgba(0, 212, 255, 0.2);
    transition: all 0.2s;
  }
  .welcome-card:hover {
    border-color: #00d4ff;
    transform: translateY(-2px);
  }
  .welcome-icon {
    font-size: 3rem;
  }
  .welcome-content {
    flex: 1;
  }
  .welcome-title {
    margin: 0 0 8px 0;
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ffffff, #00d4ff);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
  .welcome-text {
    margin: 0;
    color: #b0bedb;
    font-size: 0.9rem;
  }
  .alert-info {
    background: rgba(0,212,255,0.1);
    border: none;
    border-radius: 24px;
    color: #00d4ff;
  }
  @media (max-width: 768px) {
    .employee-dashboard-container { padding: 16px; }
    .welcome-card { flex-direction: column; text-align: center; gap: 12px; }
    .welcome-title { font-size: 1.3rem; }
  }
`;
if (!document.head.querySelector('#employee-dashboard-styles')) {
  style.id = 'employee-dashboard-styles';
  document.head.appendChild(style);
}