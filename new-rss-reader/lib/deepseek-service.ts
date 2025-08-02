interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface SentimentAnalysis {
  overall: "positive" | "negative" | "neutral"
  positive: number
  negative: number
  neutral: number
  confidence: number
  keywordSentiments: Record<string, any>
  reasoning: string
}

interface StockDetection {
  stocks: Array<{
    symbol: string
    name: string
    relevance: number
    sentiment: "positive" | "negative" | "neutral"
    impact: {
      direction: "positive" | "negative" | "neutral"
      magnitude: number
      timeframe: "short" | "medium" | "long"
    }
    reasoning: string
  }>
}

export class DeepSeekService {
  private apiKey: string
  private baseURL: string = "https://api.deepseek.com/v1"

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || ""
    if (!this.apiKey) {
      console.warn("⚠️ DEEPSEEK_API_KEY not found in environment variables")
    }
  }

  // 检查DeepSeek是否可用
  isAvailable(): boolean {
    return !!this.apiKey
  }

  // 通用API调用方法
  private async callDeepSeek(messages: Array<{ role: string; content: string }>, temperature = 0.3): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("DeepSeek API key not configured")
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          temperature,
          max_tokens: 2000,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
      }

      const data: DeepSeekResponse = await response.json()
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from DeepSeek API")
      }

      return data.choices[0].message.content
    } catch (error) {
      console.error("DeepSeek API call failed:", error)
      throw error
    }
  }

  // 使用DeepSeek进行情感分析
  async analyzeSentiment(text: string, title?: string): Promise<SentimentAnalysis> {
    const prompt = `
请分析以下新闻文章的情感倾向。请以JSON格式返回结果，包含以下字段：

{
  "overall": "positive|negative|neutral",
  "positive": 0.0-1.0,
  "negative": 0.0-1.0, 
  "neutral": 0.0-1.0,
  "confidence": 0.0-1.0,
  "keywordSentiments": {
    "关键词": {
      "sentiment": "positive|negative|neutral",
      "score": -1.0到1.0,
      "confidence": 0.0-1.0
    }
  },
  "reasoning": "分析理由"
}

标题: ${title || "无标题"}
内容: ${text.substring(0, 2000)}

请特别关注：
1. 整体情感倾向
2. 关键词的情感色彩
3. 对市场/投资的潜在影响
4. 语言的客观性和主观性

只返回JSON，不要其他文字。`

    try {
      const response = await this.callDeepSeek([
        {
          role: "system",
          content: "你是一个专业的情感分析专家，擅长分析新闻文章的情感倾向和市场影响。请始终返回有效的JSON格式。"
        },
        {
          role: "user",
          content: prompt
        }
      ])

      // 解析JSON响应
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim()
      const result = JSON.parse(cleanResponse)

      // 验证和标准化结果
      return {
        overall: result.overall || "neutral",
        positive: Math.max(0, Math.min(1, result.positive || 0)),
        negative: Math.max(0, Math.min(1, result.negative || 0)),
        neutral: Math.max(0, Math.min(1, result.neutral || 0.5)),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        keywordSentiments: result.keywordSentiments || {},
        reasoning: result.reasoning || "DeepSeek情感分析完成"
      }
    } catch (error) {
      console.error("DeepSeek sentiment analysis failed:", error)
      
      // 返回默认结果而不是抛出错误
      return {
        overall: "neutral",
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34,
        confidence: 0.3,
        keywordSentiments: {},
        reasoning: "DeepSeek分析失败，使用默认值"
      }
    }
  }

  // 检测股票提及和影响
  async detectStockMentions(text: string, title?: string): Promise<StockDetection> {
    const prompt = `
请分析以下新闻文章中提及的股票，并评估其潜在影响。请以JSON格式返回结果：

{
  "stocks": [
    {
      "symbol": "股票代码",
      "name": "公司名称",
      "relevance": 0.0-1.0,
      "sentiment": "positive|negative|neutral",
      "impact": {
        "direction": "positive|negative|neutral",
        "magnitude": 0.0-1.0,
        "timeframe": "short|medium|long"
      },
      "reasoning": "分析理由"
    }
  ]
}

标题: ${title || "无标题"}
内容: ${text.substring(0, 2000)}

请识别：
1. 明确提及的股票代码和公司名称
2. 新闻对股票的潜在影响方向和强度
3. 影响的时间框架（短期/中期/长期）
4. 相关性评分（0-1）

常见股票包括：AAPL, GOOGL, MSFT, TSLA, NVDA, META, AMZN, NFLX等。

只返回JSON，不要其他文字。`

    try {
      const response = await this.callDeepSeek([
        {
          role: "system",
          content: "你是一个专业的金融分析师，擅长识别新闻中的股票提及并评估其市场影响。请始终返回有效的JSON格式。"
        },
        {
          role: "user",
          content: prompt
        }
      ])

      // 解析JSON响应
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim()
      const result = JSON.parse(cleanResponse)

      // 验证和标准化结果
      return {
        stocks: (result.stocks || []).map((stock: any) => ({
          symbol: stock.symbol || "",
          name: stock.name || "",
          relevance: Math.max(0, Math.min(1, stock.relevance || 0.5)),
          sentiment: stock.sentiment || "neutral",
          impact: {
            direction: stock.impact?.direction || "neutral",
            magnitude: Math.max(0, Math.min(1, stock.impact?.magnitude || 0.5)),
            timeframe: stock.impact?.timeframe || "medium"
          },
          reasoning: stock.reasoning || "DeepSeek股票分析"
        }))
      }
    } catch (error) {
      console.error("DeepSeek stock detection failed:", error)
      
      // 返回空结果而不是抛出错误
      return {
        stocks: []
      }
    }
  }

  // 生成文章摘要
  async generateSummary(text: string, title?: string, maxLength = 200): Promise<string> {
    const prompt = `
请为以下新闻文章生成一个简洁的摘要，长度控制在${maxLength}字符以内。

标题: ${title || "无标题"}
内容: ${text.substring(0, 3000)}

要求：
1. 提取核心信息和关键点
2. 保持客观中性的语调
3. 突出重要的数据和事实
4. 长度不超过${maxLength}字符

只返回摘要文本，不要其他内容。`

    try {
      const response = await this.callDeepSeek([
        {
          role: "system",
          content: "你是一个专业的新闻编辑，擅长提取文章核心信息并生成简洁准确的摘要。"
        },
        {
          role: "user",
          content: prompt
        }
      ])

      // 确保摘要长度不超过限制
      const summary = response.trim()
      return summary.length > maxLength ? summary.substring(0, maxLength) + "..." : summary
    } catch (error) {
      console.error("DeepSeek summary generation failed:", error)
      
      // 降级到简单截取
      return text.substring(0, maxLength) + "..."
    }
  }

  // 批量分析（用于处理多篇文章）
  async batchAnalyzeSentiment(
    articles: Array<{ id: string; title: string; content: string }>,
    batchSize = 3
  ): Promise<Array<{ id: string; sentiment: SentimentAnalysis | null; error?: string }>> {
    const results: Array<{ id: string; sentiment: SentimentAnalysis | null; error?: string }> = []

    // 分批处理以避免API限制
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (article) => {
        try {
          const sentiment = await this.analyzeSentiment(article.content, article.title)
          return { id: article.id, sentiment, error: undefined }
        } catch (error) {
          return {
            id: article.id,
            sentiment: null,
            error: error instanceof Error ? error.message : "Unknown error"
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // 添加延迟以避免API限制
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  // 获取API使用统计
  async getUsageStats(): Promise<{ available: boolean; model: string; endpoint: string }> {
    return {
      available: this.isAvailable(),
      model: "deepseek-chat",
      endpoint: this.baseURL
    }
  }

  // 测试API连接
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: "DeepSeek API key not configured"
      }
    }

    try {
      const response = await this.callDeepSeek([
        {
          role: "user",
          content: "请回复'连接成功'来测试API连接。"
        }
      ])

      return {
        success: true,
        message: `DeepSeek API连接成功: ${response.substring(0, 50)}`
      }
    } catch (error) {
      return {
        success: false,
        message: `DeepSeek API连接失败: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    }
  }
}

// 默认导出和命名导出
export default DeepSeekService
