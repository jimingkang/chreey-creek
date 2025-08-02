import { prisma } from "./prisma"
import DeepSeekService from "./deepseek-service"

export class SentimentService {
  private deepseekService: DeepSeekService
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

  constructor() {
    try {
      this.deepseekService = new DeepSeekService()
    } catch (error) {
      console.warn("Failed to initialize DeepSeek service:", error)
      this.deepseekService = null as any
    }
  }

  async analyzeArticle(articleId: string, text: string, title?: string) {
    try {
      let sentiment
      let analysisMethod = "local"

      // 优先使用DeepSeek分析
      if (this.deepseekService && this.deepseekService.isAvailable()) {
        try {
          const deepseekResult = await this.deepseekService.analyzeSentiment(text, title)
          sentiment = {
            overall: deepseekResult.overall,
            positive: deepseekResult.positive,
            negative: deepseekResult.negative,
            neutral: deepseekResult.neutral,
            confidence: deepseekResult.confidence,
            keywordSentiments: deepseekResult.keywordSentiments,
            reasoning: deepseekResult.reasoning,
          }
          analysisMethod = "deepseek"

          console.log(`✅ DeepSeek sentiment analysis completed for article ${articleId}`)
        } catch (error) {
          console.warn(`DeepSeek analysis failed for article ${articleId}, falling back to local:`, error)
          sentiment = this.analyzeSentimentLocal(text)
        }
      } else {
        sentiment = this.analyzeSentimentLocal(text)
      }

      // 保存到数据库
      await prisma.sentimentAnalysis.create({
        data: {
          articleId,
          overallSentiment: sentiment.overall,
          positiveScore: sentiment.positive,
          negativeScore: sentiment.negative,
          neutralScore: sentiment.neutral,
          confidenceScore: sentiment.confidence,
          keywordSentiments: sentiment.keywordSentiments || {},
          analysisMethod,
        },
      })

      return sentiment
    } catch (error) {
      console.error("Error analyzing sentiment:", error)
      throw error
    }
  }

  // 本地情感分析（作为备选方案）
  private analyzeSentimentLocal(text: string) {
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
        keywordSentiments: {},
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
      keywordSentiments: this.analyzeKeywordSentiments(text),
    }
  }

  private analyzeKeywordSentiments(text: string): Record<string, any> {
    const sentences = text.split(/[.!?]+/)
    const keywordSentiments: Record<string, any> = {}

    // 提取金融关键词并分析其上下文情感
    const financialKeywords = ["stock", "market", "price", "trading", "investment", "earnings", "revenue", "profit"]

    financialKeywords.forEach((keyword) => {
      const relevantSentences = sentences.filter((sentence) => sentence.toLowerCase().includes(keyword))

      if (relevantSentences.length > 0) {
        const contextText = relevantSentences.join(". ")
        const sentiment = this.analyzeSentimentLocal(contextText)

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

    // 按日期分组并计算每日平均值
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
          deepseekCount: 0,
          localCount: 0,
        }
      }

      dailyTrends[date].positive.push(sentiment.positiveScore)
      dailyTrends[date].negative.push(sentiment.negativeScore)
      dailyTrends[date].neutral.push(sentiment.neutralScore)
      dailyTrends[date].total++

      // 统计分析方法
      if (sentiment.analysisMethod === "deepseek") {
        dailyTrends[date].deepseekCount++
      } else {
        dailyTrends[date].localCount++
      }
    })

    // 计算平均值
    return Object.values(dailyTrends).map((day: any) => ({
      date: day.date,
      avgPositive: day.positive.reduce((a: number, b: number) => a + b, 0) / day.positive.length,
      avgNegative: day.negative.reduce((a: number, b: number) => a + b, 0) / day.negative.length,
      avgNeutral: day.neutral.reduce((a: number, b: number) => a + b, 0) / day.neutral.length,
      totalArticles: day.total,
      analysisQuality: {
        deepseekCount: day.deepseekCount,
        localCount: day.localCount,
        accuracy: day.deepseekCount / day.total, // DeepSeek分析的比例
      },
    }))
  }

  // 批量重新分析文章（用于升级到DeepSeek分析）
  async reanalyzeArticles(limit = 50) {
    if (!this.deepseekService.isAvailable()) {
      throw new Error("DeepSeek service not available")
    }

    // 获取使用本地分析的文章
    const articles = await prisma.article.findMany({
      where: {
        sentiment: {
          analysisMethod: "local",
        },
      },
      include: {
        sentiment: true,
      },
      take: limit,
      orderBy: {
        publishedAt: "desc",
      },
    })

    console.log(`🔄 开始重新分析 ${articles.length} 篇文章...`)

    let successCount = 0
    let errorCount = 0

    for (const article of articles) {
      try {
        // 删除旧的分析结果
        if (article.sentiment) {
          await prisma.sentimentAnalysis.delete({
            where: { id: article.sentiment.id },
          })
        }

        // 使用DeepSeek重新分析
        await this.analyzeArticle(article.id, article.content || "", article.title)
        successCount++

        // 添加延迟避免API限制
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error reanalyzing article ${article.id}:`, error)
        errorCount++
      }
    }

    console.log(`✅ 重新分析完成: ${successCount} 成功, ${errorCount} 失败`)

    return {
      total: articles.length,
      success: successCount,
      errors: errorCount,
    }
  }

  // 测试DeepSeek连接
  async testDeepSeekConnection() {
    if (!this.deepseekService) {
      return { success: false, message: "DeepSeek service not initialized" }
    }

    return await this.deepseekService.testConnection()
  }
}
