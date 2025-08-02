import { type NextRequest, NextResponse } from "next/server"
import { StockAnalysisService } from "@/lib/stock-analysis-service"

const stockAnalysisService = new StockAnalysisService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")

    const marketData = await stockAnalysisService.getMarketSentimentAnalysis(days)

    return NextResponse.json({
      success: true,
      marketData,
      period: `${days} days`,
    })
  } catch (error) {
    console.error("Error fetching market sentiment:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch market sentiment analysis",
      },
      { status: 500 },
    )
  }
}
