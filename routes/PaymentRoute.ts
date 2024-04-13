import express from 'express';
import Container from 'typedi';
import PaymentsController from '../controllers/PaymentsController';


const paymentsController: PaymentsController = Container.get(PaymentsController);
const router = express.Router();


router.route('/topup').post(paymentsController.topUpWallet);
router.route('/topup-status').post(paymentsController.checkTopupSessionStatus);

router.route('/wallet').get(paymentsController.getWalletAmount);

export default router;
