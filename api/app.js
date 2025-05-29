const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const path = require('path');
const db = require('./models');

const app = new Koa();

// Database connection
db.sequelize.sync()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database connection error:', err));

// Middleware
app.use(bodyParser());
app.use(serve(path.join(__dirname, 'public')));

// Routes
const feedsRouter = require('./routes/feeds');
const loadRouter = require('./routes/load');   // Original non-DB version

app.use(feedsRouter.routes());
app.use(feedsRouter.allowedMethods());

app.use(loadRouter.routes()); // Add this line
app.use(loadRouter.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});