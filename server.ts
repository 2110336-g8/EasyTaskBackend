import 'reflect-metadata';
import connectDB from './config/db';
import Container from 'typedi';
import ExpressApp from './config/express';
import dotenv from 'dotenv';
dotenv.config({ path: `${__dirname}/config/config.env` });
// Connect DB
connectDB();

// Start Express
Container.get(ExpressApp).start();

// Schedule
require('./config/schedule');
