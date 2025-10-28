const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
require('dotenv').config();

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/books');
const authorRoutes = require('./routes/authors');
const genreRoutes = require('./routes/genres');
const libraryRoutes = require('./routes/library');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');
const bookProposalRoutes = require('./routes/bookProposals');
const statsRoutes = require('./routes/stats');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const openApiPath = path.join(__dirname, 'docs', 'openapi.yaml');
let openApiDocument;
let openApiRaw;
try {
  openApiRaw = fs.readFileSync(openApiPath, 'utf8');
  openApiDocument = YAML.parse(openApiRaw);
} catch (error) {
  console.warn('⚠️  Unable to load OpenAPI specification:', error.message);
}

if (openApiDocument) {
  app.get('/openapi.yaml', (req, res) => {
    res.type('application/yaml').send(openApiRaw);
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      explorer: true,
      swaggerOptions: {
        url: '/openapi.yaml',
        persistAuthorization: true,
      },
    }),
  );
}

app.use(
  '/assets/books',
  express.static(path.join(__dirname, 'assets', 'books'), {
    fallthrough: true,
  }),
);
app.use(
  '/assets/profile',
  express.static(path.join(__dirname, 'assets', 'profile'), {
    fallthrough: true,
  }),
);

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/book-proposals', bookProposalRoutes);
app.use('/api/v1/authors', authorRoutes);
app.use('/api/v1/genres', genreRoutes);
app.use('/api/v1/library', libraryRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/stats', statsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    const useMocks = process.env.USE_MOCKS === 'true';
    if (!useMocks) {
      await connectDB();
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Database connected successfully');
      }
    } else if (process.env.NODE_ENV !== 'test') {
      console.log('⚠️  USE_MOCKS=true → skipping database connection (responses served from mock data)');
    }

    app.listen(PORT, () => {
      console.log(`🚀 BiblioConnect API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Unable to connect to database', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
