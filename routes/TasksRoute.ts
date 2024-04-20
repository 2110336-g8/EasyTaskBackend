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

/** GET Methods */
/**
 * @openapi
 * '/v1/tasks/{id}':
 * get:
 * tags:
 * - Task
 * summary: get task by id
 * description: get a task doc by task id
 * operationId: getTaskById
 * parameters:
 * - name: id
 *      in: path
 *      description: pass a task id for looking up task
 *      required: true
 *      style: simple
 *      explode: false
 *      schema:
 *          type: string
 *          format: uuid
 * - name: userId
 *      in: query
 *      description: a user id for authorization
 *      required: true
 *      style: form
 *      explode: true
 *      schema:
 *          type: string
 *          format: uuid
 * responses:
 * "200":
 *      description: task is found and allowed to view this task
 *      content:
 *      application/json:
 *          schema:
 *          $ref: '#/components/schemas/inline_response_200'
 * "404":
 *      description: task or user not found
 */
router.route('/:id').get(tasksController.getTaskbyId);

router.route('/adsOf/:customerId').get(tasksController.getAdvertisements);

// For employee
router.route('/:id/apply').post(tasksController.applyTask);
router.route('/:id/accept-offer').post(tasksController.acceptOffer);
router.route('/:id/reject-offer').post(tasksController.rejectOffer);
router.route('/:id/submit').post(tasksController.submitTask);

// For employer
router.route('/:id/candidates').get(tasksController.getCandidate);
router.route('/:id/candidates').post(tasksController.selectCandidate);
router.route('/:id/start').post(tasksController.startTask);
router.route('/:id/dismiss').post(tasksController.dismissTask);
router.route('/:id/accept-task').post(tasksController.acceptTask);
router.route('/:id/revision').post(tasksController.requestRevision);

router
    .route('/:id/task-image')
    .get(tasksController.getTaskImage)
    .post(tasksController.uploadTaskImage)
    .delete(tasksController.deleteTaskImage);

export default router;
