import ManageUsers from "./ManageUsers.jsx";
import Reports from "./Reports.jsx";

export default function AdminDashboard({ activeMenu = "overview" }) {
  console.log("AdminDashboard activeMenu:", activeMenu);
  
  if (activeMenu === "users") {
    return <ManageUsers />;
  }
  
  if (activeMenu === "settings") {
    return (
      <div className="alert alert-info">
        <h4>System Settings</h4>
        <p>Configure system-wide settings here...</p>
      </div>
    );
  }
  
  if (activeMenu === "reports") {
    return <Reports />;
  }
  
  if (activeMenu === "roles") {
    return (
      <div className="alert alert-info">
        <h4>Roles & Permissions</h4>
        <p>Manage user roles and permissions here...</p>
      </div>
    );
  }

  // Default overview for admin
  return (
    <div className="admin-overview">
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Quick Stats</h5>
              <p className="card-text">Welcome to Admin Dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}