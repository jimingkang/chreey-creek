import { prisma } from "./prisma"

export class StockService {
  private stockSymbols = new Map([
    ["AAPL", "Apple Inc."],
    ["GOOGL", "Alphabet Inc."],
    ["MSFT", "Microsoft Corporation"],
    ["AMZN", "Amazon.com Inc."],
    ["TSLA", "Tesla Inc."],
    ["META", "Meta Platforms Inc."],
    ["NVDA", "NVIDIA Corporation"],
    ["NFLX", "Netflix Inc."],
    ["AMD", "Advanced Micro Devices"],
    ["INTC", "Intel Corporation"],
  ])

  async detectStockMentions(articleId: string, text: string) {
    const mentions = this.extractStockMentions(text)

    for (const mention of mentions) {
      try {
        // Ensure stock exists in database
        let stock = await prisma.stock.findUnique({
          where: { symbol: mention.symbol },
        })

        if (!stock) {
          stock = await prisma.stock.create({
            data: {
              symbol: mention.symbol,
              name: mention.name,
              exchange: "NASDAQ", // Default
              sector: "Technology", // Default
            },
          })
        }

        // Create stock mention
        await prisma.stockMention
          .create({
            data: {
              articleId,
              stockId: stock.id,
              relevanceScore: mention.relevanceScore,
              mentionCount: mention.count,
              contextType: mention.contextType,
            },
          })
          .catch(() => {
            // Ignore duplicate errors
          })
      } catch (error) {
        console.error("Error creating stock mention:", error)
      }
    }
  }

  private extractStockMentions(text: string) {
    const mentions = []
    const textLower = text.toLowerCase()

    for (const [symbol, name] of this.stockSymbols.entries()) {
      const symbolRegex = new RegExp(`\\b${symbol}\\b`, "gi")
      const nameRegex = new RegExp(`\\b${name.toLowerCase()}\\b`, "gi")

      const symbolMatches = text.match(symbolRegex) || []
      const nameMatches = textLower.match(nameRegex) || []

      const totalMentions = symbolMatches.length + nameMatches.length

      if (totalMentions > 0) {
        // Calculate relevance score based on context
        const relevanceScore = this.calculateRelevanceScore(text, symbol, name)

        mentions.push({
          symbol,
          name,
          count: totalMentions,
          relevanceScore,
          contextType: this.determineContextType(text, symbol, name),
        })
      }
    }

    return mentions
  }

  private calculateRelevanceScore(text: string, symbol: string, name: string): number {
    const textLower = text.toLowerCase()
    const financialKeywords = ["stock", "price", "trading", "market", "earnings", "revenue", "profit", "shares"]

    let score = 0.5 // Base score

    // Increase score for financial context
    financialKeywords.forEach((keyword) => {
      if (textLower.includes(keyword)) {
        score += 0.1
      }
    })

    // Increase score if mentioned in title (assuming first 100 chars)
    if (
      text.substring(0, 100).toLowerCase().includes(symbol.toLowerCase()) ||
      text.substring(0, 100).toLowerCase().includes(name.toLowerCase())
    ) {
      score += 0.2
    }

    return Math.min(1.0, score)
  }

  private determineContextType(text: string, symbol: string, name: string): string {
    const textLower = text.toLowerCase()

    if (textLower.includes(symbol.toLowerCase()) || textLower.includes(name.toLowerCase())) {
      return "direct"
    }

    if (textLower.includes("tech") || textLower.includes("technology")) {
      return "sector"
    }

    if (textLower.includes("market") || textLower.includes("stocks")) {
      return "market"
    }

    return "indirect"
  }

  async calculateSentimentImpact(stockId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get articles mentioning this stock with sentiment analysis
    const stockMentions = await prisma.stockMention.findMany({
      where: {
        stockId,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        article: {
          include: {
            sentiment: true,
          },
        },
      },
    })

    // Group by date and calculate daily sentiment impact
    const dailyImpacts: Record<string, any> = {}

    stockMentions.forEach((mention) => {
      if (!mention.article.sentiment) return

      const date = mention.article.publishedAt.toISOString().split("T")[0]

      if (!dailyImpacts[date]) {
        dailyImpacts[date] = {
          date,
          sentiments: [],
          volume: 0,
        }
      }

      const sentimentScore = mention.article.sentiment.positiveScore - mention.article.sentiment.negativeScore
      const weightedScore = sentimentScore * mention.relevanceScore

      dailyImpacts[date].sentiments.push(weightedScore)
      dailyImpacts[date].volume++
    })

    // Calculate averages and save to database
    for (const [date, impact] of Object.entries(dailyImpacts)) {
      const avgSentiment =
        (impact as any).sentiments.reduce((a: number, b: number) => a + b, 0) / (impact as any).sentiments.length

      await prisma.sentimentImpact.upsert({
        where: {
          stockId_date: {
            stockId,
            date: new Date(date),
          },
        },
        update: {
          avgSentiment,
          sentimentVolume: (impact as any).volume,
          correlationScore: Math.abs(avgSentiment), // Simplified correlation
        },
        create: {
          stockId,
          date: new Date(date),
          avgSentiment,
          sentimentVolume: (impact as any).volume,
          priceImpact: 0, // Would need actual price data
          correlationScore: Math.abs(avgSentiment),
        },
      })
    }

    return Object.values(dailyImpacts)
  }

  async getTopMentionedStocks(days = 7, limit = 10) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const topStocks = await prisma.stockMention.groupBy({
      by: ["stockId"],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        relevanceScore: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit,
    })

    // Get stock details
    const stockDetails = await Promise.all(
      topStocks.map(async (stock) => {
        const stockInfo = await prisma.stock.findUnique({
          where: { id: stock.stockId },
        })

        return {
          ...stockInfo,
          mentionCount: stock._count.id,
          avgRelevance: stock._avg.relevanceScore,
        }
      }),
    )

    return stockDetails
  }
}
