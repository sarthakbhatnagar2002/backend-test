const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  school: {
    type: String,
    trim: true,
    default: ''
  },
  bio: {
    type: String,
    trim: true,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  interests: {
    type: [String],
    default: []
  },
  completedCourses: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  purchasedCourses: [{
    courseId: String,
    title: String,
    instructor: String,
    progress: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress'
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    rating: Number,
    price: {
      type: String,
      default: 'Free'
    },
    totalModules: {
      type: Number,
      default: 0
    },
    completedModules: {
      type: Number,
      default: 0
    },
    lastWatched: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add index for faster queries
profileSchema.index({ userId: 1 });
profileSchema.index({ 'purchasedCourses.courseId': 1 });

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;