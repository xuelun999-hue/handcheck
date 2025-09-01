# 手相知识库设置指南

## 📋 准备工作

### 1. 创建Supabase项目
1. 访问 [Supabase官网](https://supabase.com)
2. 注册账号并创建新项目
3. 记录项目URL和API密钥

### 2. 获取OpenAI API密钥
1. 访问 [OpenAI官网](https://platform.openai.com)
2. 注册账号并获取API密钥
3. 确保账号有足够余额

## 🛠️ 设置步骤

### 步骤1: 配置数据库

在Supabase Dashboard的SQL Editor中执行：
```bash
# 复制粘贴 supabase_setup.sql 的内容并执行
```

### 步骤2: 安装依赖

```bash
# 在项目目录中运行
npm install
```

### 步骤3: 配置密钥

编辑 `knowledge_config.js`：
```javascript
const KNOWLEDGE_CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here',
    OPENAI_API_KEY: 'sk-your-openai-key-here'
};
```

### 步骤4: 准备文档

1. 创建 `docs` 目录
2. 将您的手相知识库文档放入该目录
3. 支持格式：`.txt`, `.md`, `.doc`

```
手相網/
├── docs/
│   ├── 生命线详解.txt
│   ├── 感情线分析.md
│   ├── 事业线解读.txt
│   └── 八大丘位.md
├── process_knowledge.js
└── ...
```

### 步骤5: 处理文档

```bash
# 运行知识库处理脚本
npm run process
```

脚本会自动：
- 📄 读取docs目录下的所有文档
- ✂️ 智能分段（每段约800字，有重叠）
- 🏷️ 自动分类和标记关键词  
- 🧠 生成向量嵌入（使用OpenAI）
- 💾 批量上传到Supabase

## 📊 文档分段策略

**智能分段原则：**
- **最大长度**：800字符/段
- **重叠区域**：100字符（确保上下文连贯）
- **分段优先级**：段落 → 句子 → 标点符号
- **最小长度**：过滤少于50字符的片段

**自动分类系统：**
```
palm_lines   - 掌纹线条（生命线、智慧线、感情线等）
mounts       - 八大丘位（金星丘、木星丘等）
signs        - 特殊符号（星纹、岛纹、十字纹等）
health       - 健康相关知识
career       - 事业财运知识  
love         - 感情婚姻知识
general      - 通用知识
```

## 🔍 搜索功能

**向量搜索：** 基于语义相似度
**关键词搜索：** 基于中文全文索引
**混合搜索：** 结合向量和关键词（推荐）

## 📝 文档建议格式

为了最佳效果，建议您的doc文档按以下格式组织：

```markdown
# 生命线详解

## 基本概念
生命线是手掌中最重要的三大主线之一...

## 形态分析
### 长短意义
- 生命线长：体质强健，生命力旺盛
- 生命线短：需要注意健康保养

### 深浅分析  
- 深而清晰：身体健康，精力充沛
- 浅而模糊：体质较弱，容易疲劳

## 特殊符号
### 岛纹
出现在生命线上的岛纹通常表示...

### 断裂
生命线断裂可能表示...
```

## ⚠️ 注意事项

1. **API配额**：OpenAI向量嵌入有使用限制
2. **处理时间**：大文档可能需要较长时间
3. **成本控制**：建议先用小文档测试
4. **编码格式**：确保文档为UTF-8编码

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置密钥（编辑knowledge_config.js）

# 3. 准备文档（放入docs目录）

# 4. 处理文档
npm run process

# 5. 测试搜索
npm run test-search
```

完成后，您的手相分析应用将具备专业的知识库支持！