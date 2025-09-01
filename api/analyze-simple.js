// 手相知识库（从PDF提取的核心内容）
const PALM_KNOWLEDGE = `
手相基础知识：

1. 三大主线：
- 生命线：围绕拇指的弧形线，反映健康和生命力
- 智慧线：横穿手掌的线，反映思维和智慧
- 感情线：手掌上方的横线，反映情感和人际关系

2. 手型分析：
- 方形手：实用主义者，踏实可靠
- 圆锥形手：艺术天赋，感性敏锐
- 尖形手：理想主义，精神追求
- 铲形手：活力充沛，行动力强

3. 八大丘位：
- 金星丘：爱情和生命力
- 木星丘：领导力和野心
- 土星丘：责任感和耐力
- 太阳丘：创造力和名声
- 水星丘：沟通和商业才能
- 月亮丘：想象力和直觉
- 第一火星丘：勇气和行动力
- 第二火星丘：坚持和毅力

4. 特殊纹理：
- 星纹：好运的象征
- 岛纹：能量阻塞
- 十字纹：阻碍或转折
- 三角纹：才能的体现
- 方形纹：保护作用
`;

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
      gender
    } = req.body;

    if (!image || !birthYear || !handType || !gender) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const handTypeText = handType === 'dominant' ? '惯用手' : '非惯用手';
    const genderText = gender === 'male' ? '男性' : '女性';

    const prompt = `你是专业的AI手相分析师。请为这位${age}岁${genderText}用户分析${handTypeText}照片。

${PALM_KNOWLEDGE}

请严格按照以下框架分析：

1. **图片验证**: 确认这是清晰的手掌照片
2. **手型分析**: 观察手型特征
3. **主要掌纹**: 分析三大主线
4. **丘位特征**: 观察相关丘位
5. **综合解读**: 基于年龄性别特点

输出格式：

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

请使用温暖专业的语气。`;

    // 使用DeepSeek API作为备选（更稳定）
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-92d8f5c911e64cbaa87f99f76a9911af'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API错误:', response.status, errorText);
      throw new Error(`AI分析失败: ${response.status}`);
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