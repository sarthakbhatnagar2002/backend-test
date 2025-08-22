const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user.model');
const Profile = require('../models/profile.model'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post(
  '/register',
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .isLength({ min: 5 })
    .withMessage('Email must be at least 5 characters long'),
  body('password')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 characters long'),
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Invalid data',
      });
    }
    const { email, username, password } = req.body;
    const hashpassword = await bcrypt.hash(password, 10);
    try {
      const newUser = await userModel.create({
        email,
        username,
        password: hashpassword,
      });
      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({
          message: 'Email or username already exists',
        });
      }
      return res.status(500).json({
        message: 'Server error',
      });
    }
  }
);

router.post(
  '/login',
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { username, password } = req.body;
    const user = await userModel.findOne({ username });
    if (!user) {
      return res.status(400).json({
        message: 'Username or password is incorrect',
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Username or password is incorrect',
      });
    }
    const token = jwt.sign(
      {
        userID: user._id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000
    });
    return res.status(200).json({
      message: 'Login successful',
      user: {
        username: user.username,
        email: user.email,
      },
    });
  }
);

router.get('/verify', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ user: decoded });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

router.post('/logout', (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    });
    
    return res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      message: 'Logout failed'
    });
  }
});

// GET /user/profile - Fetch user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Decode token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userID;
    
    // Find user to get basic info
    const user = await userModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find existing profile
    let profile = await Profile.findOne({ userId });
    
    // Prepare profile response
    const profileResponse = {
      userId,
      username: user.username,
      email: user.email,
      joinDate: user.createdAt || new Date(),
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      school: profile?.school || '',
      bio: profile?.bio || '',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      completedCourses: profile?.completedCourses || 0,
      totalHours: profile?.totalHours || 0,
      purchasedCourses: profile?.purchasedCourses || []
    };
    
    res.json({ profile: profileResponse });
  } catch (error) {
    console.error('Error fetching profile:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /user/profile - Create or update user profile
router.post('/profile', async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userID;
    
    // Get user info
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const {
      fullName,
      phone,
      address,
      school,
      bio,
      skills,
      interests
    } = req.body;
    
    // Validate and sanitize data
    const profileData = {
      userId,
      fullName: fullName?.trim() || '',
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      school: school?.trim() || '',
      bio: bio?.trim() || '',
      skills: Array.isArray(skills) ? skills.filter(skill => skill && skill.trim()) : [],
      interests: Array.isArray(interests) ? interests.filter(interest => interest && interest.trim()) : []
    };
    
    // Update or create profile
    let profile = await Profile.findOneAndUpdate(
      { userId },
      profileData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    // Prepare response with user info
    const profileResponse = {
      userId,
      username: user.username,
      email: user.email,
      joinDate: user.createdAt || profile.createdAt,
      fullName: profile.fullName,
      phone: profile.phone,
      address: profile.address,
      school: profile.school,
      bio: profile.bio,
      skills: profile.skills,
      interests: profile.interests,
      completedCourses: profile.completedCourses,
      totalHours: profile.totalHours,
      purchasedCourses: profile.purchasedCourses
    };
    
    res.json({ 
      message: 'Profile saved successfully',
      profile: profileResponse
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// POST /user/profile/course - Add purchased course
router.post('/profile/course', async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userID;
    
    const courseData = req.body;
    
    // Ensure profile exists
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
      await profile.save();
    }
    
    // Add course
    await Profile.findOneAndUpdate(
      { userId },
      { 
        $push: { purchasedCourses: courseData },
        $inc: { 
          completedCourses: courseData.status === 'completed' ? 1 : 0,
          totalHours: courseData.hours || 0
        }
      }
    );
    
    res.json({ message: 'Course added successfully' });
  } catch (error) {
    console.error('Error adding course:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to add course' });
  }
});
// Add these new routes to your existing user routes file

// POST /user/enroll-course - Free enrollment (replaces purchase-course)
router.post('/enroll-course', async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userID;
    
    const { courseId, title, instructor, rating, totalModules } = req.body;
    
    // Get user info
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure profile exists
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
      await profile.save();
    }
    
    // Check if already enrolled
    const existingCourse = profile.purchasedCourses.find(
      course => course.courseId === courseId
    );
    
    if (existingCourse) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    
    // Add course to profile
    const newCourse = {
      courseId,
      title,
      instructor,
      progress: 0,
      status: 'in-progress',
      purchaseDate: new Date(),
      rating: rating || 0,
      price: 'Free',
      totalModules: totalModules || 0,
      completedModules: 0
    };
    
    await Profile.findOneAndUpdate(
      { userId },
      { 
        $push: { purchasedCourses: newCourse }
      },
      { new: true }
    );
    
    res.json({ 
      message: 'Successfully enrolled in course!',
      course: newCourse
    });
    
  } catch (error) {
    console.error('Error enrolling in course:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

// POST /user/update-progress - Update course progress
router.post('/update-progress', async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userID;
    
    const { courseId, progress, hoursSpent, completedModules } = req.body;
    
    // Find profile and update course progress
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const courseIndex = profile.purchasedCourses.findIndex(
      course => course.courseId === courseId
    );
    
    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found in profile' });
    }
    
    // Update course progress
    profile.purchasedCourses[courseIndex].progress = progress;
    
    // Update status if completed
    if (progress >= 100) {
      const wasNotCompleted = profile.purchasedCourses[courseIndex].status !== 'completed';
      profile.purchasedCourses[courseIndex].status = 'completed';
      
      // Increment completed courses count only if it wasn't completed before
      if (wasNotCompleted) {
        profile.completedCourses += 1;
      }
    }
    
    // Update total hours if provided
    if (hoursSpent) {
      profile.totalHours += hoursSpent;
    }
    
    // Update completed modules if provided
    if (completedModules !== undefined) {
      profile.purchasedCourses[courseIndex].completedModules = completedModules;
    }
    
    await profile.save();
    
    res.json({ 
      message: 'Progress updated successfully',
      progress: profile.purchasedCourses[courseIndex].progress,
      status: profile.purchasedCourses[courseIndex].status
    });
    
  } catch (error) {
    console.error('Error updating progress:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// GET /user/course-status/:courseId - Check enrollment status for a specific course
router.get('/course-status/:courseId', async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userID;
    const { courseId } = req.params;
    
    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      return res.json({ 
        enrolled: false, 
        progress: 0, 
        status: 'not-enrolled' 
      });
    }
    
    const course = profile.purchasedCourses.find(
      c => c.courseId === courseId
    );
    
    if (!course) {
      return res.json({ 
        enrolled: false, 
        progress: 0, 
        status: 'not-enrolled' 
      });
    }
    
    res.json({
      enrolled: true,
      progress: course.progress,
      status: course.status,
      enrollmentDate: course.purchaseDate,
      completedModules: course.completedModules || 0
    });
    
  } catch (error) {
    console.error('Error checking course status:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to check course status' });
  }
});

module.exports = router;