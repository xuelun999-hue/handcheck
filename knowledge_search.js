// 前端知识库搜索模块
class PalmKnowledgeSearch {
    constructor(supabaseUrl, supabaseKey, openaiKey) {
        // 注意：在生产环境中，OpenAI密钥应该通过后端代理
        this.supabase = supabase.createClient(supabaseUrl, supabaseKey);
        this.openaiKey = openaiKey;
    }
    
    /**
     * 生成查询向量
     */
    async generateQueryEmbedding(query) {
        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiKey}`
                },
                body: JSON.stringify({
                    model: 'text-embedding-ada-002',
                    input: query
                })
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            return data.data[0].embedding;
        } catch (error) {
            console.error('生成查询向量失败:', error);
            throw error;
        }
    }
    
    /**
     * 搜索相关知识
     */
    async searchKnowledge(query, category = null, maxResults = 5) {
        try {
            // 生成查询向量
            const queryEmbedding = await this.generateQueryEmbedding(query);
            
            // 调用Supabase函数进行向量搜索
            const { data, error } = await this.supabase.rpc('search_palm_knowledge', {
                query_embedding: queryEmbedding,
                match_threshold: 0.75,
                match_count: maxResults,
                filter_category: category
            });
            
            if (error) {
                console.error('知识库搜索失败:', error);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.error('搜索知识库时出错:', error);
            return [];
        }
    }
    
    /**
     * 混合搜索（向量+关键词）
     */
    async hybridSearch(query, category = null, maxResults = 5) {
        try {
            const queryEmbedding = await this.generateQueryEmbedding(query);
            
            const { data, error } = await this.supabase.rpc('hybrid_search_palm_knowledge', {
                query_text: query,
                query_embedding: queryEmbedding,
                match_threshold: 0.7,
                match_count: maxResults,
                filter_category: category
            });
            
            if (error) {
                console.error('混合搜索失败:', error);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.error('混合搜索时出错:', error);
            return [];
        }
    }
    
    /**
     * 根据分析类型获取相关知识
     */
    async getRelevantKnowledge(analysisType, handType, age) {
        const queries = this.generateSearchQueries(analysisType, handType, age);
        const allResults = [];
        
        for (const { query, category } of queries) {
            const results = await this.hybridSearch(query, category, 3);
            allResults.push(...results);
        }
        
        // 去重并按相似度排序
        const uniqueResults = this.deduplicateResults(allResults);
        return uniqueResults.slice(0, 8); // 返回最相关的8条知识
    }
    
    /**
     * 生成搜索查询
     */
    generateSearchQueries(analysisType, handType, age) {
        const baseQueries = [];
        
        switch (analysisType) {
            case 'career':
                baseQueries.push(
                    { query: '事业线 工作 职业发展', category: 'career' },
                    { query: '成功线 太阳线 事业成就', category: 'career' },
                    { query: '木星丘 领导力 企图心', category: 'mounts' }
                );
                break;
                
            case 'love':
                baseQueries.push(
                    { query: '感情线 婚姻线 爱情', category: 'love' },
                    { query: '金星丘 感情丰富', category: 'mounts' },
                    { query: '月亮丘 情感敏感', category: 'mounts' }
                );
                break;
                
            case 'health':
                baseQueries.push(
                    { query: '生命线 健康 体质', category: 'health' },
                    { query: '健康线 身体状况', category: 'health' },
                    { query: '金星丘 生命力', category: 'mounts' }
                );
                break;
                
            case 'comprehensive':
                baseQueries.push(
                    { query: '生命线 智慧线 感情线', category: 'palm_lines' },
                    { query: '八大丘位 性格特征', category: 'mounts' },
                    { query: '特殊符号 星纹 岛纹', category: 'signs' }
                );
                break;
        }
        
        // 添加年龄相关查询
        if (age < 30) {
            baseQueries.push({ query: '年轻人 潜力 发展', category: null });
        } else if (age < 50) {
            baseQueries.push({ query: '中年 事业 家庭', category: null });
        } else {
            baseQueries.push({ query: '成熟 智慧 经验', category: null });
        }
        
        return baseQueries;
    }
    
    /**
     * 去重搜索结果
     */
    deduplicateResults(results) {
        const seen = new Set();
        return results
            .filter(item => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            })
            .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    }
    
    /**
     * 格式化知识为提示词
     */
    formatKnowledgeForPrompt(knowledgeItems) {
        if (!knowledgeItems || knowledgeItems.length === 0) {
            return '';
        }
        
        let formattedKnowledge = '\n\n[专业知识库参考]\n';
        
        knowledgeItems.forEach((item, index) => {
            formattedKnowledge += `\n${index + 1}. ${item.title}\n`;
            formattedKnowledge += `分类: ${item.category} | 关键词: ${item.keywords?.join(', ') || '无'}\n`;
            formattedKnowledge += `内容: ${item.content}\n`;
            if (item.similarity) {
                formattedKnowledge += `相关度: ${(item.similarity * 100).toFixed(1)}%\n`;
            }
            formattedKnowledge += '---\n';
        });
        
        formattedKnowledge += '\n请基于以上专业知识进行分析，确保分析的准确性和专业性。\n';
        
        return formattedKnowledge;
    }
}