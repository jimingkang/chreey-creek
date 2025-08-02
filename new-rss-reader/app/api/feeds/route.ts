import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { RSSService } from "@/lib/rss-service"
import { initializeDatabase } from "@/lib/database-check"

const rssService = new RSSService()

export async function GET() {
  try {
    // 检查数据库是否已初始化
    await initializeDatabase()

    const feeds = await prisma.feed.findMany({
      where: { isActive: true },
      include: {
        articles: {
          take: 5,
          orderBy: { publishedAt: "desc" },
          include: {
            sentiment: true,
            keywords: true,
            stockMentions: {
              include: {
                stock: true,
              },
            },
          },
        },
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedFeeds = feeds.map((feed) => ({
      id: feed.id,
      title: feed.title,
      url: feed.url,
      description: feed.description,
      category: feed.category,
      lastFetched: feed.lastFetched,
      articleCount: feed._count.articles,
      recentArticles: feed.articles.map((article) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        url: article.url,
        author: article.author,
        publishedAt: article.publishedAt,
        imageUrl: article.imageUrl,
        sentiment: article.sentiment
          ? {
              overall: article.sentiment.overallSentiment,
              score: article.sentiment.positiveScore - article.sentiment.negativeScore,
              confidence: article.sentiment.confidenceScore,
            }
          : null,
        keywords: article.keywords.map((k) => k.word),
        stockMentions: article.stockMentions.map((m) => ({
          symbol: m.stock.symbol,
          name: m.stock.name,
          relevance: m.relevanceScore,
        })),
      })),
    }))

    return NextResponse.json({
      success: true,
      feeds: formattedFeeds,
    })
  } catch (error) {
    console.error("Error fetching feeds:", error)

    // 如果是数据库表不存在的错误，返回特殊提示
    if (error instanceof Error && error.message.includes("does not exist")) {
      return NextResponse.json(
        {
          success: false,
          error: "数据库未初始化，请运行 npm run db:push 创建数据库表",
          needsSetup: true,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to fetch feeds" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const { url, title, category } = await request.json()

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 })
    }

    const feed = await rssService.addFeed(url, title, category)

    return NextResponse.json({
      success: true,
      feed: {
        id: feed.id,
        title: feed.title,
        url: feed.url,
        description: feed.description,
        category: feed.category,
      },
    })
  } catch (error) {
    console.error("Error adding feed:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to add feed" },
      { status: 500 },
    )
  }
}
