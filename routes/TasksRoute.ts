import express from 'express';
import Container from 'typedi';
import TasksController from '../controllers/TasksController';
import multer from 'multer';

const tasksController: TasksController = Container.get(TasksController);

const router = express.Router();
const upload = multer();

router.route('/').post(tasksController.createTask).get(tasksController.getTasks);

router
    .route('/:id/task-image')
    .get(tasksController.getTaskImages)
    .post(upload.single('file'), tasksController.uploadTaskImage)
    .put(tasksController.changeImageSeq);

router
    .route('/:id/task-image/delete')
    .post(tasksController.deleteTaskImagesBySeqs)
    .delete(tasksController.deleteTaskAllImages);

export default router;
