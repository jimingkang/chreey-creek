# 智能RSS阅读器

基于Next.js 15和OpenAI的智能RSS阅读器，具备情感分析和股票关联功能。

## 🚀 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 环境配置

复制环境变量模板：
\`\`\`bash
cp .env.example .env
\`\`\`

编辑 `.env` 文件，填入以下信息：
- `DATABASE_URL`: PostgreSQL数据库连接字符串
- `OPENAI_API_KEY`: OpenAI API密钥

### 3. 数据库设置

\`\`\`bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库架构
npm run db:push

# 填充种子数据（可选）
npm run db:seed
\`\`\`

### 4. 启动应用

\`\`\`bash
npm run dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📊 功能特性

### 核心功能
- **RSS订阅管理**: 添加、删除、管理RSS订阅源
- **智能文章解析**: 自动解析RSS内容并提取关键信息
- **情感分析**: 使用OpenAI API进行深度情感分析
- **股票关联**: 自动识别文章中的股票提及并分析相关性
- **数据可视化**: 丰富的图表和统计面板

### AI功能
- **多维度情感分析**: 整体情感、市场影响、情绪基调
- **智能关键词提取**: AI驱动的关键词和实体识别
- **股票影响评估**: 评估新闻对股票的潜在影响
- **自动内容摘要**: AI生成的文章摘要

### 技术栈
- **前端**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Lucide Icons
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: PostgreSQL
- **AI**: OpenAI GPT-4
- **其他**: RSS Parser, Date-fns

## 🛠️ 开发命令

\`\`\`bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 数据库相关
npm run db:generate    # 生成Prisma客户端
npm run db:push        # 推送数据库架构
npm run db:migrate     # 创建数据库迁移
npm run db:studio      # 打开Prisma Studio
npm run db:seed        # 填充种子数据
npm run db:reset       # 重置数据库
\`\`\`

## 📁 项目结构

\`\`\`
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React组件
│   ├── ui/               # shadcn/ui组件
│   ├── analytics-dashboard.tsx
│   ├── article-grid.tsx
│   ├── feed-list.tsx
│   └── header.tsx
├── lib/                   # 工具库
│   ├── prisma.ts         # Prisma客户端
│   ├── rss-service.ts    # RSS服务
│   ├── sentiment-service.ts # 情感分析服务
│   └── stock-service.ts  # 股票服务
├── prisma/               # 数据库
│   ├── schema.prisma     # 数据库架构
│   └── seed.ts           # 种子数据
└── README.md
\`\`\`

## 🔧 配置说明

### 数据库配置
支持PostgreSQL数据库，推荐使用：
- [Neon](https://neon.tech/) - 无服务器PostgreSQL
- [Supabase](https://supabase.com/) - 开源Firebase替代品
- [Railway](https://railway.app/) - 简单的云部署平台

### OpenAI配置
需要OpenAI API密钥来启用AI功能：
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 创建API密钥
3. 将密钥添加到 `.env` 文件

## 🚀 部署

### Vercel部署（推荐）
1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署完成

### 其他平台
- **Railway**: 支持PostgreSQL和自动部署
- **Netlify**: 需要配置数据库
- **Docker**: 提供Dockerfile进行容器化部署

## 📝 使用说明

### 添加RSS订阅
1. 点击"添加订阅"按钮
2. 输入RSS URL
3. 选择分类（可选）
4. 点击添加

### 查看分析结果
1. 切换到"数据分析"标签
2. 选择时间范围
3. 查看情感趋势和股票分析

### 管理订阅源
1. 切换到"订阅管理"标签
2. 查看所有订阅源
3. 删除不需要的订阅

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License
\`\`\`

现在请按以下步骤操作：

## 🔧 解决步骤

### 1. 重新安装依赖
\`\`\`bash
# 清理旧的依赖
rm -rf node_modules package-lock.json

# 重新安装
npm install
\`\`\`

### 2. 使用npm scripts（推荐）
\`\`\`bash
# 使用npm scripts，不需要全局安装prisma
npm run db:generate
npm run db:push
\`\`\`

### 3. 或者全局安装Prisma CLI
\`\`\`bash
# 全局安装Prisma CLI
npm install -g prisma

# 然后可以直接使用
prisma generate
prisma db push
\`\`\`

### 4. 设置环境变量
\`\`\`bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，添加数据库URL和OpenAI API密钥
\`\`\`

### 5. 初始化数据库
\`\`\`bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库架构到数据库
npm run db:push

# 可选：添加种子数据
npm run db:seed
\`\`\`

### 6. 启动应用
\`\`\`bash
npm run dev
\`\`\`

## 🎯 主要改进

1. **添加了npm scripts**: 使用`npx`前缀，无需全局安装
2. **添加了postinstall钩子**: 安装依赖后自动生成Prisma客户端
3. **创建了种子数据**: 包含示例RSS源和股票数据
4. **完善的README**: 详细的安装和使用说明
5. **环境变量模板**: 方便配置必要的环境变量

现在您可以使用`npm run db:generate`而不是直接的`prisma generate`命令了！
