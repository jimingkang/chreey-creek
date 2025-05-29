const Router = require('koa-router');
const rssService = require('../services/rssService'); // 导入 rssService
const router = new Router({ prefix: '/load' });

const defaultFeeds = [
  'http://rss.cnn.com/rss/cnn_topstories.rss',
  'https://www.bbc.com/news/world/rss.xml',
  'https://techcrunch.com/feed/'
];

// Get single feed
router.get('/', async (ctx) => {
  try {
    const feedUrl = ctx.query.url || defaultFeeds[0];
    
    // 使用 rssService 获取并存储 feed
    const feed = await rssService.fetchAndStoreFeed(feedUrl);
    
    // 获取带有条目的 feed 数据
    const feedWithItems = await rssService.getFeedWithItems(feed.id);
    
    ctx.body = feedWithItems;
  } catch (error) {
    console.error('Error processing feed:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch and store RSS feed' };
  }
});

// Get multiple feeds
router.get('/multiple', async (ctx) => {
  try {
    const feedUrls = ctx.query.urls ? ctx.query.urls.split(',') : defaultFeeds;
    
    const feedPromises = feedUrls.map(url => 
      rssService.fetchAndStoreFeed(url).catch(e => {
        console.error(`Error processing ${url}:`, e);
        return null;
      })
    );
    
    const feeds = await Promise.all(feedPromises);
    
    // 获取每个 feed 的详细信息（带条目）
    const feedsWithItems = await Promise.all(
      feeds.filter(feed => feed !== null)
        .map(feed => rssService.getFeedWithItems(feed.id))
    );
    
    ctx.body = feedsWithItems.filter(feed => feed !== null);
  } catch (error) {
    console.error('Error processing feeds:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch and store RSS feeds' };
  }
});

module.exports = router;