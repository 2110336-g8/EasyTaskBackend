import express from 'express';
import {createTask} from '../controllers/TasksController';

const taskRouter = express.Router();

taskRouter.route('/').post(createTask);

export default taskRouter;