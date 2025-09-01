import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 检查环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({
        error: 'Supabase环境变量未设置',
        details: {
          has_url: !!supabaseUrl,
          has_key: !!supabaseKey,
          url_preview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined'
        }
      });
    }

    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 测试数据库连接
    const { data, error } = await supabase
      .from('palm_knowledge')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({
        error: 'Supabase连接失败',
        details: error.message,
        supabase_configured: true,
        connection_test: 'failed'
      });
    }

    // 获取知识库统计信息
    const { count } = await supabase
      .from('palm_knowledge')
      .select('*', { count: 'exact', head: true });

    res.status(200).json({
      message: 'Supabase连接成功!',
      supabase_configured: true,
      connection_test: 'success',
      knowledge_base: {
        total_entries: count || 0,
        table_exists: true
      },
      config: {
        url: supabaseUrl.substring(0, 30) + '...',
        key_length: supabaseKey.length
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Supabase测试失败',
      details: error.message,
      supabase_configured: false
    });
  }
}