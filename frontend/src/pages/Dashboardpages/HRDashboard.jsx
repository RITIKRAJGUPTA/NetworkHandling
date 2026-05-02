import EmployeeManagement from "./EmployeeManagement";
import AttendanceManagement from "./AttendanceManagement"; 
import LeaveApprovals from "./LeaveApprovals";

export default function HRDashboard({ activeMenu = "overview" }) {
  if (activeMenu === "employees") {
    return <EmployeeManagement />;
  }

  if (activeMenu === "recruitment") {
    return (
      <div className="alert alert-info mt-3">
        <h4>Recruitment</h4>
        <p>Post jobs, review applications, manage candidates...</p>
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
    <div className="hr-overview">
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">HR Dashboard</h5>
              <p className="card-text">
                Use the sidebar to manage employees, recruitment, leave, and attendance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}