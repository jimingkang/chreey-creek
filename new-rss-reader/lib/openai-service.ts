import OpenAI from "openai"

class OpenAIService {
  private openai: OpenAI | null = null

  constructor() {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        })
        console.log("✅ OpenAI service initialized successfully")
      } else {
        console.warn("⚠️ OpenAI API key not found. Using local sentiment analysis.")
      }
    } catch (error) {
      console.error("❌ Failed to initialize OpenAI service:", error)
      this.openai = null
    }
  }

  // 检查OpenAI是否可用
  isAvailable(): boolean {
    return this.openai !== null
  }

  // 使用OpenAI进行情感分析
  async analyzeSentiment(
    text: string,
    title?: string,
  ): Promise<{
    overall: "positive" | "negative" | "neutral"
    positive: number
    negative: number
    neutral: number
    confidence: number
    keywordSentiments: Record<string, any>
    reasoning: string
  }> {
    if (!this.openai) {
      throw new Error("OpenAI not available")
    }

    try {
      const prompt = this.buildSentimentPrompt(text, title)

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // 使用更经济的模型
        messages: [
          {
            role: "system",
            content: `你是一个专业的金融新闻情感分析专家。请分析给定的新闻文本，并返回JSON格式的分析结果。

返回格式：
{
  "overall": "positive|negative|neutral",
  "scores": {
    "positive": 0.0-1.0,
    "negative": 0.0-1.0, 
    "neutral": 0.0-1.0
  },
  "confidence": 0.0-1.0,
  "keywordSentiments": {
    "关键词": {
      "sentiment": "positive|negative|neutral",
      "score": 0.0-1.0,
      "relevance": 0.0-1.0
    }
  },
  "reasoning": "分析理由",
  "stockImpact": {
    "direction": "positive|negative|neutral",
    "magnitude": 0.0-1.0,
    "timeframe": "short|medium|long"
  }
}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // 降低随机性，提高一致性
        max_tokens: 1000,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error("No response from OpenAI")
      }

      // 解析JSON响应
      const analysis = JSON.parse(response)

      return {
        overall: analysis.overall,
        positive: analysis.scores.positive,
        negative: analysis.scores.negative,
        neutral: analysis.scores.neutral,
        confidence: analysis.confidence,
        keywordSentiments: analysis.keywordSentiments || {},
        reasoning: analysis.reasoning || "",
      }
    } catch (error) {
      console.error("OpenAI sentiment analysis error:", error)
      throw error
    }
  }

  // 检测股票提及和影响
  async detectStockMentions(
    text: string,
    title?: string,
  ): Promise<{
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
  }> {
    if (!this.openai) {
      throw new Error("OpenAI not available")
    }

    try {
      const prompt = this.buildStockDetectionPrompt(text, title)

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `你是一个专业的股票市场分析师。请分析给定的新闻文本，识别其中提及的股票，并评估新闻对这些股票的潜在影响。

返回JSON格式：
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

只返回明确提及或强相关的股票，相关性低于0.3的不要包含。`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error("No response from OpenAI")
      }

      const analysis = JSON.parse(response)
      return analysis
    } catch (error) {
      console.error("OpenAI stock detection error:", error)
      throw error
    }
  }

  // 生成文章摘要
  async generateSummary(text: string, title?: string, maxLength = 200): Promise<string> {
    if (!this.openai) {
      throw new Error("OpenAI not available")
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `请为给定的新闻文章生成一个简洁的中文摘要，长度控制在${maxLength}字符以内。摘要应该包含最重要的信息和关键点。`,
          },
          {
            role: "user",
            content: `标题：${title || "无标题"}\n\n内容：${text.substring(0, 2000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: Math.ceil(maxLength * 1.5),
      })

      return completion.choices[0]?.message?.content || text.substring(0, maxLength) + "..."
    } catch (error) {
      console.error("OpenAI summary generation error:", error)
      // 降级到简单截取
      return text.substring(0, maxLength) + "..."
    }
  }

  // 构建情感分析提示
  private buildSentimentPrompt(text: string, title?: string): string {
    return `请分析以下新闻的情感倾向：

标题：${title || "无标题"}

内容：${text.substring(0, 2000)}

请特别关注：
1. 整体情感倾向（积极、消极、中性）
2. 对金融市场的潜在影响
3. 关键词的情感色彩
4. 分析的置信度

请返回JSON格式的分析结果。`
  }

  // 构建股票检测提示
  private buildStockDetectionPrompt(text: string, title?: string): string {
    return `请分析以下新闻中提及的股票和公司：

标题：${title || "无标题"}

内容：${text.substring(0, 2000)}

请识别：
1. 直接提及的股票代码和公司名称
2. 新闻对这些股票的潜在影响
3. 影响的方向（正面/负面/中性）
4. 影响的强度和时间框架
5. 分析理由

只包含相关性较高的股票（相关性 > 0.3）。`
  }

  // 批量分析（用于处理多篇文章）
  async batchAnalyzeSentiment(
    articles: Array<{ id: string; title: string; content: string }>,
    batchSize = 5,
  ): Promise<
    Array<{
      id: string
      sentiment: any
      error?: string
    }>
  > {
    const results = []

    // 分批处理以避免API限制
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)

      const batchPromises = batch.map(async (article) => {
        try {
          const sentiment = await this.analyzeSentiment(article.content, article.title)
          return { id: article.id, sentiment }
        } catch (error) {
          console.error(`Error analyzing article ${article.id}:`, error)
          return {
            id: article.id,
            sentiment: null,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // 添加延迟以避免API限制
      if (i + batchSize < articles.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return results
  }
}

// 默认导出和命名导出
export default OpenAIService
export { OpenAIService }
