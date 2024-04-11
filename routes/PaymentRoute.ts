import express from 'express';
import Container from 'typedi';
import PaymentsController from '../controllers/PaymentsController';


const paymentsController: PaymentsController = Container.get(PaymentsController);
const router = express.Router();


router.route('/topUp').post(paymentsController.topUpWallet);


export default router;
