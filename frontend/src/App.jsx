import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashbaord/Dashboard";
import ForgetPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";



export default function App() {
return (
<BrowserRouter>
<Routes>
<Route path="/" element={<Login />} />
<Route path="/register" element={<Register />} />
{/* Password Reset Routes */}
<Route path="/forgot-password" element={<ForgetPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />
<Route path="/dashboard" element={<Dashboard />} />
</Routes>
</BrowserRouter>
);
}