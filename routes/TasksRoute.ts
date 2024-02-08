import express from 'express';
import Container from 'typedi';
import TasksController from '../controllers/TasksController';

const tasksController: TasksController = Container.get(TasksController);

const router = express.Router();

router.route('/').post(tasksController.createTask);

export default router;
