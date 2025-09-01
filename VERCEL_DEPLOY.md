# Vercel部署指南

## 🚀 Vercel + Supabase 混合方案优势

- ✅ **Vercel**: 全球CDN，极速访问
- ✅ **Supabase**: 专业向量数据库，智能知识检索
- ✅ **完全免费**: 两个平台免费额度都很充足
- ✅ **自动扩容**: 无需担心服务器管理

## 📋 部署步骤

### 步骤1: 准备Supabase项目

1. 访问 [Supabase官网](https://supabase.com) 创建项目
2. 在SQL Editor中执行 `supabase_setup.sql`
3. 记录项目URL和API密钥

### 步骤2: 处理知识库文档

```bash
# 安装依赖
npm install

# 配置密钥（编辑config.js中的Supabase和OpenAI配置）

# 创建docs目录并放入手相知识文档
mkdir docs
# 将您的.txt/.md文档放入docs目录

# 处理文档并上传到Supabase
npm run process-knowledge
```

### 步骤3: 部署到Vercel

```bash
# 方法1: 使用Vercel CLI
npm install -g vercel
vercel login
vercel

# 方法2: 使用GitHub集成
# 1. 将代码推送到GitHub
# 2. 在Vercel Dashboard中导入GitHub仓库
# 3. 设置环境变量
```

### 步骤4: 配置环境变量

在Vercel Dashboard的Settings > Environment Variables中添加：

```
GEMINI_API_KEY=your-google-gemini-api-key
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
OPENAI_API_KEY=sk-your-openai-key
```

## 📁 项目结构

```
手相網/
├── index.html              # 主应用页面
├── config.js               # 配置文件
├── vercel.json            # Vercel配置
├── package.json           # 项目依赖
├── .env.example          # 环境变量示例
├── api/                  # Vercel API路由
│   └── analyze.js        # AI分析API（支持流式响应）
├── docs/                 # 知识库文档目录
│   └── 手相知识大全(手相全解).pdf
├── scripts/              # 脚本目录
│   └── process_knowledge.js
└── supabase_setup.sql    # 数据库初始化脚本
```

## 🔧 工作流程

1. **本地开发**: `vercel dev` 启动开发服务器
2. **知识库更新**: 修改docs文档后运行 `npm run process-knowledge`
3. **部署**: `vercel --prod` 部署到生产环境

## 📊 成本估算

| 服务 | 免费额度 | 超出费用 |
|------|----------|----------|
| **Vercel** | 100GB带宽/月 | $20/100GB |
| **Supabase** | 2GB数据库 | $25/月 |
| **OpenAI** | 需付费 | $0.0001/1K tokens |

预估月成本：$5-15（取决于使用量）

## ⚡ 性能优化

- **CDN缓存**: Vercel自动优化静态资源
- **向量索引**: Supabase提供毫秒级搜索
- **懒加载**: 知识库仅在需要时加载
- **批量查询**: 减少API调用次数

## 🛡️ 安全考虑

- ✅ API密钥通过环境变量管理
- ✅ HTTPS强制加密传输
- ✅ 行级安全策略(RLS)
- ✅ CORS和安全头配置

## 🎯 下一步

1. 完成Supabase配置
2. 准备手相知识文档
3. 部署到Vercel
4. 测试知识库增强功能

部署完成后，您将拥有一个专业级的AI手相分析平台！