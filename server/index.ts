import express from 'express';
import cors from 'cors';
import { createRoutes } from './routes';
import { MemStorage } from './storage';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize storage
const storage = new MemStorage();

// Routes
app.use('/api', createRoutes(storage));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});