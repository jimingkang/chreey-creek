import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.feed.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Feed deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting feed:", error)
    return NextResponse.json({ success: false, error: "Failed to delete feed" }, { status: 500 })
  }
}
