// 知识库配置文件
const KNOWLEDGE_CONFIG = {
    // Supabase配置 - 请填入您的实际信息
    SUPABASE_URL: 'YOUR_SUPABASE_URL',           // 例如: https://xxx.supabase.co
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY', // 公开(anon)密钥
    
    // OpenAI配置 - 用于生成向量嵌入
    OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY',       // OpenAI API密钥
    
    // 知识库表名
    TABLE_NAME: 'palm_knowledge',
    
    // 搜索配置
    SEARCH_CONFIG: {
        similarity_threshold: 0.75,    // 相似度阈值
        max_results: 5,               // 最大检索结果数
        use_hybrid_search: true       // 是否使用混合搜索（向量+关键词）
    }
};

// 验证配置
function validateKnowledgeConfig() {
    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY'];
    
    for (const key of required) {
        if (!KNOWLEDGE_CONFIG[key] || KNOWLEDGE_CONFIG[key].startsWith('YOUR_')) {
            throw new Error(`请在knowledge_config.js中配置 ${key}`);
        }
    }
}

module.exports = { KNOWLEDGE_CONFIG, validateKnowledgeConfig };