// 手相知识库文档处理和上传脚本
// 需要先安装依赖: npm install @supabase/supabase-js openai pdf-parse pdf2pic

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const pdf2pic = require('pdf2pic');

// 配置 - 使用实际密钥
const SUPABASE_URL = 'https://unebxronbekorreiyddk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZWJ4cm9uYmVrb3JyZWl5ZGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDk3OTgsImV4cCI6MjA3MjI4NTc5OH0.nFPcyPRS9mrwC4SuJXjglD3uGj2kfhNPd9HGJUgvZMI';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';

// 初始化客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// 文档分段配置
const CHUNK_CONFIG = {
    maxLength: 800,        // 每段最大字符数
    overlap: 100,          // 段落重叠字符数
    separators: ['\n\n', '\n', '。', '；', '，']  // 分段分隔符优先级
};

// 手相知识分类映射
const CATEGORY_MAPPING = {
    '生命线': 'palm_lines',
    '智慧线': 'palm_lines', 
    '感情线': 'palm_lines',
    '事业线': 'palm_lines',
    '成功线': 'palm_lines',
    '婚姻线': 'palm_lines',
    '金星丘': 'mounts',
    '木星丘': 'mounts',
    '土星丘': 'mounts',
    '太阳丘': 'mounts',
    '水星丘': 'mounts',
    '月亮丘': 'mounts',
    '第一火星丘': 'mounts',
    '第二火星丘': 'mounts',
    '星纹': 'signs',
    '岛纹': 'signs',
    '十字纹': 'signs',
    '三角纹': 'signs',
    '方形纹': 'signs',
    '健康': 'health',
    '事业': 'career',
    '财运': 'career',
    '感情': 'love',
    '婚姻': 'love'
};

/**
 * 智能文档分段函数
 */
function smartChunkText(text, title = '') {
    const chunks = [];
    let currentChunk = '';
    let currentLength = 0;
    
    // 预处理：清理文本
    const cleanText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    
    const sentences = splitBySeparators(cleanText, CHUNK_CONFIG.separators);
    
    for (const sentence of sentences) {
        const sentenceLength = sentence.length;
        
        // 如果单句就超过最大长度，强制分割
        if (sentenceLength > CHUNK_CONFIG.maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
                currentLength = 0;
            }
            chunks.push(sentence.trim());
            continue;
        }
        
        // 检查是否需要新建分段
        if (currentLength + sentenceLength > CHUNK_CONFIG.maxLength && currentChunk) {
            chunks.push(currentChunk.trim());
            
            // 创建重叠内容
            const overlap = getOverlapText(currentChunk, CHUNK_CONFIG.overlap);
            currentChunk = overlap + sentence;
            currentLength = currentChunk.length;
        } else {
            currentChunk += sentence;
            currentLength += sentenceLength;
        }
    }
    
    // 添加最后一段
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 50); // 过滤太短的片段
}

/**
 * 按分隔符递归分割文本
 */
function splitBySeparators(text, separators) {
    if (separators.length === 0) {
        return [text];
    }
    
    const [currentSep, ...remainingSeps] = separators;
    const parts = text.split(currentSep);
    
    const result = [];
    for (let i = 0; i < parts.length; i++) {
        if (i > 0) result.push(currentSep); // 保留分隔符
        
        if (parts[i].length > CHUNK_CONFIG.maxLength && remainingSeps.length > 0) {
            result.push(...splitBySeparators(parts[i], remainingSeps));
        } else {
            result.push(parts[i]);
        }
    }
    
    return result.filter(part => part.trim().length > 0);
}

/**
 * 获取重叠文本
 */
function getOverlapText(text, overlapLength) {
    if (text.length <= overlapLength) return text;
    return '...' + text.slice(-overlapLength);
}

/**
 * 提取关键词
 */
function extractKeywords(text) {
    const keywords = [];
    
    // 从文本中提取手相相关关键词
    Object.keys(CATEGORY_MAPPING).forEach(keyword => {
        if (text.includes(keyword)) {
            keywords.push(keyword);
        }
    });
    
    // 添加其他常见手相术语
    const palmTerms = ['掌纹', '纹理', '断裂', '分叉', '岛纹', '星纹', '方格纹', '三角纹', 
                      '长短', '深浅', '清晰', '模糊', '起点', '终点', '走向', '弧度',
                      '手型', '手指', '拇指', '食指', '中指', '无名指', '小指'];
    
    palmTerms.forEach(term => {
        if (text.includes(term) && !keywords.includes(term)) {
            keywords.push(term);
        }
    });
    
    return keywords.slice(0, 10); // 限制关键词数量
}

