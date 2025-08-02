import DeepSeekService from "./deepseek-service"
import { prisma } from "./prisma"

export class EnhancedStockService {
  private deepseekService: DeepSeekService | null

  constructor() {
    try {
      this.deepseekService = new DeepSeekService()
    } catch (error) {
      console.warn("Failed to initialize DeepSeek service:", error)
      this.deepseekService = null as any
    }
  }

  async detectStockMentions(articleId: string, text: string, title?: string) {
    try {
      let mentions: any[] = []

      // 优先使用DeepSeek检测
      if (this.deepseekService && this.deepseekService.isAvailable()) {
        try {
          const deepseekResult = await this.deepseekService.detectStockMentions(text, title)
          mentions = deepseekResult.stocks.map((stock) => ({
            symbol: stock.symbol,
            name: stock.name,
            count: 1,
            relevanceScore: stock.relevance,
            contextType: "deepseek_detected",
            sentiment: stock.sentiment,
            impact: stock.impact,
            reasoning: stock.reasoning,
          }))

          console.log(`✅ DeepSeek stock detection completed for article ${articleId}`)
        } catch (error) {
          console.warn(`DeepSeek stock detection failed for article ${articleId}, falling back to local:`, error)
          mentions = this.extractStockMentionsLocal(text)
        }
      } else {
        mentions = this.extractStockMentionsLocal(text)
      }

      // 保存股票提及到数据库
      for (const mention of mentions) {
        try {
          // 确保股票存在
          let stock = await prisma.stock.findUnique({
            where: { symbol: mention.symbol },
          })

          if (!stock) {
            stock = await prisma.stock.create({
              data: {
                symbol: mention.symbol,
                name: mention.name,
                exchange: "NASDAQ", // 默认
                sector: "Technology", // 默认
              },
            })
          }

          // 创建股票提及记录
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
              // 忽略重复记录错误
            })
        } catch (error) {
          console.error("Error creating stock mention:", error)
        }
      }

      return mentions
    } catch (error) {
      console.error("Error detecting stock mentions:", error)
      throw error
    }
  }

  // 本地股票检测（备选方案）
  private extractStockMentionsLocal(text: string) {
    const stockSymbols = new Map([
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

    const mentions = []
    const textLower = text.toLowerCase()

    for (const [symbol, name] of stockSymbols.entries()) {
      const symbolRegex = new RegExp(`\\b${symbol}\\b`, "gi")
      const nameRegex = new RegExp(`\\b${name.toLowerCase()}\\b`, "gi")

      const symbolMatches = text.match(symbolRegex) || []
      const nameMatches = textLower.match(nameRegex) || []

      const totalMentions = symbolMatches.length + nameMatches.length

      if (totalMentions > 0) {
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

    let score = 0.5 // 基础分数

    // 增加金融上下文的分数
    financialKeywords.forEach((keyword) => {
      if (textLower.includes(keyword)) {
        score += 0.1
      }
    })

    // 如果在标题中提及，增加分数
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
}
