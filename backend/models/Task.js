import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: "" 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium" 
  },
  status: { 
    type: String, 
    enum: ["pending", "in-progress", "completed", "overdue"], 
    default: "pending" 
  },
  dueDate: { 
    type: Date, 
    required: true 
  },
  completedAt: { 
    type: Date, 
    default: null 
  },
  comments: [{
    text: { 
      type: String, 
      required: true 
    },
    commentedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    commentedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Fix the pre-save middleware - remove the 'next' parameter or use function properly
taskSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Alternative correct syntax (if you want to use next):
// taskSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

const Task = mongoose.model("Task", taskSchema);

export default Task;