/**
 * 确定分类
 */
function determineCategory(text, title) {
    const fullText = (title + ' ' + text).toLowerCase();
    
    // 根据内容关键词确定分类
    for (const [keyword, category] of Object.entries(CATEGORY_MAPPING)) {
        if (fullText.includes(keyword.toLowerCase())) {
            return { category, subcategory: keyword };
        }
    }
    
    // 默认分类
    if (fullText.includes('事业') || fullText.includes('工作') || fullText.includes('财')) {
        return { category: 'career', subcategory: null };
    }
    if (fullText.includes('感情') || fullText.includes('爱情') || fullText.includes('婚姻')) {
        return { category: 'love', subcategory: null };
    }
    if (fullText.includes('健康') || fullText.includes('身体')) {
        return { category: 'health', subcategory: null };
    }
    
    return { category: 'general', subcategory: null };
}

/**
 * 生成向量嵌入
 */
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('生成向量嵌入失败:', error);
        throw error;
    }
}

/**
 * 处理PDF文档
 */
async function processPDFDocument(filePath) {
    console.log(`处理PDF文档: ${filePath}`);
    
    const fileName = path.basename(filePath, path.extname(filePath));
    const pdfBuffer = fs.readFileSync(filePath);
    
    try {
        // 提取PDF文本内容
        const pdfData = await pdf(pdfBuffer);
        const textContent = pdfData.text;
        
        // 提取PDF中的图片信息
        const imageInfo = await extractPDFImages(filePath, fileName);
        
        return { textContent, imageInfo, fileName };
    } catch (error) {
        console.error(`处理PDF失败: ${error.message}`);
        throw error;
    }
}

/**
 * 提取PDF中的图片信息
 */
async function extractPDFImages(pdfPath, fileName) {
    try {
        const convert = pdf2pic.fromPath(pdfPath, {
            density: 150,           // 图片质量
            saveFilename: fileName,
            savePath: "./temp_images/",
            format: "png",
            width: 800,
            height: 1200
        });
        
        // 确保临时目录存在
        if (!fs.existsSync('./temp_images/')) {
            fs.mkdirSync('./temp_images/');
        }
        
        // 转换所有页面为图片
        const pages = await convert.bulk(-1, { responseType: "buffer" });
        
        const imageDescriptions = [];
        
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (page.buffer) {
                // 为图片生成描述（如果包含手相图）
                const description = await describeImage(page.buffer, `${fileName}-第${i+1}页`);
                if (description) {
                    imageDescriptions.push({
                        page: i + 1,
                        description: description,
                        hasHandDiagram: description.includes('手') || description.includes('掌') || description.includes('纹')
                    });
                }
            }
        }
        
        // 清理临时文件
        try {
            fs.rmSync('./temp_images/', { recursive: true, force: true });
        } catch (e) {
            console.warn('清理临时文件失败:', e.message);
        }
        
        return imageDescriptions;
    } catch (error) {
        console.error('提取PDF图片失败:', error);
        return [];
    }
}

/**
 * 使用AI描述图片内容
 */
async function describeImage(imageBuffer, imageName) {
    try {
        const base64Image = imageBuffer.toString('base64');
        
        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "请简要描述这张图片的内容，特别关注是否包含手相、掌纹、手型等相关图示。如果是手相相关图片，请详细描述图中的掌纹特征。"
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/png;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300
        });
        
        return response.choices[0].message.content;
    } catch (error) {
        console.error(`图片描述生成失败 (${imageName}):`, error);
        return null;
    }
}

/**
 * 处理单个文档（支持PDF和文本）
 */
