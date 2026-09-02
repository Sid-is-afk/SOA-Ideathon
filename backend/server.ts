import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import shipmentsRoutes from './routes/shipments';
import clustersRoutes from './routes/clusters';
import routesRoutes from './routes/routes';
import incidentsRoutes from './routes/incidents';
import recommendationsRoutes from './routes/recommendations';
import vehiclesRoutes from './routes/vehicles';
import hubsRoutes from './routes/hubs';
import chatRoutes from './routes/chat';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'], // Vite dev server default + port 3000
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/clusters', clustersRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/hubs', hubsRoutes);
app.use('/api/chat', chatRoutes);

// Error Handling (Must be last)
app.use(errorHandler);

// Server Boot
app.listen(PORT, () => {
  console.log(`🚀 Karwaan Backend is running on http://localhost:${PORT}`);
});
