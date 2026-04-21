import MyTasks from "./MyTasks.jsx";

export default function EmployeeDashboard({ activeMenu = "overview", user }) {
  if (activeMenu === "my-tasks") {
    return <MyTasks />;
  }
  
  if (activeMenu === "attendance") {
    return (
      <div className="alert alert-info mt-3">
        <h4>Attendance</h4>
        <p>View and mark your attendance...</p>
      </div>
    );
  }
  
  if (activeMenu === "leave-request") {
    return (
      <div className="alert alert-info mt-3">
        <h4>Leave Request</h4>
        <p>Apply for leave and view your leave balance...</p>
      </div>
    );
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