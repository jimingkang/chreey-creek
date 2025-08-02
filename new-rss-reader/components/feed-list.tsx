"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Rss, Calendar, Hash, Trash2, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Feed {
  id: string
  title: string
  url: string
  description: string
  category: string
  lastFetched: string | null
  articleCount: number
  recentArticles: Array<{
    id: string
    title: string
    publishedAt: string
    sentiment?: {
      overall: string
      score: number
      confidence: number
    }
  }>
}

interface FeedListProps {
  showManagement?: boolean
}

export function FeedList({ showManagement = false }: FeedListProps) {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null)

  useEffect(() => {
    fetchFeeds()
  }, [])

  const fetchFeeds = async () => {
    try {
      const response = await fetch("/api/feeds")
      if (response.ok) {
        const data = await response.json()
        setFeeds(data.feeds || [])
      }
    } catch (error) {
      console.error("Error fetching feeds:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteFeed = async (feedId: string) => {
    if (!confirm("确定要删除这个订阅源吗？")) return

    try {
      const response = await fetch(`/api/feeds/${feedId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFeeds(feeds.filter((feed) => feed.id !== feedId))
      } else {
        alert("删除失败")
      }
    } catch (error) {
      alert("删除失败，请检查网络连接")
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Rss className="h-5 w-5 mr-2" />
            订阅源
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showManagement) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>订阅源管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feeds.map((feed) => (
                <div key={feed.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{feed.title}</h3>
                        <Badge className={getCategoryColor(feed.category)}>{feed.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feed.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Hash className="h-3 w-3 mr-1" />
                          {feed.articleCount} 篇文章
                        </span>
                        {feed.lastFetched && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(feed.lastFetched), {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(feed.url, "_blank")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteFeed(feed.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Rss className="h-5 w-5 mr-2" />
          订阅源 ({feeds.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-3">
            {feeds.map((feed, index) => (
              <div key={feed.id}>
                <div
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFeed === feed.id ? "bg-blue-50 border-blue-200 border" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedFeed(selectedFeed === feed.id ? null : feed.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm line-clamp-2">{feed.title}</h3>
                    <Badge className={getCategoryColor(feed.category)} variant="secondary">
                      {feed.category}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{feed.articleCount} 篇</span>
                    {feed.lastFetched && (
                      <span>
                        {formatDistanceToNow(new Date(feed.lastFetched), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    )}
                  </div>

                  {selectedFeed === feed.id && feed.recentArticles.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <h4 className="text-xs font-medium text-gray-700">最新文章</h4>
                      {feed.recentArticles.slice(0, 3).map((article) => (
                        <div key={article.id} className="text-xs">
                          <div className="flex items-start justify-between">
                            <p className="line-clamp-2 text-gray-600 flex-1 mr-2">{article.title}</p>
                            {article.sentiment && (
                              <Badge className={getSentimentColor(article.sentiment.overall)} variant="secondary">
                                {article.sentiment.overall === "positive"
                                  ? "正面"
                                  : article.sentiment.overall === "negative"
                                    ? "负面"
                                    : "中性"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(article.publishedAt), {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {index < feeds.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
