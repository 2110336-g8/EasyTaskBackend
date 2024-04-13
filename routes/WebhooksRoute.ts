import express from 'express';
import Container from 'typedi';
import PaymentsController from '../controllers/PaymentsController';

const paymentsController: PaymentsController = Container.get(PaymentsController);
const router = express.Router();

router
    .route('/stripe')
    .post(
        paymentsController.stripeWebhook,
        express.raw({ type: 'application/json' }),
    );

export default router;
