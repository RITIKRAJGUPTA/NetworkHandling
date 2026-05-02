import TeamOverview from "./TeamOverview.jsx";
import TaskAssignments from "./TaskAssignments.jsx";
import Performance from "./Performance.jsx";
import ManagerLeaveRequests from "./ManagerLeaveRequests";

export default function ManagerDashboard({ activeMenu = "overview", managerId }) {
  console.log("ManagerDashboard activeMenu:", activeMenu, "managerId:", managerId);
  
  if (activeMenu === "team") {
    return <TeamOverview managerId={managerId} />;
  }
  
  if (activeMenu === "tasks") {
    return <TaskAssignments managerId={managerId} />;
  }
  
  if (activeMenu === "performance") {
    return <Performance managerId={managerId} />;
  }
  
  if (activeMenu === "leave-team") {
  return <ManagerLeaveRequests />;
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