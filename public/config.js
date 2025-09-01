// 应用配置文件
const CONFIG = {
    // DeepSeek API配置
    DEEPSEEK_API_KEY: '',
    DEEPSEEK_API_URL: '',
    
    // Supabase配置
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    
    // OpenAI配置（用于向量搜索）
    OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY',       // OpenAI API密钥
    
    // Gemini配置（用于AI分析）
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',       // Google Gemini API密钥
    
    // 文件配置
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    
    // API参数
    MODEL: 'deepseek-chat',
    TEMPERATURE: 0.7,
    MAX_TOKENS: 2000,
    
    // 知识库配置
    KNOWLEDGE_SEARCH: {
        enabled: true,                // 是否启用知识库增强
        similarity_threshold: 0.75,   // 相似度阈值
        max_results: 5               // 最大检索结果数
    }
};

// 验证配置
function validateConfig() {
    if (CONFIG.DEEPSEEK_API_KEY === 'YOUR_DEEPSEEK_API_KEY_HERE' || !CONFIG.DEEPSEEK_API_KEY) {
        throw new Error('请先配置DeepSeek API密钥');
    }
}

// 验证知识库配置
function validateKnowledgeConfig() {
    if (!CONFIG.KNOWLEDGE_SEARCH.enabled) return true;
    
    if (CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL' || !CONFIG.SUPABASE_URL) {
        console.warn('Supabase未配置，将禁用知识库增强功能');
        CONFIG.KNOWLEDGE_SEARCH.enabled = false;
        return false;
    }
    
    if (CONFIG.OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY' || !CONFIG.OPENAI_API_KEY) {
        console.warn('OpenAI未配置，将禁用知识库增强功能');
        CONFIG.KNOWLEDGE_SEARCH.enabled = false;
        return false;
    }
    
    return true;
}
