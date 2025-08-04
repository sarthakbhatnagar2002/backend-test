const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user.model');
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
    });

    return res.json({
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

module.exports = router;
