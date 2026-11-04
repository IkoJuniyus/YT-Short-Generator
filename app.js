const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./utils/logger');
const { ensureDir } = require('./utils/fileHelper');
const apiRoutes = require('./routes');

const app = express();

Object.values(config.folders).forEach(ensureDir);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan('short', { stream: { write: (msg) => logger.debug(msg.trim()) } }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.render('index'));

app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, _next) => {
  logger.error(err.message);
  res.status(500).json({ error: err.message });
});

function start() {
  app.listen(config.server.port, () => {
    logger.info(`YT Short Generator berjalan di ${config.server.baseUrl}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
