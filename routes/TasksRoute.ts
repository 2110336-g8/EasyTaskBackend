import express from 'express';
import Container from 'typedi';
import TasksController from '../controllers/TasksController';
import multer from 'multer';

const tasksController: TasksController = Container.get(TasksController);

const router = express.Router();
const upload = multer();

router.route('/').post(tasksController.createTask);

router.route('/page').post(tasksController.getTasksPage);
router.route('/categories').get(tasksController.getCategories);

router.route('/taskOf/:id').get(tasksController.getTaskExperience);

router.route('/:id').get(tasksController.getTaskbyId);

router.route('/adsOf/:customerId').get(tasksController.getAdvertisements);

router.route('/:id/apply').post(tasksController.applyTask);
router.route('/:id/cancel').post(tasksController.cancelTask);

router
    .route('/:id/task-image')
    .get(tasksController.getTaskImage)
    .post(tasksController.uploadTaskImage)
    .delete(tasksController.deleteTaskImage);

export default router;