async function processDocument(filePath) {
    const fileExt = path.extname(filePath).toLowerCase();
    
    if (fileExt === '.pdf') {
        return await processPDFDocument(filePath);
    } else {
        // 处理文本文档
        console.log(`处理文本文档: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(filePath, path.extname(filePath));
        return { textContent: content, imageInfo: [], fileName };
    }
}

/**
 * 处理文档数据并生成知识库条目
 */
async function processDocumentData(docData) {
    const { textContent, imageInfo, fileName } = docData;
    
    // 分段处理文本内容
    const chunks = smartChunkText(textContent, fileName);
    console.log(`文档分割为 ${chunks.length} 段`);
    
    const processedChunks = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`处理第 ${i + 1}/${chunks.length} 段...`);
        
        try {
            // 为文本段落添加相关的图片描述
            let enhancedContent = chunk;
            const relatedImages = imageInfo.filter(img => img.hasHandDiagram);
            
            if (relatedImages.length > 0) {
                const imageDescriptions = relatedImages
                    .map(img => `[图${img.page}: ${img.description}]`)
                    .join(' ');
                enhancedContent = chunk + '\n\n图片说明: ' + imageDescriptions;
            }
            
            // 生成向量嵌入
            const embedding = await generateEmbedding(enhancedContent);
            
            // 确定分类
            const { category, subcategory } = determineCategory(enhancedContent, fileName);
            
            // 提取关键词
            const keywords = extractKeywords(enhancedContent);
            
            const chunkData = {
                title: `${fileName} - 第${i + 1}段`,
                content: enhancedContent,
                category: category,
                subcategory: subcategory,
                keywords: keywords,
                embedding: embedding,
                metadata: {
                    source_file: fileName,
                    chunk_index: i,
                    chunk_length: enhancedContent.length,
                    has_images: relatedImages.length > 0,
                    image_count: relatedImages.length,
                    processed_at: new Date().toISOString()
                }
            };
            
            processedChunks.push(chunkData);
            
            // 避免API速率限制
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.error(`处理第 ${i + 1} 段时出错:`, error);
        }
    }
    
    return processedChunks;
}

/**
 * 批量上传到Supabase
 */
async function uploadToSupabase(chunks) {
    console.log(`开始上传 ${chunks.length} 个知识片段...`);
    
    const batchSize = 50; // 批量上传大小
    
    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        try {
            const { data, error } = await supabase
                .from('palm_knowledge')
                .insert(batch);
            
            if (error) {
                console.error(`批次 ${Math.floor(i/batchSize) + 1} 上传失败:`, error);
            } else {
                console.log(`✅ 批次 ${Math.floor(i/batchSize) + 1} 上传成功 (${batch.length} 项)`);
            }
        } catch (error) {
            console.error(`批次上传异常:`, error);
        }
    }
}

/**
 * 主处理函数
 */
async function main() {
    try {
        console.log('🚀 开始处理手相知识库文档...\n');
        
        // 检查配置
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            throw new Error('请先配置Supabase URL和密钥');
        }
        if (OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY') {
            throw new Error('请先配置OpenAI API密钥');
        }
        
        // 获取docs目录下的所有文档
        const docsDir = './docs';
        if (!fs.existsSync(docsDir)) {
            throw new Error('请创建docs目录并放入您的手相知识库文档');
        }
        
        const files = fs.readdirSync(docsDir)
            .filter(file => ['.txt', '.md', '.doc', '.pdf'].some(ext => file.endsWith(ext)))
            .map(file => path.join(docsDir, file));
        
        if (files.length === 0) {
            throw new Error('docs目录中没有找到文档文件');
        }
        
        console.log(`找到 ${files.length} 个文档文件:`);
        files.forEach(file => console.log(`- ${file}`));
        console.log('');
        
        // 处理所有文档
        let allChunks = [];
        for (const file of files) {
            const docData = await processDocument(file);
            const chunks = await processDocumentData(docData);
            allChunks = allChunks.concat(chunks);
        }
        
        console.log(`\n📊 总计处理了 ${allChunks.length} 个知识片段`);
        
        // 上传到Supabase
        await uploadToSupabase(allChunks);
        
        console.log('\n🎉 知识库处理完成！');
        console.log('现在可以在手相分析应用中使用这些知识了。');
        
    } catch (error) {
        console.error('❌ 处理失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    processDocument,
    processDocumentData,
    uploadToSupabase,
    generateEmbedding,
    smartChunkText
};