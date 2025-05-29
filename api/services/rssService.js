const RSSParser = require('rss-parser');
const db = require('../models');
const { Feed, FeedItem } = db;

const rssParser = new RSSParser();

async function fetchAndStoreFeed(feedUrl) {
  try {
    // Check if feed exists
    let feed = await Feed.findOne({ where: { url: feedUrl } });
    const parsedFeed = await rssParser.parseURL(feedUrl);

    // Create or update feed
    if (!feed) {
      feed = await Feed.create({
        url: feedUrl,
        title: parsedFeed.title,
        description: parsedFeed.description,
        lastUpdated: new Date()
      });
    } else {
      await feed.update({
        title: parsedFeed.title,
        description: parsedFeed.description,
        lastUpdated: new Date()
      });
    }

    // Process feed items
    for (const item of parsedFeed.items) {
      await FeedItem.findOrCreate({
        where: { guid: item.guid || item.link },
        defaults: {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          content: item.content,
          contentSnippet: item.contentSnippet,
          feedId: feed.id
        }
      });
    }

    return feed;
  } catch (error) {
    console.error('Error processing feed:', error);
    throw error;
  }
}

async function getFeedWithItems(feedId) {
  return Feed.findByPk(feedId, {
    include: [{
      model: FeedItem,
      as: 'items',
      order: [['pubDate', 'DESC']],
      limit: 20
    }]
  });
}

module.exports = {
  fetchAndStoreFeed,
  getFeedWithItems
};