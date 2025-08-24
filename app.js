const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/user.routes');
const connectToDB = require('./config/db');

dotenv.config();

connectToDB();

// CORS configuration - include your production frontend URL
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:5173',
    'https://learnovate-main.vercel.app'  // Your production frontend URL
  ], 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Other middleware AFTER CORS
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// Add a test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date() });
});

// Health check route for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

// Mount user routes
app.use('/user', userRouter);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', err);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});