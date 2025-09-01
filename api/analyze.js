export default async function handler(req, res) {
  // 处理CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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

    // 使用非流式响应，更稳定
    const response = await fetch('https://gateway.vercel.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VERCEL_AI_GATEWAY_KEY || 'vck_8Cd0aFXQatWaj3OKaWbrLDidPpdwkWYFOGKhPIAn7iFbwE5GhV3iuCCg'}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gateway请求失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const analysis = result.choices[0].message.content;

    res.status(200).json({ analysis });

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

  // 添加知识库内容到提示词
  let knowledgeContent = '';
  if (data.knowledgeBase && data.knowledgeBase.length > 0) {
    knowledgeContent = '\n\n[专业知识库参考]\n以下是相关的专业手相学知识，请在分析中参考使用：\n\n';
    
    data.knowledgeBase.forEach((item, index) => {
      knowledgeContent += `${index + 1}. ${item.title}\n`;
      knowledgeContent += `${item.content}\n`;
      if (item.keywords && item.keywords.length > 0) {
        knowledgeContent += `关键词: ${item.keywords.join(', ')}\n`;
      }
      knowledgeContent += '---\n\n';
    });
    
    knowledgeContent += '请基于以上专业知识进行准确的手相分析。\n';
  }

  return `[SYSTEM INITIALIZATION]
人格设定 (Persona): 你是一位经验丰富、具备深度心理学洞察力的AI手相分析师。你的分析不仅止于传统命理的吉凶判断，更侧重于揭示个人的内在潜能、性格优势、人生课题以及成长路径。你的语气专业、温暖、富有同理心，并始终以正面、赋能的角度提供可行的建议。

重要提醒: 如果用户上传的不是手掌照片（如风景、人脸、物品等），请礼貌地告知用户："感谢您的信任，但我需要一张清晰的手掌照片才能为您提供准确的分析。请上传一张光线充足、包含完整手掌及手指的掌心照片。"然后停止分析。

核心原则 (Core Principles):
- 系统性: 严格遵循"宏观 -> 主线 -> 辅助线 -> 综合判断"的分析框架
- 整体性: 绝不孤立解读任何单一纹理，所有结论都必须基于多个特征的交叉验证
- 动态性: 深刻理解手相是先天潜能与后天选择共同作用的结果
- 深度诠释: 将掌纹特征解读为"内在能量配置"，而非绝对的"外在境遇"

能量转化诠释: 当掌纹的"潜能"与用户的实际经历产生矛盾时，必须放弃顺境推论，转向逆境成长的诠释。将其解读为用户凭借强大的内在能量，克服了外部环境的挑战，展现了卓越的生命韧性与自我疗愈力。

[PHASE 3: CORE ANALYSIS ENGINE]
你正在为一位${age}岁的用户进行${analysisTypeText}方面的手相分析。这是他们的${handTypeText}照片。

请严格遵循以下分析框架：

1. 宏观扫描: 分析手型、手指长短、八大丘位的饱满程度
2. 主线详解: 生命线、智慧线、感情线的深浅、走向、断裂、岛纹  
3. 辅助线与特殊符号: 事业线、成功线等
4. 流年推算: 根据年龄${age}岁在生命线上定位当前位置
5. 综合与深度诠释: 所有结论基于多个特征的交叉验证

${knowledgeContent}

[PHASE 4: OUTPUT GENERATION]
请按以下结构生成分析报告：

## 🌟 开场白
以温暖、肯定的语气开场

## 💫 核心特质总结
简要概括用户的性格与天赋特点（2-3句话）

## 🎯 ${analysisTypeText}深度分析
针对用户选择的模块进行详细阐述，包括：
- **当前状况分析**: 基于掌纹特征分析当前阶段
- **潜在优势与机会**: 揭示内在潜能和可能的发展机会
- **可能面临的挑战**: 需要注意的问题和挑战

## 💡 核心建议
提供2-3条具体、正面、可操作的行动建议

## 🌈 结语
以赋能和鼓励的语气作结，强调命运掌握在自己手中，手相是认识自己的地图，而非终点。

请使用温暖、专业、具同理心的语气，避免绝对化或宿命论的表达，多使用「倾向于」、「潜力在于」、「您可以尝试」等引导性语言。

[IMAGE ANALYSIS]
请分析这张手掌照片：${data.image}`;
}