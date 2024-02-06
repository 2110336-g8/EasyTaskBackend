import express from 'express';
import Container from 'typedi';
import TasksController from '../controllers/TasksController';

const tasksController: TasksController = Container.get(TasksController);

const router = express.Router();

<<<<<<< HEAD
router.route('/').post(tasksController.createTask).get(tasksController.getTasks);
=======
<<<<<<< HEAD
router.route('/').post(tasksController.createTask);
>>>>>>> b405931 (add getTask Method 🐥)

router
    .route('/:id/task-image')
    .get(tasksController.getTaskImages)
    .post(tasksController.uploadTaskImage)
    .put(tasksController.changeImageSeq);

router
    .route('/:id/task-image/delete')
    .post(tasksController.deleteTaskImagesBySeqs)
    .delete(tasksController.deleteTaskAllImages);
=======
router.route('/').post(taskService.createTask).get(taskService.getTasks);
>>>>>>> 78d09ec (add getTask Method 🐥)

export default router;
