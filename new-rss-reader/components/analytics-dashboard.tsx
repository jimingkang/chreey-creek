"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, BarChart3, Calendar, Activity, Minus } from "lucide-react"

interface SentimentTrend {
  date: string
  avgPositive: number
  avgNegative: number
  avgNeutral: number
  totalArticles: number
}

interface StockData {
  id: string
  symbol: string
  name: string
  mentionCount: number
  avgRelevance: number
}

export function AnalyticsDashboard() {
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([])
  const [topStocks, setTopStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7")

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const [sentimentResponse, stocksResponse] = await Promise.all([
        fetch(`/api/analytics/sentiment?days=${timeRange}`),
        fetch(`/api/analytics/stocks?days=${timeRange}&limit=10`),
      ])

      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json()
        setSentimentTrends(sentimentData.trends || [])
      }

      if (stocksResponse.ok) {
        const stocksData = await stocksResponse.json()
        setTopStocks(stocksData.stocks || [])
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalArticles = sentimentTrends.reduce((sum, trend) => sum + trend.totalArticles, 0)
  const avgSentiment =
    sentimentTrends.length > 0
      ? sentimentTrends.reduce((sum, trend) => sum + (trend.avgPositive - trend.avgNegative), 0) /
        sentimentTrends.length
      : 0

  const sentimentStats =
    sentimentTrends.length > 0
      ? {
          positive: sentimentTrends.reduce((sum, trend) => sum + trend.avgPositive, 0) / sentimentTrends.length,
          negative: sentimentTrends.reduce((sum, trend) => sum + trend.avgNegative, 0) / sentimentTrends.length,
          neutral: sentimentTrends.reduce((sum, trend) => sum + trend.avgNeutral, 0) / sentimentTrends.length,
        }
      : { positive: 0, negative: 0, neutral: 0 }

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.5) return <TrendingUp className="h-5 w-5 text-green-600" />
    if (sentiment < 0.3) return <TrendingDown className="h-5 w-5 text-red-600" />
    return <Minus className="h-5 w-5 text-gray-600" />
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return "text-green-600"
    if (sentiment < 0.3) return "text-red-600"
    return "text-gray-600"
  }

  if (loading) {
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
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              数据分析仪表板
            </CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7天</SelectItem>
                <SelectItem value="14">14天</SelectItem>
                <SelectItem value="30">30天</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总文章数</p>
                <p className="text-2xl font-bold">{totalArticles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均情感</p>
                <p className={`text-2xl font-bold ${getSentimentColor(avgSentiment + 0.5)}`}>
                  {avgSentiment > 0 ? "+" : ""}
                  {(avgSentiment * 100).toFixed(1)}%
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
                <p className="text-sm font-medium text-gray-600">活跃股票</p>
                <p className="text-2xl font-bold">{topStocks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">分析周期</p>
                <p className="text-2xl font-bold">{timeRange}天</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 情感分析概览 */}
      <Card>
        <CardHeader>
          <CardTitle>情感分析概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-3xl font-bold text-green-600">{(sentimentStats.positive * 100).toFixed(1)}%</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">正面情感</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${sentimentStats.positive * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingDown className="h-6 w-6 text-red-600 mr-2" />
                <span className="text-3xl font-bold text-red-600">{(sentimentStats.negative * 100).toFixed(1)}%</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">负面情感</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${sentimentStats.negative * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Minus className="h-6 w-6 text-gray-600 mr-2" />
                <span className="text-3xl font-bold text-gray-600">{(sentimentStats.neutral * 100).toFixed(1)}%</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">中性情感</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gray-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${sentimentStats.neutral * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 情感趋势可视化 */}
      <Card>
        <CardHeader>
          <CardTitle>情感趋势分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sentimentTrends.map((trend, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{trend.date}</span>
                    {getSentimentIcon(trend.avgPositive)}
                  </div>
                  <span className="text-sm text-gray-600">{trend.totalArticles} 篇文章</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-green-600">正面</span>
                      <span className="text-xs font-medium text-green-600">
                        {(trend.avgPositive * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${trend.avgPositive * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-red-600">负面</span>
                      <span className="text-xs font-medium text-red-600">{(trend.avgNegative * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${trend.avgNegative * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">中性</span>
                      <span className="text-xs font-medium text-gray-600">{(trend.avgNeutral * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${trend.avgNeutral * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 股票提及可视化 */}
      <Card>
        <CardHeader>
          <CardTitle>热门股票提及</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topStocks.map((stock, index) => {
              const maxMentions = Math.max(...topStocks.map((s) => s.mentionCount))
              const widthPercentage = (stock.mentionCount / maxMentions) * 100

              return (
                <div key={stock.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-lg">{stock.symbol}</p>
                        <p className="text-sm text-gray-600">{stock.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl">{stock.mentionCount}</p>
                      <p className="text-xs text-gray-600">次提及</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>提及频率</span>
                      <span className="font-medium">{stock.mentionCount} 次</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${widthPercentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span>相关性</span>
                      <span className="font-medium">{Math.round((stock.avgRelevance || 0) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(stock.avgRelevance || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>详细数据表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">日期</th>
                  <th className="text-left p-3 font-medium">正面情感</th>
                  <th className="text-left p-3 font-medium">负面情感</th>
                  <th className="text-left p-3 font-medium">中性情感</th>
                  <th className="text-left p-3 font-medium">文章总数</th>
                  <th className="text-left p-3 font-medium">情感倾向</th>
                </tr>
              </thead>
              <tbody>
                {sentimentTrends.map((trend, index) => {
                  const sentiment = trend.avgPositive - trend.avgNegative
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium">{trend.date}</td>
                      <td className="p-3">
                        <span className="text-green-600 font-medium">{(trend.avgPositive * 100).toFixed(1)}%</span>
                      </td>
                      <td className="p-3">
                        <span className="text-red-600 font-medium">{(trend.avgNegative * 100).toFixed(1)}%</span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-600 font-medium">{(trend.avgNeutral * 100).toFixed(1)}%</span>
                      </td>
                      <td className="p-3 font-medium">{trend.totalArticles}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          {getSentimentIcon(sentiment + 0.5)}
                          <span className={`font-medium ${getSentimentColor(sentiment + 0.5)}`}>
                            {sentiment > 0.1 ? "积极" : sentiment < -0.1 ? "消极" : "中性"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
