import { type NextRequest, NextResponse } from "next/server"
import { StockService } from "@/lib/stock-service"

const stockService = new StockService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const topStocks = await stockService.getTopMentionedStocks(days, limit)

    return NextResponse.json({
      success: true,
      stocks: topStocks,
      period: `${days} days`,
    })
  } catch (error) {
    console.error("Error fetching stock analytics:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch stock analytics" }, { status: 500 })
  }
}
