const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const path = require('path');

const app = new Koa();
const router = new Router();

// Middleware
app.use(bodyParser());
app.use(serve(path.join(__dirname, 'public')));

// Routes
const feedsRoutes = require('./routes/feeds');
router.use('/api', feedsRoutes.routes());

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});