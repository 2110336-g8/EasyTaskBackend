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
router.route('/:id').get(tasksController.getTaskbyId);

router.route('/adsOf/:userId').get(tasksController.getAdvertisements);

router.route('/:id/apply').post(tasksController.applyTask);
router.route('/:id/cancel').post(tasksController.cancelTask);

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
