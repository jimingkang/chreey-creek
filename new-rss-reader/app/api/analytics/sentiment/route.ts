import { type NextRequest, NextResponse } from "next/server"
import { SentimentService } from "@/lib/sentiment-service"

const sentimentService = new SentimentService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")

    const trends = await sentimentService.getSentimentTrends(days)

    return NextResponse.json({
      success: true,
      trends,
      period: `${days} days`,
    })
  } catch (error) {
    console.error("Error fetching sentiment trends:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch sentiment trends" }, { status: 500 })
  }
}
