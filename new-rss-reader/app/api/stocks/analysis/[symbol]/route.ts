import { type NextRequest, NextResponse } from "next/server"
import { StockAnalysisService } from "@/lib/stock-analysis-service"

const stockAnalysisService = new StockAnalysisService()

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    const analysis = await stockAnalysisService.getStockAnalysis(symbol.toUpperCase(), days)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error("Error fetching stock analysis:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch stock analysis",
      },
      { status: 500 },
    )
  }
}
