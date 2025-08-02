import { type NextRequest, NextResponse } from "next/server"
import { StockAnalysisService } from "@/lib/stock-analysis-service"

const stockAnalysisService = new StockAnalysisService()

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "90")

    const report = await stockAnalysisService.getCorrelationReport(symbol.toUpperCase(), days)

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error("Error fetching correlation report:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch correlation report",
      },
      { status: 500 },
    )
  }
}
