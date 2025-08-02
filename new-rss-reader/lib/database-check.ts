import { prisma } from "./prisma"

export async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log("✅ 数据库连接成功")
    return true
  } catch (error) {
    console.error("❌ 数据库连接失败:", error)
    return false
  }
}

export async function initializeDatabase() {
  try {
    // 检查是否有任何表
    const feedCount = await prisma.feed.count().catch(() => 0)
    console.log(`📊 当前数据库中有 ${feedCount} 个订阅源`)

    return true
  } catch (error) {
    console.error("❌ 数据库初始化检查失败:", error)
    throw new Error("数据库未正确初始化，请运行 npm run db:push")
  }
}
