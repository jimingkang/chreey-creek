"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, BarChart3, Calendar, Activity } from "lucide-react"

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

export function SimpleAnalyticsDashboard() {
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
                <p className="text-2xl font-bold">
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
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {(sentimentStats.positive * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">正面情感</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${sentimentStats.positive * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{(sentimentStats.negative * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">负面情感</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${sentimentStats.negative * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600 mb-2">{(sentimentStats.neutral * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">中性情感</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gray-600 h-2 rounded-full"
                  style={{ width: `${sentimentStats.neutral * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 情感趋势表格 */}
      <Card>
        <CardHeader>
          <CardTitle>情感趋势数据</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">日期</th>
                  <th className="text-left p-2">正面</th>
                  <th className="text-left p-2">负面</th>
                  <th className="text-left p-2">中性</th>
                  <th className="text-left p-2">文章数</th>
                </tr>
              </thead>
              <tbody>
                {sentimentTrends.map((trend, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">{trend.date}</td>
                    <td className="p-2">
                      <span className="text-green-600 font-medium">{(trend.avgPositive * 100).toFixed(1)}%</span>
                    </td>
                    <td className="p-2">
                      <span className="text-red-600 font-medium">{(trend.avgNegative * 100).toFixed(1)}%</span>
                    </td>
                    <td className="p-2">
                      <span className="text-gray-600 font-medium">{(trend.avgNeutral * 100).toFixed(1)}%</span>
                    </td>
                    <td className="p-2">{trend.totalArticles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 股票提及排行 */}
      <Card>
        <CardHeader>
          <CardTitle>股票提及排行</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topStocks.map((stock, index) => (
              <div key={stock.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{stock.symbol}</p>
                    <p className="text-sm text-gray-600">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{stock.mentionCount} 次提及</p>
                  <p className="text-sm text-gray-600">相关性: {Math.round((stock.avgRelevance || 0) * 100)}%</p>
                  <div className="w-20 bg-gray-200 rounded-full h-1 mt-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${(stock.avgRelevance || 0) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
