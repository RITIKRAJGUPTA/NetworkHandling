export default function Dashboard() {
const role = localStorage.getItem("role");


return (
<div className="container mt-4">
<h2>Dashboard ({role})</h2>


{role === "admin" && <div className="alert alert-primary mt-3">Admin Controls Here</div>}
{role === "hr" && <div className="alert alert-warning mt-3">HR Features Here</div>}
{role === "employer" && <div className="alert alert-info mt-3">Employer Features Here</div>}
</div>
);
}