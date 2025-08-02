"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  Search,
  AlertTriangle,
  CheckCircle,
  Minus,
} from "lucide-react"

interface StockAnalysis {
  symbol: string
  name: string
  correlationScore: number
  sentimentImpact: number
  priceVolatility: number
  recommendation: "BUY" | "SELL" | "HOLD"
  confidence: number
  analysis: {
    positiveNews: number
    negativeNews: number
    neutralNews: number
    avgSentiment: number
    mentionTrend: number[]
    priceImpactScore: number
  }
}

interface StockPrediction {
  prediction: "UP" | "DOWN" | "STABLE"
  confidence: number
  factors: Array<{
    factor: string
    impact: number
    description: string
  }>
}

interface CorrelationReport {
  correlationCoefficient: number
  significanceLevel: number
  dataPoints: Array<{
    date: string
    sentiment: number
    priceChange: number
    volume: number
  }>
  insights: string[]
}

export function StockAnalysisDashboard() {
  const [selectedStock, setSelectedStock] = useState("AAPL")
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null)
  const [prediction, setPrediction] = useState<StockPrediction | null>(null)
  const [correlation, setCorrelation] = useState<CorrelationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState("30")

  const popularStocks = ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "META", "AMZN", "NFLX"]

  useEffect(() => {
    if (selectedStock) {
      fetchStockData()
    }
  }, [selectedStock, timeRange])

  const fetchStockData = async () => {
    setLoading(true)
    try {
      const [analysisRes, predictionRes, correlationRes] = await Promise.all([
        fetch(`/api/stocks/analysis/${selectedStock}?days=${timeRange}`),
        fetch(`/api/stocks/prediction/${selectedStock}?days=7`),
        fetch(`/api/stocks/correlation/${selectedStock}?days=90`),
      ])

      if (analysisRes.ok) {
        const analysisData = await analysisRes.json()
        setAnalysis(analysisData.analysis)
      }

      if (predictionRes.ok) {
        const predictionData = await predictionRes.json()
        setPrediction(predictionData.prediction)
      }

      if (correlationRes.ok) {
        const correlationData = await correlationRes.json()
        setCorrelation(correlationData.report)
      }
    } catch (error) {
      console.error("Error fetching stock data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "BUY":
        return "bg-green-100 text-green-800"
      case "SELL":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "BUY":
        return <TrendingUp className="h-4 w-4" />
      case "SELL":
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case "UP":
        return "text-green-600"
      case "DOWN":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case "UP":
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case "DOWN":
        return <TrendingDown className="h-5 w-5 text-red-600" />
      default:
        return <Minus className="h-5 w-5 text-gray-600" />
    }
  }

  if (loading && !analysis) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 股票选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            股票关联分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="输入股票代码 (如: AAPL)"
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value.toUpperCase())}
                className="w-40"
              />
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7天</SelectItem>
                <SelectItem value="30">30天</SelectItem>
                <SelectItem value="90">90天</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {popularStocks.map((stock) => (
                <Button
                  key={stock}
                  variant={selectedStock === stock ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStock(stock)}
                >
                  {stock}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">综合分析</TabsTrigger>
            <TabsTrigger value="prediction">趋势预测</TabsTrigger>
            <TabsTrigger value="correlation">关联分析</TabsTrigger>
            <TabsTrigger value="details">详细数据</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 核心指标 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">投资建议</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getRecommendationColor(analysis.recommendation)}>
                          <span className="flex items-center space-x-1">
                            {getRecommendationIcon(analysis.recommendation)}
                            <span>{analysis.recommendation}</span>
                          </span>
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{analysis.confidence}%</p>
                      <p className="text-xs text-gray-600">置信度</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">情感影响</p>
                      <p className="text-2xl font-bold">
                        {analysis.sentimentImpact > 0 ? "+" : ""}
                        {(analysis.sentimentImpact * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">关联度</p>
                      <p className="text-2xl font-bold">{(analysis.correlationScore * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">波动性</p>
                      <p className="text-2xl font-bold">{analysis.priceVolatility.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 情感分析分布 */}
            <Card>
              <CardHeader>
                <CardTitle>新闻情感分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">{analysis.analysis.positiveNews}</div>
                    <div className="text-sm text-gray-600 mb-3">正面新闻</div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (analysis.analysis.positiveNews /
                              (analysis.analysis.positiveNews +
                                analysis.analysis.negativeNews +
                                analysis.analysis.neutralNews)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600 mb-2">{analysis.analysis.negativeNews}</div>
                    <div className="text-sm text-gray-600 mb-3">负面新闻</div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-red-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (analysis.analysis.negativeNews /
                              (analysis.analysis.positiveNews +
                                analysis.analysis.negativeNews +
                                analysis.analysis.neutralNews)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-600 mb-2">{analysis.analysis.neutralNews}</div>
                    <div className="text-sm text-gray-600 mb-3">中性新闻</div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gray-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (analysis.analysis.neutralNews /
                              (analysis.analysis.positiveNews +
                                analysis.analysis.negativeNews +
                                analysis.analysis.neutralNews)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 提及趋势 */}
            <Card>
              <CardHeader>
                <CardTitle>7天提及趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end space-x-2 h-32">
                  {analysis.analysis.mentionTrend.map((count, index) => {
                    const maxCount = Math.max(...analysis.analysis.mentionTrend)
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all duration-500"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-xs text-gray-600 mt-2">
                          {new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString("zh-CN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-xs font-medium">{count}</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prediction" className="space-y-6">
            {prediction && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      趋势预测
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6">
                      <div className="flex items-center justify-center mb-4">
                        {getPredictionIcon(prediction.prediction)}
                        <span className={`text-4xl font-bold ml-3 ${getPredictionColor(prediction.prediction)}`}>
                          {prediction.prediction === "UP" ? "看涨" : prediction.prediction === "DOWN" ? "看跌" : "持平"}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-600 mb-2">
                        置信度: {prediction.confidence.toFixed(1)}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${prediction.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>影响因子分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {prediction.factors.map((factor, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{factor.factor}</h4>
                            <span
                              className={`font-bold ${factor.impact > 0 ? "text-green-600" : factor.impact < 0 ? "text-red-600" : "text-gray-600"}`}
                            >
                              {factor.impact > 0 ? "+" : ""}
                              {(factor.impact * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{factor.description}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                factor.impact > 0 ? "bg-green-600" : factor.impact < 0 ? "bg-red-600" : "bg-gray-600"
                              }`}
                              style={{ width: `${Math.abs(factor.impact) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="correlation" className="space-y-6">
            {correlation && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>情感-价格关联分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {correlation.correlationCoefficient.toFixed(3)}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">相关系数</div>
                        <div className="text-xs text-gray-500">
                          {Math.abs(correlation.correlationCoefficient) > 0.7
                            ? "强相关"
                            : Math.abs(correlation.correlationCoefficient) > 0.3
                              ? "中等相关"
                              : "弱相关"}
                        </div>
                      </div>

                      <div className="text-center p-6 bg-green-50 rounded-lg">
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          {(correlation.significanceLevel * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 mb-3">显著性水平</div>
                        <div className="text-xs text-gray-500">
                          {correlation.significanceLevel < 0.05 ? "统计显著" : "统计不显著"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>分析洞察</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {correlation.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {correlation && (
              <Card>
                <CardHeader>
                  <CardTitle>历史数据详情</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">日期</th>
                          <th className="text-left p-3 font-medium">情感分数</th>
                          <th className="text-left p-3 font-medium">价格变化</th>
                          <th className="text-left p-3 font-medium">新闻量</th>
                          <th className="text-left p-3 font-medium">关联度</th>
                        </tr>
                      </thead>
                      <tbody>
                        {correlation.dataPoints.slice(0, 20).map((point, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-medium">{point.date}</td>
                            <td className="p-3">
                              <span
                                className={`font-medium ${point.sentiment > 0 ? "text-green-600" : point.sentiment < 0 ? "text-red-600" : "text-gray-600"}`}
                              >
                                {point.sentiment > 0 ? "+" : ""}
                                {point.sentiment.toFixed(3)}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`font-medium ${point.priceChange > 0 ? "text-green-600" : point.priceChange < 0 ? "text-red-600" : "text-gray-600"}`}
                              >
                                {point.priceChange > 0 ? "+" : ""}
                                {point.priceChange.toFixed(2)}%
                              </span>
                            </td>
                            <td className="p-3">{point.volume}</td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${Math.abs(point.sentiment * point.priceChange) * 10}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600">
                                  {(Math.abs(point.sentiment * point.priceChange) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
