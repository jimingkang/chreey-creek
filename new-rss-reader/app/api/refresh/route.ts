import { NextResponse } from "next/server"
import { RSSService } from "@/lib/rss-service"

const rssService = new RSSService()

export async function POST() {
  try {
    const results = await rssService.refreshAllFeeds()

    const successCount = results.filter((r) => r.success).length
    const totalNewArticles = results.reduce((sum, r) => sum + (r.newArticles || 0), 0)

    return NextResponse.json({
      success: true,
      message: `Refreshed ${successCount}/${results.length} feeds`,
      totalNewArticles,
      results,
    })
  } catch (error) {
    console.error("Error refreshing feeds:", error)
    return NextResponse.json({ success: false, error: "Failed to refresh feeds" }, { status: 500 })
  }
}
