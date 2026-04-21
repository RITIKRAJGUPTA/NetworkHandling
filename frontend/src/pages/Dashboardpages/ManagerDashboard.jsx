import TeamOverview from "./TeamOverview.jsx";
import TaskAssignments from "./TaskAssignments.jsx";

export default function ManagerDashboard({ activeMenu = "overview" }) {
  console.log("ManagerDashboard activeMenu:", activeMenu); // Debug log to check if prop is received
  
  if (activeMenu === "team") {
    return <TeamOverview />;
  }
  
   if (activeMenu === "tasks") {
    return <TaskAssignments />;
  }
  
  if (activeMenu === "performance") {
    return (
      <div className="alert alert-info mt-3">
        <h4>Team Performance Metrics</h4>
        <p>View team performance and analytics...</p>
      </div>
    );
  }
  
  if (activeMenu === "leave-team") {
    return (
      <div className="alert alert-info mt-3">
        <h4>Leave Requests</h4>
        <p>Review and manage team leave requests...</p>
      </div>
    );
  }

  // Default overview
  return (
    <div className="manager-overview">
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Quick Stats</h5>
              <p className="card-text">Welcome to Manager Dashboard</p>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Team Updates</h5>
              <p className="card-text">Recent activities from your team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}