export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    res.status(200).json({ 
      message: 'API测试成功!',
      timestamp: new Date().toISOString(),
      env_check: {
        has_gateway_key: !!process.env.VERCEL_AI_GATEWAY_KEY,
        gateway_key_preview: process.env.VERCEL_AI_GATEWAY_KEY ? 
          process.env.VERCEL_AI_GATEWAY_KEY.substring(0, 10) + '...' : 'undefined'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}