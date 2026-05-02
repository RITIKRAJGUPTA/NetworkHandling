import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminDashboard from "../Dashboardpages/AdminDashboard.jsx";
import HRDashboard from "../Dashboardpages/HRDashboard.jsx";
import EmployerDashboard from "../Dashboardpages/EmployerDashboard.jsx";
import ManagerDashboard from "../Dashboardpages/ManagerDashboard.jsx";
import EmployeeDashboard from "../Dashboardpages/EmployeeDashboard.jsx";
import MyProfile from "../Dashbaord/Profile/MyProfile.jsx";
import RoleOverviewStats from "../Dashboardpages/RoleOverviewStats.jsx";
import "./Dashboard.css";

export default function Dashboard() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("overview");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    const storedUserId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    setRole(userRole);
    setUserId(storedUserId);

    if (storedUserId && token) {
      axios
        .get(`/api/auth/profile/${storedUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/");
    }
  };

  if (loading) {
    return <div className="container mt-4">Loading dashboard...</div>;
  }

  const getMenuItems = () => {
    const commonMenus = [
      { id: "overview", label: "Overview", icon: "📊" },
      { id: "profile", label: "My Profile", icon: "👤" },
    ];

    const roleSpecificMenus = {
      admin: [
        { id: "users", label: "Manage Users", icon: "👥" },
        { id: "settings", label: "System Settings", icon: "⚙️" },
        { id: "reports", label: "View Reports", icon: "📈" },
        // { id: "roles", label: "Manage Roles", icon: "🔑" },
      ],
      hr: [
        { id: "employees", label: "Employee Management", icon: "👔" },
        // { id: "recruitment", label: "Recruitment", icon: "📝" },
        { id: "leave", label: "Leave Approvals", icon: "📅" },
        { id: "attendance", label: "Attendance", icon: "⏰" },
      ],
      employer: [
        { id: "company", label: "Company Profile", icon: "🏢" },
        { id: "jobs", label: "Job Postings", icon: "💼" },
        { id: "candidates", label: "Candidates", icon: "📋" },
        { id: "billing", label: "Billing", icon: "💰" },
      ],
      manager: [
        { id: "team", label: "Team Overview", icon: "👥" },
        { id: "tasks", label: "Task Assignments", icon: "✅" },
        { id: "performance", label: "Performance", icon: "📈" },
        { id: "leave-team", label: "Leave Requests", icon: "📅" },
      ],
      employee: [
        { id: "my-tasks", label: "My Tasks", icon: "📌" },
        { id: "attendance", label: "Attendance", icon: "⏰" },
        { id: "leave-request", label: "Leave Request", icon: "📝" },
        { id: "performance", label: "My Performance", icon: "📊" },
        // { id: "reviews", label: "Performance Reviews", icon: "⭐" },
      ],
    };

    return [...commonMenus, ...(roleSpecificMenus[role] || [])];
  };

  const renderMainContent = () => {
    if (activeMenu === "profile") {
      return <MyProfile userId={userId} />;
    }

    if (activeMenu === "overview") {
      switch (role) {
        case "admin":
          return <AdminDashboard activeMenu={activeMenu} />;
        case "hr":
          return <HRDashboard activeMenu={activeMenu} />;
        case "employer":
          return <EmployerDashboard activeMenu={activeMenu} />;
        case "manager":
          return <ManagerDashboard activeMenu={activeMenu} />;
        case "employee":
          return <EmployeeDashboard user={user} activeMenu={activeMenu} />;
        default:
          return <div className="alert alert-danger">Invalid role: {role}</div>;
      }
    }

    if (role === "admin") return <AdminDashboard activeMenu={activeMenu} />;
    if (role === "manager") return <ManagerDashboard activeMenu={activeMenu} managerId={userId} />;
    if (role === "hr") return <HRDashboard activeMenu={activeMenu} />;
    if (role === "employer") return <EmployerDashboard activeMenu={activeMenu} />;
    if (role === "employee") return <EmployeeDashboard user={user} activeMenu={activeMenu} />;

    return (
      <div className="content-card">
        <h3>{getMenuItems().find((item) => item.id === activeMenu)?.label}</h3>
        <p>Content for {activeMenu} will be displayed here.</p>
      </div>
    );
  };

  const menuItems = getMenuItems();

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <h3>✨ HRMS Dashboard</h3>
        </div>
        <div className="navbar-user">
          <span className="user-role-badge">{role?.toUpperCase()}</span>
          <span className="user-name">{user?.name || role}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li
                key={item.id}
                className={`sidebar-item ${activeMenu === item.id ? "active" : ""}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </li>
            ))}
          </ul>
        </aside>

        <main className="dashboard-main">
          {activeMenu !== "profile" && (
            <div className="welcome-section">
  <div className="welcome-header">
    <div>
      <h2>Welcome, {user?.name || role}!</h2>
      <p className="text-muted">Here's what's happening with your {role} dashboard today.</p>
    </div>
    <div className="welcome-date">
      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>
  {/* Stats cards – only on overview menu */}
  {activeMenu === "overview" && (
    <RoleOverviewStats role={role} userId={userId} />
  )}
</div>
          )}
          <div className="main-content-area">{renderMainContent()}</div>
        </main>
      </div>
    </div>
  );
}