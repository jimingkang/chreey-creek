import Parser from "rss-parser"
import { prisma } from "./prisma"
import { SentimentService } from "./sentiment-service"
import { StockService } from "./stock-service"

interface ParsedFeed {
  title: string
  description: string
  items: ParsedItem[]
}

interface ParsedItem {
  title: string
  link: string
  pubDate: Date
  author?: string
  content?: string
  contentSnippet?: string
  enclosure?: {
    url: string
    type: string
  }
}

export class RSSService {
  private parser: Parser
  private sentimentService: SentimentService
  private stockService: StockService

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ["description", "content:encoded", "contentSnippet", "media:content"],
      },
    })
    this.sentimentService = new SentimentService()
    this.stockService = new StockService()
  }

  async fetchFeed(url: string): Promise<ParsedFeed> {
    try {
      const feed = await this.parser.parseURL(url)

      return {
        title: feed.title || "Unknown Feed",
        description: feed.description || "",
        items: feed.items.map((item) => ({
          title: item.title || "Untitled",
          link: item.link || "",
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          author: item.creator || item.author || "",
          content: item["content:encoded"] || item.content || item.description || "",
          contentSnippet: item.contentSnippet || this.extractSnippet(item.description || ""),
          enclosure: item.enclosure
            ? {
                url: item.enclosure.url,
                type: item.enclosure.type,
              }
            : undefined,
        })),
      }
    } catch (error) {
      console.error(`Error fetching RSS feed ${url}:`, error)
      throw new Error(`Failed to fetch RSS feed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async addFeed(url: string, title?: string, category?: string) {
    try {
      // First, try to fetch the feed to validate it
      const parsedFeed = await this.fetchFeed(url)

      // Create the feed in database
      const feed = await prisma.feed.create({
        data: {
          title: title || parsedFeed.title,
          url,
          description: parsedFeed.description,
          category: category || "general",
          lastFetched: new Date(),
        },
      })

      // Process initial articles
      await this.processFeedArticles(feed.id, parsedFeed.items)

      return feed
    } catch (error) {
      console.error("Error adding feed:", error)
      throw error
    }
  }

  async refreshFeed(feedId: string) {
    try {
      const feed = await prisma.feed.findUnique({
        where: { id: feedId },
      })

      if (!feed) {
        throw new Error("Feed not found")
      }

      const parsedFeed = await this.fetchFeed(feed.url)
      const newArticles = await this.processFeedArticles(feedId, parsedFeed.items)

      // Update last fetched time
      await prisma.feed.update({
        where: { id: feedId },
        data: { lastFetched: new Date() },
      })

      return {
        feed,
        newArticlesCount: newArticles.length,
      }
    } catch (error) {
      console.error(`Error refreshing feed ${feedId}:`, error)
      throw error
    }
  }

  async refreshAllFeeds() {
    const feeds = await prisma.feed.findMany({
      where: { isActive: true },
    })

    const results = []

    for (const feed of feeds) {
      try {
        const result = await this.refreshFeed(feed.id)
        results.push({
          feedId: feed.id,
          feedTitle: feed.title,
          success: true,
          newArticles: result.newArticlesCount,
        })

        // Add delay to avoid overwhelming servers
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        results.push({
          feedId: feed.id,
          feedTitle: feed.title,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return results
  }

  private async processFeedArticles(feedId: string, items: ParsedItem[]) {
    const newArticles = []

    for (const item of items) {
      try {
        // Check if article already exists
        const existingArticle = await prisma.article.findUnique({
          where: { url: item.link },
        })

        if (!existingArticle) {
          // Create article
          const article = await prisma.article.create({
            data: {
              feedId,
              title: item.title,
              content: item.content,
              summary: item.contentSnippet,
              url: item.link,
              author: item.author,
              publishedAt: item.pubDate,
              imageUrl: item.enclosure?.type.startsWith("image/") ? item.enclosure.url : null,
            },
          })

          // Extract keywords
          await this.extractKeywords(article.id, item.title + " " + item.contentSnippet)

          // Perform sentiment analysis
          await this.sentimentService.analyzeArticle(article.id, item.title + " " + item.content)

          // Detect stock mentions
          await this.stockService.detectStockMentions(article.id, item.title + " " + item.content)

          newArticles.push(article)
        }
      } catch (error) {
        console.error("Error processing article:", error)
      }
    }

    return newArticles
  }

  private async extractKeywords(articleId: string, text: string) {
    const keywords = this.extractKeywordsFromText(text)

    for (const [word, frequency] of Object.entries(keywords)) {
      await prisma.keyword
        .create({
          data: {
            articleId,
            word,
            frequency,
          },
        })
        .catch(() => {
          // Ignore duplicate key errors
        })
    }
  }

  private extractKeywordsFromText(text: string): Record<string, number> {
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
    ])

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))

    const wordCount: Record<string, number> = {}
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    // Return top 10 keywords
    return Object.fromEntries(
      Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
    )
  }

  private extractSnippet(text: string, maxLength = 200): string {
    if (!text) return ""

    // Remove HTML tags
    const cleanText = text.replace(/<[^>]*>/g, "")

    if (cleanText.length <= maxLength) {
      return cleanText
    }

    return cleanText.substring(0, maxLength).trim() + "..."
  }
}
