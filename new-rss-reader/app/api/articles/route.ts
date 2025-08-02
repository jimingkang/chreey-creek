import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const feedId = searchParams.get("feedId")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const category = searchParams.get("category")
    const sentiment = searchParams.get("sentiment")

    const where: any = {}

    if (feedId) {
      where.feedId = feedId
    }

    if (category) {
      where.feed = {
        category,
      }
    }

    if (sentiment) {
      where.sentiment = {
        overallSentiment: sentiment,
      }
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        feed: {
          select: {
            title: true,
            category: true,
          },
        },
        sentiment: true,
        keywords: {
          take: 5,
          orderBy: {
            frequency: "desc",
          },
        },
        stockMentions: {
          include: {
            stock: {
              select: {
                symbol: true,
                name: true,
              },
            },
          },
          orderBy: {
            relevanceScore: "desc",
          },
          take: 3,
        },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
    })

    const totalCount = await prisma.article.count({ where })

    const formattedArticles = articles.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.content,
      url: article.url,
      author: article.author,
      publishedAt: article.publishedAt,
      imageUrl: article.imageUrl,
      feedTitle: article.feed.title,
      feedCategory: article.feed.category,
      sentiment: article.sentiment
        ? {
            overall: article.sentiment.overallSentiment,
            positiveScore: article.sentiment.positiveScore,
            negativeScore: article.sentiment.negativeScore,
            neutralScore: article.sentiment.neutralScore,
            confidence: article.sentiment.confidenceScore,
            keywordSentiments: article.sentiment.keywordSentiments,
          }
        : null,
      keywords: article.keywords.map((k) => ({
        word: k.word,
        frequency: k.frequency,
      })),
      stockMentions: article.stockMentions.map((m) => ({
        symbol: m.stock.symbol,
        name: m.stock.name,
        relevance: m.relevanceScore,
        contextType: m.contextType,
      })),
    }))

    return NextResponse.json({
      success: true,
      articles: formattedArticles,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch articles" }, { status: 500 })
  }
}
