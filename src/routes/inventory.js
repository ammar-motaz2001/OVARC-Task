import express from 'express';
import { body } from 'express-validator';
import upload, { handleMulterError } from '../middleware/upload.js';
import inventoryController from '../controllers/inventoryController.js';

const router = express.Router();

router.post(
  '/upload',
  upload.single('csv'),
  handleMulterError,
  [
    body('csv')
      .custom((value, { req }) => {
        if (!req.file) {
          throw new Error('CSV file is required. Make sure the field name is "csv" and type is "File" in Postman.');
        }
        return true;
      }),
  ],
  inventoryController.uploadCSV
);

export default router;

