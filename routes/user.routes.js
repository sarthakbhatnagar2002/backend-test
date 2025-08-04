const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// GET Register Page
router.get('/register', (req, res) => {
    res.render('register');
});

// POST Register User
router.post('/register',
    body('email').trim().isEmail().isLength({ min: 13 }),
    body('password').trim().isLength({ min: 5 }),
    body('username').trim().isLength({ min: 3 }),
    async (req, res) => {
        const error = validationResult(req);

        if (!error.isEmpty()) {
            return res.status(400).json({
                errors: error.array(),
                message: 'Invalid data'
            });
        }

        const { email, username, password } = req.body;
        const hashpassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            email,
            username,
            password: hashpassword
        });

        // res.redirect('/user/login');
        res.render('home', { username: user.username });
    }
);

router.get('/login', (req, res) => {
    res.render('login', { errorMessage: null });
});

// POST Login User
router.post(
    '/login',
    body('username').trim().isLength({ min: 3 }).withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('login', { errorMessage: errors.array()[0].msg });
        }

        const { username, password } = req.body;
        const user = await userModel.findOne({ username });

        if (!user) {
            return res.render('login', { errorMessage: 'Username or password is incorrect' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { errorMessage: 'Username or password is incorrect' });
        }

        const token = jwt.sign(
            {
                userID: user._id,
                email: user.email,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, { httpOnly: true });
        res.redirect('/home');
    }
);
// Verify token route
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
