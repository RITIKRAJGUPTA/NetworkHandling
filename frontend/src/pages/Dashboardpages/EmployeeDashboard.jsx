export default function EmployeeDashboard({ user }) {
  return (
    <div className="alert alert-secondary mt-3">
      <h3>Employee Dashboard</h3>
      <p><strong>Designation:</strong> {user?.designation || "Not assigned"}</p>
      {user?.teamLead && (
        <p><strong>Team Lead:</strong> {user.teamLead.name || user.teamLead}</p>
      )}
      <ul>
        <li>My tasks</li>
        <li>Attendance tracking</li>
        <li>Leave requests</li>
        <li>Performance reviews</li>
        <li>Training materials</li>
      </ul>
    </div>
  );
}