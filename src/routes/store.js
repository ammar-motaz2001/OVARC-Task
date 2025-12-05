import express from 'express';
import storeController from '../controllers/storeController.js';
import { Store } from '../models/index.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const stores = await Store.findAll({
      attributes: ['id', 'name', 'address'],
      order: [['name', 'ASC']],
    });
    res.json({
      message: 'Stores retrieved successfully',
      count: stores.length,
      stores: stores,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/download-report', storeController.downloadReport);

export default router;

