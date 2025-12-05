import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/database.js';
import inventoryRoutes from './routes/inventory.js';
import storeRoutes from './routes/store.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/inventory', inventoryRoutes);
app.use('/api/store', storeRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    await sequelize.sync({ alter: true });
    app.listen(PORT);
  } catch (error) {
    process.exit(1);
  }
}

startServer();

export default app;

