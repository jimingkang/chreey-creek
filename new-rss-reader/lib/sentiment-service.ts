import { prisma } from "./prisma"

export class SentimentService {
  private positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "awesome",
    "brilliant",
    "success",
    "win",
    "victory",
    "achievement",
    "breakthrough",
    "innovation",
    "growth",
    "profit",
    "increase",
    "rise",
    "boost",
    "improve",
    "better",
    "best",
    "positive",
    "optimistic",
    "strong",
    "bullish",
    "surge",
    "soar",
    "rally",
    "gain",
    "advance",
    "upgrade",
    "outperform",
  ]

  private negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "disaster",
    "crisis",
    "problem",
    "issue",
    "fail",
    "failure",
    "loss",
    "decline",
    "decrease",
    "drop",
    "fall",
    "crash",
    "negative",
    "pessimistic",
    "concern",
    "worry",
    "risk",
    "danger",
    "threat",
    "weak",
    "bearish",
    "plunge",
    "tumble",
    "slide",
    "slump",
    "downgrade",
    "underperform",
    "volatile",
    "uncertainty",
  ]

  async analyzeArticle(articleId: string, text: string) {
    try {
      const sentiment = this.analyzeSentiment(text)
      const keywordSentiments = this.analyzeKeywordSentiments(text)

      await prisma.sentimentAnalysis.create({
        data: {
          articleId,
          overallSentiment: sentiment.overall,
          positiveScore: sentiment.positive,
          negativeScore: sentiment.negative,
          neutralScore: sentiment.neutral,
          confidenceScore: sentiment.confidence,
          keywordSentiments,
          analysisMethod: "local",
        },
      })

      return sentiment
    } catch (error) {
      console.error("Error analyzing sentiment:", error)
      throw error
    }
  }

  private analyzeSentiment(text: string) {
    const words = text.toLowerCase().split(/\s+/)
    let positiveCount = 0
    let negativeCount = 0

    words.forEach((word) => {
      if (this.positiveWords.some((pw) => word.includes(pw))) {
        positiveCount++
      }
      if (this.negativeWords.some((nw) => word.includes(nw))) {
        negativeCount++
      }
    })

    const total = positiveCount + negativeCount
    if (total === 0) {
      return {
        overall: "neutral" as const,
        positive: 0.5,
        negative: 0.5,
        neutral: 1.0,
        confidence: 0.3,
      }
    }

    const positive = positiveCount / total
    const negative = negativeCount / total
    const confidence = Math.abs(positive - negative)

    return {
      overall: (positive > negative ? "positive" : negative > positive ? "negative" : "neutral") as const,
      positive,
      negative,
      neutral: Math.max(0, 1 - positive - negative),
      confidence,
    }
  }

  private analyzeKeywordSentiments(text: string): Record<string, any> {
    const sentences = text.split(/[.!?]+/)
    const keywordSentiments: Record<string, any> = {}

    // Extract financial keywords and analyze their context
    const financialKeywords = ["stock", "market", "price", "trading", "investment", "earnings", "revenue", "profit"]

    financialKeywords.forEach((keyword) => {
      const relevantSentences = sentences.filter((sentence) => sentence.toLowerCase().includes(keyword))

      if (relevantSentences.length > 0) {
        const contextText = relevantSentences.join(". ")
        const sentiment = this.analyzeSentiment(contextText)

        keywordSentiments[keyword] = {
          sentiment: sentiment.overall,
          score: sentiment.positive - sentiment.negative,
          confidence: sentiment.confidence,
          mentions: relevantSentences.length,
        }
      }
    })

    return keywordSentiments
  }

  async getSentimentTrends(days = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const sentiments = await prisma.sentimentAnalysis.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        article: {
          select: {
            publishedAt: true,
            feed: {
              select: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Group by date and calculate daily averages
    const dailyTrends: Record<string, any> = {}

    sentiments.forEach((sentiment) => {
      const date = sentiment.article.publishedAt.toISOString().split("T")[0]

      if (!dailyTrends[date]) {
        dailyTrends[date] = {
          date,
          positive: [],
          negative: [],
          neutral: [],
          total: 0,
        }
      }

      dailyTrends[date].positive.push(sentiment.positiveScore)
      dailyTrends[date].negative.push(sentiment.negativeScore)
      dailyTrends[date].neutral.push(sentiment.neutralScore)
      dailyTrends[date].total++
    })

    // Calculate averages
    return Object.values(dailyTrends).map((day: any) => ({
      date: day.date,
      avgPositive: day.positive.reduce((a: number, b: number) => a + b, 0) / day.positive.length,
      avgNegative: day.negative.reduce((a: number, b: number) => a + b, 0) / day.negative.length,
      avgNeutral: day.neutral.reduce((a: number, b: number) => a + b, 0) / day.neutral.length,
      totalArticles: day.total,
    }))
  }
}
