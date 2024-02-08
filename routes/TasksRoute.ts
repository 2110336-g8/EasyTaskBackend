import express from 'express';
import Container from 'typedi';
import TasksController from '../controllers/TasksController';

const tasksController: TasksController = Container.get(TasksController);

const router = express.Router();

router.route('/').post(tasksController.createTask);

router
    .route('/:id/task-image')
    .get(tasksController.getTaskImages)
    .post(tasksController.uploadTaskImage)
    .put(tasksController.changeImageSeq);

router
    .route('/:id/task-image/delete')
    .post(tasksController.deleteTaskImagesBySeqs)
    .delete(tasksController.deleteTaskAllImages);

export default router;
