// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { connectMongoDB } from './config/mongodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server and connect to databases
async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('MongoDB connected successfully');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`ETL Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();