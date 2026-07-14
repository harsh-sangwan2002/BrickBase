import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigins, env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { apiRateLimit } from './middleware/rateLimit.middleware';

import authRoutes from './routes/auth.routes';
import propertiesRoutes from './routes/properties.routes';
import enquiriesRoutes from './routes/enquiries.routes';
import favoritesRoutes from './routes/favorites.routes';
import adminRoutes from './routes/admin.routes';
import metaRoutes from './routes/meta.routes';
import conversationsRoutes from './routes/conversations.routes';
import savedSearchesRoutes from './routes/savedSearches.routes';
import aiChatRoutes from './routes/aiChat.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
  app.use('/api/v1', apiRateLimit);

  app.get('/health', (_req, res) => res.json({ data: { status: 'ok' }, error: null }));

  app.use('/api/v1', authRoutes);
  app.use('/api/v1', propertiesRoutes);
  app.use('/api/v1', enquiriesRoutes);
  app.use('/api/v1', favoritesRoutes);
  app.use('/api/v1', adminRoutes);
  app.use('/api/v1', metaRoutes);
  app.use('/api/v1', conversationsRoutes);
  app.use('/api/v1', savedSearchesRoutes);
  app.use('/api/v1', aiChatRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
