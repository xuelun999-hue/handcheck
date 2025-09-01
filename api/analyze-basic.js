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

    // 直接返回模拟分析，不调用外部API
    const age = new Date().getFullYear() - birthYear;
    const handTypeText = handType === 'dominant' ? '惯用手' : '非惯用手';
    const genderText = gender === 'male' ? '男性' : '女性';

    const mockAnalysis = `## 🌟 开场白
感谢您使用AI手相分析师！您是一位${age}岁的${genderText}，我将为您分析${handTypeText}的手相特征。

## 💫 手相特征观察
根据您上传的手掌照片，我观察到以下特征：
- 手型整体比例匀称
- 主要掌纹清晰可见
- 各丘位发育正常

## 🎯 综合分析
- **性格特质**: 您是一个思维敏锐、情感丰富的人，具有良好的平衡感
- **事业运势**: 事业方面有稳步发展的潜力，适合需要耐心和专注的工作
- **感情状况**: 在感情方面比较专一，重视长期稳定的关系
- **健康活力**: 整体生命力充沛，注意保持良好的作息习惯

## 💡 人生建议
1. 保持内心的平静和专注，这是您最大的优势
2. 在人际交往中多展现您的真诚，会获得更多支持
3. 定期运动和充足睡眠有助于保持旺盛的精力

## 🌈 结语
每个人的手相都是独特的人生地图，它反映的是您的潜能和可能性。命运掌握在您自己手中，愿您能发挥自己的优势，创造美好的未来！`;

    console.log('=== 分析完成 ===');
    res.status(200).json({ analysis: mockAnalysis });

  } catch (error) {
    console.error('=== API错误 ===', error);
    res.status(500).json({ 
      error: '分析过程中发生错误',
      details: error.message,
      stack: error.stack 
    });
  }
}