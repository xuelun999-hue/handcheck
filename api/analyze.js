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
    console.log('API调用开始，请求数据:', req.body);

    const { 
      image, 
      birthYear, 
      handType, 
      gender
    } = req.body;

    if (!image || !birthYear || !handType || !gender) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 检查环境变量
    const gatewayKey = process.env.VERCEL_AI_GATEWAY_KEY;
    console.log('Gateway Key存在:', !!gatewayKey);
    
    if (!gatewayKey) {
      throw new Error('VERCEL_AI_GATEWAY_KEY环境变量未设置');
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    const prompt = generateAnalysisPrompt({
      birthYear,
      handType,
      gender
    }, age);

    console.log('准备调用AI Gateway...');

    // 使用更简单的文本分析（暂时不用图片）
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt + '\n\n注意：由于技术限制，请基于用户提供的信息（年龄、性别、手部类型）进行通用手相分析。'
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    console.log('AI Gateway响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway错误:', response.status, errorText);
      throw new Error(`AI Gateway失败: ${response.status}`);
    }

    const result = await response.json();
    const analysis = result.choices[0].message.content;

    console.log('分析成功完成');
    res.status(200).json({ analysis });

  } catch (error) {
    console.error('分析失败详情:', error);
    res.status(500).json({ 
      error: '分析过程中发生错误，请稍后重试',
      details: error.message 
    });
  }
}

function generateAnalysisPrompt(data, age) {
  const handTypeText = data.handType === 'dominant' ? '惯用手' : '非惯用手';
  const genderText = data.gender === 'male' ? '男性' : '女性';

  return `你是专业的AI手相分析师。请为这位${age}岁${genderText}用户分析${handTypeText}照片。

请严格按照以下框架进行分析：

1. **图片验证**: 确认这是清晰的手掌照片
2. **手型分析**: 观察手型、手指长短比例
3. **主要掌纹**: 分析生命线、智慧线、感情线
4. **丘位特征**: 观察八大丘位的饱满程度
5. **综合解读**: 基于年龄和性别特点进行个性化分析

输出格式：

## 🌟 开场白
温暖的问候

## 💫 手相特征总结
简要描述观察到的主要特征

## 🎯 综合分析
- **性格特质**: 基于掌纹的性格分析
- **事业运势**: 工作和事业方面的潜力
- **感情婚姻**: 情感和人际关系特点
- **健康活力**: 生命力和健康状况

## 💡 人生建议
2-3条具体可行的建议

## 🌈 结语
正面鼓励的结束语

请使用温暖、专业的语气，避免宿命论表达。`;
}