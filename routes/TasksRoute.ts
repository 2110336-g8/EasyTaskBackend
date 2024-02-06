import express from 'express';
import Container from 'typedi';
import TaskController from '../controllers/TasksController';

const taskService = Container.get(TaskController);

const router = express.Router();

router.route('/').post(taskService.createTask).get(taskService.getTasks);

export default router;
