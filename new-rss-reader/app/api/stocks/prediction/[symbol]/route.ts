import { type NextRequest, NextResponse } from "next/server"
import { StockAnalysisService } from "@/lib/stock-analysis-service"

const stockAnalysisService = new StockAnalysisService()

export async function GET(request: NextRequest,{ params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")

    const prediction = await stockAnalysisService.predictStockTrend(symbol.toUpperCase(), days)

    return NextResponse.json({
      success: true,
      prediction,
    })
  } catch (error) {
    console.error("Error predicting stock trend:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to predict stock trend",
      },
      { status: 500 },
    )
  }
}
