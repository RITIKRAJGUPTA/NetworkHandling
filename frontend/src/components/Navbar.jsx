import { Link } from "react-router-dom";


export default function Navbar() {
return (
<nav className="navbar navbar-dark bg-dark navbar-expand-lg px-3">
<Link to="/" className="navbar-brand">Auth System</Link>
<div className="ms-auto">
<Link className="btn btn-outline-light me-2" to="/">Login</Link>
<Link className="btn btn-outline-warning" to="/register">Register</Link>
</div>
</nav>
);
}