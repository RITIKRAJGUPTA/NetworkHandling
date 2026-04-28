import express from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.id;
    req.userRole = verified.role;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Get team performance data for a manager
router.get("/team-performance/:managerId", authMiddleware, async (req, res) => {
  try {
    const { managerId } = req.params;
    
    // Verify that the requesting user is the manager or an admin
    if (req.userId !== managerId && req.userRole !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You can only view your own team's performance" 
      });
    }
    
    console.log("Fetching performance for manager:", managerId);
    
    // METHOD 1: Try to find through hierarchy (Team Leads -> Employees)
    // Find all Team Leads under this manager
    let teamLeads = await User.find({
      role: "employee",
      designation: "team lead",
      teamLead: managerId
    });
    
    let teamLeadIds = teamLeads.map(lead => lead._id);
    
    // Find regular employees under these Team Leads
    let regularEmployees = await User.find({
      role: "employee",
      designation: { $in: ["L1", "L2", "FE"] },
      teamLead: { $in: teamLeadIds.length > 0 ? teamLeadIds : [] }
    });
    
    // METHOD 2: If no hierarchy found, fetch all employees (fallback for existing data)
    if (teamLeads.length === 0 && regularEmployees.length === 0) {
      console.log("No hierarchy found, fetching all employees as fallback");
      
      // Fetch all employees (anyone with role "employee")
      const allEmployees = await User.find({
        role: "employee"
      });
      
      // Separate team leads and regular employees
      teamLeads = allEmployees.filter(emp => emp.designation === "team lead");
      regularEmployees = allEmployees.filter(emp => 
        emp.designation === "L1" || emp.designation === "L2" || emp.designation === "FE"
      );
      
      console.log(`Fallback: Found ${teamLeads.length} team leads and ${regularEmployees.length} regular employees`);
    }
    
    // Combine all team members
    const allTeamMembers = [...teamLeads, ...regularEmployees];
    const allTeamMemberIds = allTeamMembers.map(member => member._id);
    
    console.log(`Total team members: ${allTeamMembers.length}`);
    console.log("Team members:", allTeamMembers.map(m => ({ name: m.name, designation: m.designation })));
    
    if (allTeamMembers.length === 0) {
      return res.json({
        success: true,
        message: "No team members found under this manager",
        teamStats: {
          totalMembers: 0,
          totalTeamLeads: 0,
          totalEmployees: 0,
          totalTasks: 0,
          completedTasks: 0,
          teamCompletionRate: 0,
          tasksByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
          tasksByStatus: { pending: 0, inProgress: 0, completed: 0, overdue: 0 },
          monthlyCompletion: {}
        },
        employeePerformance: [],
        teamHierarchy: []
      });
    }
    
    // Get all tasks assigned to team members
    const tasks = await Task.find({
      assignedTo: { $in: allTeamMemberIds }
    }).populate("assignedTo", "name email designation teamLead")
      .populate("assignedBy", "name");
    
    console.log(`Found ${tasks.length} tasks for team members`);
    
    // Calculate performance metrics for each employee
    const employeePerformance = [];
    
    for (const member of allTeamMembers) {
      const memberTasks = tasks.filter(task => 
        task.assignedTo && task.assignedTo._id.toString() === member._id.toString()
      );
      
      const completedTasks = memberTasks.filter(task => task.status === "completed");
      const pendingTasks = memberTasks.filter(task => task.status === "pending");
      const inProgressTasks = memberTasks.filter(task => task.status === "in-progress");
      const overdueTasks = memberTasks.filter(task => 
        task.status !== "completed" && new Date(task.dueDate) < new Date()
      );
      
      const completionRate = memberTasks.length > 0 
        ? (completedTasks.length / memberTasks.length) * 100 
        : 0;
      
      let avgCompletionTime = 0;
      const completedWithDates = completedTasks.filter(task => task.completedAt);
      if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, task) => {
          const daysToComplete = Math.ceil(
            (new Date(task.completedAt) - new Date(task.createdAt)) / (1000 * 60 * 60 * 24)
          );
          return sum + daysToComplete;
        }, 0);
        avgCompletionTime = totalDays / completedWithDates.length;
      }
      
      // Find which team lead this employee reports to
      let reportsTo = null;
      if (member.designation !== "team lead") {
        const teamLead = teamLeads.find(lead => lead._id.toString() === member.teamLead?.toString());
        reportsTo = teamLead ? { id: teamLead._id, name: teamLead.name } : null;
      }
      
      employeePerformance.push({
        employeeId: member._id,
        employeeName: member.name,
        employeeEmail: member.email,
        designation: member.designation,
        isTeamLead: member.designation === "team lead",
        reportsTo: reportsTo,
        teamLeadId: member.teamLead,
        totalTasks: memberTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        inProgressTasks: inProgressTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate: Math.round(completionRate),
        avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
        tasks: memberTasks.map(task => ({
          _id: task._id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          completedAt: task.completedAt,
          createdAt: task.createdAt,
          assignedBy: task.assignedBy?.name || "Unknown"
        }))
      });
    }
    
    // Calculate team overall metrics
    const allTasks = tasks;
    const teamCompletedTasks = allTasks.filter(t => t.status === "completed");
    const teamCompletionRate = allTasks.length > 0 
      ? (teamCompletedTasks.length / allTasks.length) * 100 
      : 0;
    
    const tasksByPriority = {
      low: allTasks.filter(t => t.priority === "low").length,
      medium: allTasks.filter(t => t.priority === "medium").length,
      high: allTasks.filter(t => t.priority === "high").length,
      urgent: allTasks.filter(t => t.priority === "urgent").length
    };
    
    const tasksByStatus = {
      pending: allTasks.filter(t => t.status === "pending").length,
      inProgress: allTasks.filter(t => t.status === "in-progress").length,
      completed: allTasks.filter(t => t.status === "completed").length,
      overdue: allTasks.filter(t => t.status === "overdue" || (t.status !== "completed" && new Date(t.dueDate) < new Date())).length
    };
    
    // Monthly completion data
    const monthlyCompletion = {};
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      last6Months.push({
        month: monthYear,
        monthIndex: date.getMonth(),
        year: date.getFullYear()
      });
    }
    
    last6Months.forEach(monthData => {
      const monthTasks = teamCompletedTasks.filter(task => {
        const completionDate = new Date(task.completedAt || task.updatedAt);
        return completionDate.getMonth() === monthData.monthIndex && 
               completionDate.getFullYear() === monthData.year;
      });
      monthlyCompletion[monthData.month] = monthTasks.length;
    });
    
    // Build team hierarchy
    const teamHierarchy = teamLeads.map(lead => ({
      id: lead._id,
      name: lead.name,
      email: lead.email,
      members: regularEmployees
        .filter(emp => emp.teamLead && emp.teamLead.toString() === lead._id.toString())
        .map(emp => ({
          id: emp._id,
          name: emp.name,
          designation: emp.designation,
          email: emp.email
        }))
    }));
    
    res.json({
      success: true,
      teamStats: {
        totalMembers: allTeamMembers.length,
        totalTeamLeads: teamLeads.length,
        totalEmployees: regularEmployees.length,
        totalTasks: allTasks.length,
        completedTasks: teamCompletedTasks.length,
        teamCompletionRate: Math.round(teamCompletionRate),
        tasksByPriority,
        tasksByStatus,
        monthlyCompletion
      },
      employeePerformance,
      teamHierarchy
    });
    
  } catch (error) {
    console.error("Error fetching team performance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug endpoint to check database state
router.get("/debug/:managerId", authMiddleware, async (req, res) => {
  try {
    const { managerId } = req.params;
    
    // Get the manager
    const manager = await User.findById(managerId);
    
    // Get all employees
    const allEmployees = await User.find({ role: "employee" });
    
    // Separate by designation
    const teamLeads = allEmployees.filter(e => e.designation === "team lead");
    const l1Employees = allEmployees.filter(e => e.designation === "L1");
    const l2Employees = allEmployees.filter(e => e.designation === "L2");
    const feEmployees = allEmployees.filter(e => e.designation === "FE");
    
    // Get all tasks
    const allTasks = await Task.find().populate("assignedTo", "name designation");
    
    res.json({
      manager: {
        id: manager?._id,
        name: manager?.name,
        role: manager?.role
      },
      employees: {
        total: allEmployees.length,
        teamLeads: teamLeads.map(t => ({ id: t._id, name: t.name, teamLead: t.teamLead })),
        l1: l1Employees.map(t => ({ id: t._id, name: t.name, teamLead: t.teamLead })),
        l2: l2Employees.map(t => ({ id: t._id, name: t.name, teamLead: t.teamLead })),
        fe: feEmployees.map(t => ({ id: t._id, name: t.name, teamLead: t.teamLead }))
      },
      tasks: {
        total: allTasks.length,
        list: allTasks.map(t => ({
          title: t.title,
          assignedTo: t.assignedTo?.name,
          status: t.status
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;