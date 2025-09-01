import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// 使用Vercel AI Gateway
const gateway = createOpenAI({
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY || 'vck_8Cd0aFXQatWaj3OKaWbrLDidPpdwkWYFOGKhPIAn7iFbwE5GhV3iuCCg',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});

export default async function handler(req, res) {
  // 处理CORS
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
    const { 
      image, 
      birthYear, 
      handType, 
      analysisType, 
      knowledgeBase = [] 
    } = req.body;

    if (!image || !birthYear || !handType || !analysisType) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    const prompt = generateAnalysisPrompt({
      image,
      birthYear,
      handType,
      analysisType,
      knowledgeBase
    }, age);

    // 使用Vercel AI SDK流式响应
    const result = await streamText({
      model: gateway('openai/gpt-4o-mini'),
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 流式输出
    for await (const delta of result.textStream) {
      res.write(delta);
    }
    
    res.end();

  } catch (error) {
    console.error('分析失败:', error);
    res.status(500).json({ 
      error: '分析过程中发生错误，请稍后重试',
      details: error.message 
    });
  }
}

function generateAnalysisPrompt(data, age) {
  const handTypeText = data.handType === 'dominant' ? '惯用手' : '非惯用手';
  const analysisTypeText = {
    'career': '事业财运',
    'love': '感情婚姻', 
    'health': '健康活力',
    'comprehensive': '综合分析'
  }[data.analysisType];

  // 添加知识库内容
  let knowledgeContent = '';
  if (data.knowledgeBase && data.knowledgeBase.length > 0) {
    knowledgeContent = '\n\n[专业知识库参考]\n以下是相关的专业手相学知识：\n\n';
    
    data.knowledgeBase.forEach((item, index) => {
      knowledgeContent += `${index + 1}. ${item.title}\n${item.content}\n---\n\n`;
    });
  }

  return `你是专业的AI手相分析师。请分析这位${age}岁用户的${handTypeText}照片，进行${analysisTypeText}分析。

${knowledgeContent}

请按以下格式输出报告：

## 🌟 开场白
以温暖的语气开场

## 💫 核心特质总结  
简要概括性格特点

## 🎯 ${analysisTypeText}深度分析
- **当前状况**: 基于掌纹分析
- **潜在优势**: 内在潜能分析
- **可能挑战**: 需注意的问题

## 💡 核心建议
2-3条具体可行的建议

## 🌈 结语
鼓励性的结束语

图片: ${data.image}`;
}