const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/user.routes');
const connectToDB = require('./config/db');

dotenv.config();

connectToDB();

// IMPORTANT: CORS must be the FIRST middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'], 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Handle preflight requests
app.options('*', cors());

// Other middleware AFTER CORS
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// Add a test route to verify CORS is working
app.get('/test', (req, res) => {
  res.json({ message: 'CORS is working!', timestamp: new Date() });
});

app.use('/user', userRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});