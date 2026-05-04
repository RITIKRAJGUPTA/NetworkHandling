// src/pages/DashboardPages/RoleOverviewStats.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000";

export default function RoleOverviewStats({ role, userId }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    pendingTasks: 0,
    pendingLeaves: 0,
    teamSize: 0,
    myTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        let totalUsers = 0,
          totalTasks = 0,
          pendingTasks = 0,
          pendingLeaves = 0,
          teamSize = 0,
          myTasks = 0;

        if (role === "admin") {
          const [usersRes, tasksRes, leavesRes] = await Promise.all([
            axios.get(`${BACKEND_URL}/api/auth/users`, config),
            axios.get(`${BACKEND_URL}/api/auth/tasks`, config),
            axios.get(`${BACKEND_URL}/api/leave?status=pending`, config),
          ]);
          totalUsers = usersRes.data.length;
          totalTasks = tasksRes.data.length;
          pendingTasks = tasksRes.data.filter(t => t.status === "pending").length;
          pendingLeaves = leavesRes.data.length;
        } 
        else if (role === "hr") {
          const [usersRes, leavesRes] = await Promise.all([
            axios.get(`${BACKEND_URL}/api/auth/users`, config),
            axios.get(`${BACKEND_URL}/api/leave?status=pending`, config),
          ]);
          totalUsers = usersRes.data.length;
          pendingLeaves = leavesRes.data.length;
        }
        else if (role === "manager") {
          // Fetch team performance
          const perfRes = await axios.get(`${BACKEND_URL}/api/performance/team-performance/${userId}`, config);
          if (perfRes.data.success) {
            teamSize = perfRes.data.teamStats?.totalMembers || 0;
            totalTasks = perfRes.data.teamStats?.totalTasks || 0;
            pendingTasks = perfRes.data.teamStats?.tasksByStatus?.pending || 0;
          }
          // Fetch pending leaves for team
          const leavesRes = await axios.get(`${BACKEND_URL}/api/leave?status=pending`, config);
          pendingLeaves = leavesRes.data.length;
        }
        else if (role === "employee") {
          const [tasksRes, leavesRes] = await Promise.all([
            axios.get(`${BACKEND_URL}/api/auth/tasks`, config),
            axios.get(`${BACKEND_URL}/api/leave`, config),
          ]);
          myTasks = tasksRes.data.length;
          pendingTasks = tasksRes.data.filter(t => t.status === "pending").length;
          pendingLeaves = leavesRes.data.filter(l => l.status === "pending").length;
        }

        setStats({
          totalUsers,
          totalTasks,
          pendingTasks,
          pendingLeaves,
          teamSize,
          myTasks,
        });
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (role) fetchStats();
  }, [role, userId]);

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card skeleton">
            <div className="stat-icon skeleton-pulse"></div>
            <div className="stat-info">
              <div className="stat-value">---</div>
              <div className="stat-label">Loading...</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Admin cards
  if (role === "admin") {
    return (
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">TOTAL USERS</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-label">TOTAL TASKS</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingTasks}</div>
            <div className="stat-label">PENDING TASKS</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingLeaves}</div>
            <div className="stat-label">PENDING LEAVES</div>
          </div>
        </div>
      </div>
    );
  }

  // HR cards
  if (role === "hr") {
    return (
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">TOTAL EMPLOYEES</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingLeaves}</div>
            <div className="stat-label">PENDING LEAVES</div>
          </div>
        </div>
      </div>
    );
  }

  // Manager cards
  if (role === "manager") {
    return (
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.teamSize}</div>
            <div className="stat-label">TEAM MEMBERS</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-label">TOTAL TASKS</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingTasks}</div>
            <div className="stat-label">PENDING TASKS</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingLeaves}</div>
            <div className="stat-label">PENDING LEAVES</div>
          </div>
        </div>
      </div>
    );
  }

  // Employee cards
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">📌</div>
        <div className="stat-info">
          <div className="stat-value">{stats.myTasks}</div>
          <div className="stat-label">MY TASKS</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">⏳</div>
        <div className="stat-info">
          <div className="stat-value">{stats.pendingTasks}</div>
          <div className="stat-label">PENDING TASKS</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📅</div>
        <div className="stat-info">
          <div className="stat-value">{stats.pendingLeaves}</div>
          <div className="stat-label">PENDING LEAVES</div>
        </div>
      </div>
    </div>
  );
}