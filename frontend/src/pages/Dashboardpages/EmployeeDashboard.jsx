// src/pages/DashboardPages/EmployeeDashboard.jsx
import MyTasks from "./MyTasks";
import EmployeePerformance from "./EmployeePerformance";
import EmployeeAttendance from "./EmployeeAttendance";
import EmployeeLeaveRequest from "./EmployeeLeaveRequest";

export default function EmployeeDashboard({ activeMenu = "overview", user }) {
  if (activeMenu === "my-tasks") {
    return <MyTasks />;
  }

  if (activeMenu === "performance") {
    return <EmployeePerformance userId={user?._id} />;
  }

  if (activeMenu === "attendance") {
    return <EmployeeAttendance />;   // ✅ new component
  }

  if (activeMenu === "leave-request") {
  return <EmployeeLeaveRequest userId={user?._id} />;
}

  if (activeMenu === "reviews") {
    return (
      <div className="alert alert-info mt-3">
        <h4>Performance Reviews</h4>
        <p>View your performance reviews and feedback...</p>
      </div>
    );
  }

  // Default overview
  return (
    <div className="employee-overview">
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Welcome, {user?.name}!</h5>
              <p className="card-text">Your employee dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}