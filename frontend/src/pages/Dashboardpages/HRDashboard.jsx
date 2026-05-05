import EmployeeManagement from "./EmployeeManagement";
import AttendanceManagement from "./AttendanceManagement"; 
import LeaveApprovals from "./LeaveApprovals";

export default function HRDashboard({ activeMenu = "overview" }) {
  if (activeMenu === "employees") {
    return <EmployeeManagement />;
  }

  if (activeMenu === "recruitment") {
    return (
      <div className="hr-dashboard-container">
        <div className="alert alert-info mt-3">
          <h4>Recruitment</h4>
          <p>Post jobs, review applications, manage candidates...</p>
        </div>
      </div>
    );
  }

  if (activeMenu === "leave") {
    return <LeaveApprovals />;
  }

  if (activeMenu === "attendance") {
    return <AttendanceManagement />;
  }

  // Default overview
  return (
    <div className="hr-dashboard-container">
      <div className="welcome-card">
        <div className="welcome-icon">💼</div>
        <div className="welcome-content">
          <h5 className="welcome-title">HR Dashboard</h5>
          <p className="welcome-text">
            Use the sidebar to manage employees, recruitment, leave, and attendance.
          </p>
        </div>
      </div>
    </div>
  );
}

// Inject dark theme styles for the HR dashboard container (only once)
const style = document.createElement('style');
style.textContent = `
  .hr-dashboard-container {
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
    .hr-dashboard-container { padding: 16px; }
    .welcome-card { flex-direction: column; text-align: center; gap: 12px; }
    .welcome-title { font-size: 1.3rem; }
  }
`;
if (!document.head.querySelector('#hr-dashboard-styles')) {
  style.id = 'hr-dashboard-styles';
  document.head.appendChild(style);
}