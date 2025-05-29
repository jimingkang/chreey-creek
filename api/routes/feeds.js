const Router = require('koa-router');
const RSSParser = require('rss-parser');
const router = new Router({ prefix: '/feeds' });

const defaultFeeds = [
  'http://rss.cnn.com/rss/cnn_topstories.rss',
  'https://www.bbc.com/news/world/rss.xml',
  'https://techcrunch.com/feed/'
];

const rssParser = new RSSParser();

// Get single feed
router.get('/', async (ctx) => {
  try {
    const feedUrl = ctx.query.url || defaultFeeds[0];
    const feed = await rssParser.parseURL(feedUrl);
    ctx.body = feed;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch RSS feed' };
  }
});

// Get multiple feeds
router.get('/multiple', async (ctx) => {
  try {
    const feedUrls = ctx.query.urls ? ctx.query.urls.split(',') : defaultFeeds;
    
    const feedPromises = feedUrls.map(url => 
      rssParser.parseURL(url).catch(e => {
        console.error(`Error parsing ${url}:`, e);
        return null;
      })
    );
    
    const feeds = await Promise.all(feedPromises);
    ctx.body = feeds.filter(feed => feed !== null);
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch RSS feeds' };
  }
});

module.exports = router;