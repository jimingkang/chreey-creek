import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 开始数据库种子数据...")

  // 创建示例RSS订阅源
  const feeds = await Promise.all([
    prisma.feed.upsert({
      where: { url: "http://rss.cnn.com/rss/cnn_topstories.rss" },
      update: {},
      create: {
        title: "CNN Top Stories",
        url: "http://rss.cnn.com/rss/cnn_topstories.rss",
        description:
          "CNN.com delivers the latest breaking news and information on the latest top stories, weather, business, entertainment, politics, and more.",
        category: "general",
        language: "en",
      },
    }),
    prisma.feed.upsert({
      where: { url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
      update: {},
      create: {
        title: "BBC World News",
        url: "https://feeds.bbci.co.uk/news/world/rss.xml",
        description: "BBC News - World",
        category: "general",
        language: "en",
      },
    }),
    prisma.feed.upsert({
      where: { url: "https://techcrunch.com/feed/" },
      update: {},
      create: {
        title: "TechCrunch",
        url: "https://techcrunch.com/feed/",
        description:
          "TechCrunch is a leading technology media property, dedicated to obsessively profiling startups, reviewing new Internet products, and breaking tech news.",
        category: "technology",
        language: "en",
      },
    }),
    prisma.feed.upsert({
      where: { url: "https://feeds.finance.yahoo.com/rss/2.0/headline" },
      update: {},
      create: {
        title: "Yahoo Finance",
        url: "https://feeds.finance.yahoo.com/rss/2.0/headline",
        description: "Yahoo Finance - Business News, Personal Finance, Market Data",
        category: "finance",
        language: "en",
      },
    }),
  ])

  // 创建示例股票数据
  const stocks = await Promise.all([
    prisma.stock.upsert({
      where: { symbol: "AAPL" },
      update: {},
      create: {
        symbol: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        sector: "Technology",
        industry: "Consumer Electronics",
      },
    }),
    prisma.stock.upsert({
      where: { symbol: "GOOGL" },
      update: {},
      create: {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        exchange: "NASDAQ",
        sector: "Technology",
        industry: "Internet Content & Information",
      },
    }),
    prisma.stock.upsert({
      where: { symbol: "MSFT" },
      update: {},
      create: {
        symbol: "MSFT",
        name: "Microsoft Corporation",
        exchange: "NASDAQ",
        sector: "Technology",
        industry: "Software",
      },
    }),
    prisma.stock.upsert({
      where: { symbol: "TSLA" },
      update: {},
      create: {
        symbol: "TSLA",
        name: "Tesla Inc.",
        exchange: "NASDAQ",
        sector: "Consumer Cyclical",
        industry: "Auto Manufacturers",
      },
    }),
    prisma.stock.upsert({
      where: { symbol: "NVDA" },
      update: {},
      create: {
        symbol: "NVDA",
        name: "NVIDIA Corporation",
        exchange: "NASDAQ",
        sector: "Technology",
        industry: "Semiconductors",
      },
    }),
  ])

  console.log("✅ 种子数据创建完成!")
  console.log(`📊 创建了 ${feeds.length} 个RSS订阅源`)
  console.log(`📈 创建了 ${stocks.length} 个股票记录`)
}

main()
  .catch((e) => {
    console.error("❌ 种子数据创建失败:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
