import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { analysisType, handType, age } = req.body;

    if (!analysisType || !handType || !age) {
      return res.status(400).json({ error: '缺少搜索参数' });
    }

    // 生成搜索查询
    const queries = generateSearchQueries(analysisType, handType, age);
    const allResults = [];

    for (const { query, category } of queries) {
      try {
        // 生成查询向量
        const embedding = await generateEmbedding(query);
        if (!embedding) continue;

        // 搜索知识库
        const { data, error } = await supabase.rpc('search_palm_knowledge', {
          query_embedding: embedding,
          match_threshold: 0.75,
          match_count: 3,
          filter_category: category
        });

        if (!error && data) {
          allResults.push(...data);
        }
      } catch (error) {
        console.error('搜索出错:', error);
      }
    }

    // 去重并返回结果
    const deduplicatedResults = deduplicateResults(allResults).slice(0, 5);
    
    res.status(200).json({ 
      results: deduplicatedResults,
      count: deduplicatedResults.length
    });

  } catch (error) {
    console.error('知识库搜索失败:', error);
    res.status(500).json({ 
      error: '知识库搜索失败',
      details: error.message 
    });
  }
}

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('生成向量嵌入失败:', error);
    return null;
  }
}

function generateSearchQueries(analysisType, handType, age) {
  const queries = [];
  
  switch (analysisType) {
    case 'career':
      queries.push(
        { query: '事业线 工作 职业发展', category: 'career' },
        { query: '成功线 太阳线 事业成就', category: 'palm_lines' },
        { query: '木星丘 领导力 企图心', category: 'mounts' }
      );
      break;
    case 'love':
      queries.push(
        { query: '感情线 婚姻线 爱情', category: 'love' },
        { query: '金星丘 感情丰富', category: 'mounts' },
        { query: '月亮丘 情感敏感', category: 'mounts' }
      );
      break;
    case 'health':
      queries.push(
        { query: '生命线 健康 体质', category: 'health' },
        { query: '健康线 身体状况', category: 'palm_lines' },
        { query: '金星丘 生命力', category: 'mounts' }
      );
      break;
    case 'comprehensive':
      queries.push(
        { query: '生命线 智慧线 感情线', category: 'palm_lines' },
        { query: '八大丘位 性格特征', category: 'mounts' },
        { query: '特殊符号 星纹 岛纹', category: 'signs' }
      );
      break;
  }
  
  // 添加年龄相关查询
  if (age < 30) {
    queries.push({ query: '年轻人 潜力 发展', category: null });
  } else if (age < 50) {
    queries.push({ query: '中年 事业 家庭', category: null });
  } else {
    queries.push({ query: '成熟 智慧 经验', category: null });
  }
  
  return queries;
}

function deduplicateResults(results) {
  const seen = new Set();
  return results
    .filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
}