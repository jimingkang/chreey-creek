"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Rss, Plus, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Header() {
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false)
  const [feedUrl, setFeedUrl] = useState("")
  const [feedTitle, setFeedTitle] = useState("")
  const [feedCategory, setFeedCategory] = useState("general")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleAddFeed = async () => {
    if (!feedUrl.trim()) return

    try {
      const response = await fetch("/api/feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: feedUrl,
          title: feedTitle || undefined,
          category: feedCategory,
        }),
      })

      if (response.ok) {
        setFeedUrl("")
        setFeedTitle("")
        setFeedCategory("general")
        setIsAddFeedOpen(false)
        // Refresh the page to show new feed
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`添加失败: ${error.error}`)
      }
    } catch (error) {
      alert("添加失败，请检查网络连接")
    }
  }

  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        alert(`刷新完成: ${result.message}`)
        window.location.reload()
      } else {
        alert("刷新失败")
      }
    } catch (error) {
      alert("刷新失败，请检查网络连接")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Rss className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">智能RSS阅读器</h1>
                <p className="text-sm text-gray-600">AI驱动的新闻分析平台</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Dialog open={isAddFeedOpen} onOpenChange={setIsAddFeedOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  添加订阅
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加RSS订阅</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="url">RSS URL *</Label>
                    <Input
                      id="url"
                      placeholder="https://example.com/rss.xml"
                      value={feedUrl}
                      onChange={(e) => setFeedUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">标题 (可选)</Label>
                    <Input
                      id="title"
                      placeholder="自定义订阅源名称"
                      value={feedTitle}
                      onChange={(e) => setFeedTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">分类</Label>
                    <Select value={feedCategory} onValueChange={setFeedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">综合</SelectItem>
                        <SelectItem value="technology">科技</SelectItem>
                        <SelectItem value="business">商业</SelectItem>
                        <SelectItem value="finance">金融</SelectItem>
                        <SelectItem value="sports">体育</SelectItem>
                        <SelectItem value="entertainment">娱乐</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddFeedOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleAddFeed}>添加</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "刷新中..." : "刷新全部"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
