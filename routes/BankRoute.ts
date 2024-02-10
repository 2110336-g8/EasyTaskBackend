import express from 'express';
import Container from 'typedi';
import { BanksController } from '../controllers/BanksController';

const router = express.Router();
const bankController = Container.get(BanksController);

router.route('/').get(bankController.getBanks);
router.route('/:id').get(bankController.getBank);

export default router;
