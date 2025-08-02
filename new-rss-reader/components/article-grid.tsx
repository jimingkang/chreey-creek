"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar, User, ExternalLink, TrendingUp, TrendingDown, Minus, Filter } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Article {
  id: string
  title: string
  summary: string
  url: string
  author: string
  publishedAt: string
  imageUrl: string | null
  feedTitle: string
  feedCategory: string
  sentiment: {
    overall: string
    positiveScore: number
    negativeScore: number
    neutralScore: number
    confidence: number
  } | null
  keywords: Array<{
    word: string
    frequency: number
  }>
  stockMentions: Array<{
    symbol: string
    name: string
    relevance: number
    contextType: string
  }>
}

export function ArticleGrid() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    category: "all",
    sentiment: "all",
    search: "",
  })
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
  })

  useEffect(() => {
    fetchArticles()
  }, [filter])

  const fetchArticles = async (loadMore = false) => {
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: loadMore ? pagination.offset.toString() : "0",
      })

      if (filter.category !== "all") {
        params.append("category", filter.category)
      }
      if (filter.sentiment !== "all") {
        params.append("sentiment", filter.sentiment)
      }

      const response = await fetch(`/api/articles?${params}`)
      if (response.ok) {
        const data = await response.json()

        if (loadMore) {
          setArticles((prev) => [...prev, ...data.articles])
        } else {
          setArticles(data.articles || [])
        }

        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore,
          offset: loadMore ? prev.offset + prev.limit : data.pagination.offset,
        }))
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    fetchArticles(true)
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-gray-100 text-gray-800",
      technology: "bg-blue-100 text-blue-800",
      business: "bg-green-100 text-green-800",
      finance: "bg-yellow-100 text-yellow-800",
      sports: "bg-red-100 text-red-800",
      entertainment: "bg-purple-100 text-purple-800",
    }
    return colors[category] || colors.general
  }

  const filteredArticles = articles.filter((article) => {
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      return (
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.feedTitle.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
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
      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            文章筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="搜索文章..."
                value={filter.search}
                onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            <Select
              value={filter.category}
              onValueChange={(value) => setFilter((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                <SelectItem value="general">综合</SelectItem>
                <SelectItem value="technology">科技</SelectItem>
                <SelectItem value="business">商业</SelectItem>
                <SelectItem value="finance">金融</SelectItem>
                <SelectItem value="sports">体育</SelectItem>
                <SelectItem value="entertainment">娱乐</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filter.sentiment}
              onValueChange={(value) => setFilter((prev) => ({ ...prev, sentiment: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="情感倾向" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有情感</SelectItem>
                <SelectItem value="positive">正面</SelectItem>
                <SelectItem value="negative">负面</SelectItem>
                <SelectItem value="neutral">中性</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">共 {pagination.total} 篇文章</div>
          </div>
        </CardContent>
      </Card>

      {/* 文章列表 */}
      <div className="space-y-4">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getCategoryColor(article.feedCategory)}>{article.feedCategory}</Badge>
                    {article.sentiment && (
                      <Badge className={getSentimentColor(article.sentiment.overall)}>
                        <span className="flex items-center space-x-1">
                          {getSentimentIcon(article.sentiment.overall)}
                          <span>
                            {article.sentiment.overall === "positive"
                              ? "正面"
                              : article.sentiment.overall === "negative"
                                ? "负面"
                                : "中性"}
                          </span>
                        </span>
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg leading-tight mb-2">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      {article.title}
                    </a>
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDistanceToNow(new Date(article.publishedAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                    {article.author && (
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {article.author}
                      </span>
                    )}
                    <span className="text-blue-600">{article.feedTitle}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4 line-clamp-3">{article.summary}</p>

              {/* 关键词 */}
              {article.keywords.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {article.keywords.slice(0, 5).map((keyword) => (
                      <Badge key={keyword.word} variant="outline" className="text-xs">
                        {keyword.word}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 股票提及 */}
              {article.stockMentions.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">相关股票:</p>
                  <div className="flex flex-wrap gap-2">
                    {article.stockMentions.map((stock) => (
                      <Badge key={stock.symbol} variant="secondary" className="bg-blue-50 text-blue-700">
                        {stock.symbol} - {stock.name}
                        <span className="ml-1 text-xs">({Math.round(stock.relevance * 100)}%)</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 情感分析详情 */}
              {article.sentiment && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">情感分析:</p>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-green-600">正面: </span>
                      <span>{Math.round(article.sentiment.positiveScore * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-red-600">负面: </span>
                      <span>{Math.round(article.sentiment.negativeScore * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">中性: </span>
                      <span>{Math.round(article.sentiment.neutralScore * 100)}%</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    置信度: {Math.round(article.sentiment.confidence * 100)}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 加载更多 */}
      {pagination.hasMore && (
        <div className="text-center">
          <Button onClick={loadMore} variant="outline">
            加载更多文章
          </Button>
        </div>
      )}

      {filteredArticles.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">暂无文章数据</p>
            <p className="text-sm text-gray-500 mt-2">请先添加RSS订阅源或刷新现有订阅</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
