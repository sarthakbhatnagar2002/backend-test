const express = require('express');
const app = express();
app.set('view engine', 'ejs');
const userRouter = require('./routes/user.routes');
const dotenv = require('dotenv');
dotenv.config();

const connectToDB = require('./config/db');
const cookieParser = require('cookie-parser');
connectToDB();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/user', userRouter);

app.listen(5000);
