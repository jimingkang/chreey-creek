const Router = require('koa-router');
const rssService = require('../services/rssService');
const db = require('../models');

const router = new Router({ prefix: '/feeds' });

// Add new feed
router.post('/', async (ctx) => {
  try {
    const { url } = ctx.request.body;
    const feed = await rssService.fetchAndStoreFeed(url);
    ctx.body = feed;
  } catch (error) {
    ctx.status = 400;
    ctx.body = { error: error.message };
  }
});

// Get all feeds
router.get('/', async (ctx) => {
  const feeds = await db.Feed.findAll({
    order: [['lastUpdated', 'DESC']]
  });
  ctx.body = feeds;
});

// Get single feed with items
router.get('/:id', async (ctx) => {
  const feed = await rssService.getFeedWithItems(ctx.params.id);
  if (!feed) {
    ctx.status = 404;
    ctx.body = { error: 'Feed not found' };
    return;
  }
  ctx.body = feed;
});

// Refresh feed
router.post('/:id/refresh', async (ctx) => {
  const feed = await db.Feed.findByPk(ctx.params.id);
  if (!feed) {
    ctx.status = 404;
    ctx.body = { error: 'Feed not found' };
    return;
  }
  
  try {
    const updatedFeed = await rssService.fetchAndStoreFeed(feed.url);
    ctx.body = updatedFeed;
  } catch (error) {
    ctx.status = 400;
    ctx.body = { error: error.message };
  }
});
// Get all feeds for the frontend
router.get('/feeds/titles', async (ctx) => {
  try {
    const feeds = await Feed.findAll({
      attributes: ['id', 'url', 'title'], // Only get necessary fields
      order: [['title', 'ASC']] // Sort alphabetically
    });
    ctx.body = feeds;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch feeds' };
  }
});

module.exports = router;