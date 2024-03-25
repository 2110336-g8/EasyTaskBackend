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

router.route('/tasksOf/:userId').get(tasksController.getTasksOf);

router.route('/:id').get(tasksController.getTaskbyId);

router.route('/adsOf/:customerId').get(tasksController.getAdvertisements);

// For employee
router.route('/:id/apply').post(tasksController.applyTask);
router.route('/:id/accpet-offer').post(tasksController.acceptOffer);
router.route('/:id/reject-offer').post(tasksController.rejectOffer);
router.route('/:id/submit').post(tasksController.submitTask);

// For employer
router.route('/:id/candidates').get(tasksController.getCandidate);
router.route('/:id/candidates').post(tasksController.selectCandidate);
router.route('/:id/start').post(tasksController.startTask);
router.route('/:id/dismiss').post(tasksController.dismissTask);
router.route('/:id/accept-work').post(tasksController.acceptWork);
router.route('/:id/revision').post(tasksController.requestRevision);

router
    .route('/:id/task-image')
    .get(tasksController.getTaskImage)
    .post(tasksController.uploadTaskImage)
    .delete(tasksController.deleteTaskImage);

export default router;
