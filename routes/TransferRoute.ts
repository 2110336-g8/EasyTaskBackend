import express from 'express';
import Container from 'typedi';
import TransferController from '../controllers/TransferController';

const transfersController: TransferController =
    Container.get(TransferController);
const router = express.Router();

//this api is not used in the website (just testing only)
router.route('/start').post(transfersController.startTaskTransfer);
router
    .route('/dismiss')
    .post(transfersController.dismissInprogressTaskTransfer);
router.route('/accept').get(transfersController.acceptTaskPayment);

export default router;
