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
    console.log('=== API 调用开始 ===');
    console.log('请求方法:', req.method);
    console.log('请求头:', req.headers);
    
    const body = req.body;
    console.log('请求体:', body);

    const { 
      image, 
      birthYear, 
      handType, 
      gender
    } = body;

    console.log('参数检查:', {
      hasImage: !!image,
      birthYear,
      handType,
      gender
    });

    if (!image || !birthYear || !handType || !gender) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 使用DeepSeek进行真实AI分析
    const age = new Date().getFullYear() - birthYear;
    const handTypeText = handType === 'dominant' ? '惯用手' : '非惯用手';
    const genderText = gender === 'male' ? '男性' : '女性';

    const prompt = `你是专业的AI手相分析师。请为这位${age}岁${genderText}用户分析${handTypeText}的手掌照片。

手相基础知识参考：
- 生命线：围绕拇指的弧形线，反映健康和生命力
- 智慧线：横穿手掌的线，反映思维和智慧  
- 感情线：手掌上方的横线，反映情感和人际关系
- 手型：方形手(实用)、圆锥形手(艺术)、尖形手(理想)、铲形手(活力)
- 八大丘位：金星丘(爱情)、木星丘(领导)、土星丘(责任)、太阳丘(创造)等

请严格按照以下格式输出：

## 🌟 开场白
温暖的问候

## 💫 手相特征观察
描述观察到的主要特征

## 🎯 综合分析
- **性格特质**: 基于掌纹的性格分析
- **事业运势**: 工作和事业潜力
- **感情状况**: 情感和人际关系
- **健康活力**: 生命力和健康

## 💡 人生建议
2-3条具体建议

## 🌈 结语
正面鼓励

请使用温暖专业的语气，避免宿命论表达。`;

    console.log('准备调用Vercel AI Gateway...');

    // 使用您的AI Gateway
    const gatewayKey = process.env.VERCEL_AI_GATEWAY_KEY || 'vck_8Cd0aFXQatWaj3OKaWbrLDidPpdwkWYFOGKhPIAn7iFbwE5GhV3iuCCg';
    
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
        max_tokens: 1500
      })
    });

    console.log('AI Gateway响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway错误:', errorText);
      throw new Error(`AI Gateway分析失败: ${response.status}`);
    }

    const result = await response.json();
    const analysis = result.choices[0].message.content;

    console.log('=== 分析完成 ===');
    res.status(200).json({ analysis });

  } catch (error) {
    console.error('=== API错误 ===', error);
    res.status(500).json({ 
      error: '分析过程中发生错误',
      details: error.message,
      stack: error.stack 
    });
  }
}