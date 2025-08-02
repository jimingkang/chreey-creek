import { Suspense } from "react"
import { FeedList } from "@/components/feed-list"
import { ArticleGrid } from "@/components/article-grid"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { StockAnalysisDashboard } from "@/components/stock-analysis-dashboard"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">智能RSS阅读器</h1>
          <p className="text-lg text-gray-600">基于AI的新闻聚合、情感分析和股票关联分析平台</p>
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="articles">文章阅读</TabsTrigger>
            <TabsTrigger value="feeds">订阅管理</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
            <TabsTrigger value="stocks">股票关联</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Suspense fallback={<LoadingSkeleton />}>
                  <FeedList />
                </Suspense>
              </div>
              <div className="lg:col-span-3">
                <Suspense fallback={<LoadingSkeleton />}>
                  <ArticleGrid />
                </Suspense>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feeds">
            <Suspense fallback={<LoadingSkeleton />}>
              <FeedList showManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics">
            <Suspense fallback={<LoadingSkeleton />}>
              <AnalyticsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="stocks">
            <Suspense fallback={<LoadingSkeleton />}>
              <StockAnalysisDashboard />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
