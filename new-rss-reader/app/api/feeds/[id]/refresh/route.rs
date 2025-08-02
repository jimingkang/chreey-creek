import { type NextRequest, NextResponse } from "next/server"
import { RSSService } from "@/lib/rss-service"

const rssService = new RSSService()

export async function POST(request: NextRequest,{ params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { id } = await params

    const result = await rssService.refreshFeed(id)

    return NextResponse.json({
      success: true,
      message: `Refreshed feed: ${result.feed.title}`,
      newArticles: result.newArticlesCount,
    })
  } catch (error) {
    console.error("Error refreshing feed:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to refresh feed" },
      { status: 500 },
    )
  }
}
