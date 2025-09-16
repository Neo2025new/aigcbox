/**
 * 验证和安全工具
 */

// 允许的图片类型
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// 文件大小限制（字节）
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '4194304'); // 4MB默认
const MAX_TOTAL_SIZE = MAX_FILE_SIZE * 4; // 总大小限制16MB

// 提示词长度限制
const MAX_PROMPT_LENGTH = 1000;
const MIN_PROMPT_LENGTH = 3;

/**
 * 验证上传的图片文件
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 检查文件是否存在
  if (!file) {
    return { valid: false, error: '未找到上传文件' };
  }

  // 检查文件类型
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `不支持的文件类型: ${file.type}。允许的类型: ${ALLOWED_IMAGE_TYPES.join(', ')}` 
    };
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return { 
      valid: false, 
      error: `文件太大 (${sizeMB}MB)。最大允许: ${maxMB}MB` 
    };
  }

  return { valid: true };
}

/**
 * 验证多个图片文件
 */
export function validateImageFiles(files: File[]): { valid: boolean; error?: string } {
  // 检查文件数量
  if (files.length > 4) {
    return { valid: false, error: '最多只能上传4张图片' };
  }

  // 检查总大小
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
    const maxTotalMB = (MAX_TOTAL_SIZE / (1024 * 1024)).toFixed(0);
    return { 
      valid: false, 
      error: `文件总大小超限 (${totalMB}MB)。最大允许: ${maxTotalMB}MB` 
    };
  }

  // 验证每个文件
  for (const file of files) {
    const result = validateImageFile(file);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * 验证提示词
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: '请提供生成提示词' };
  }

  const trimmedPrompt = prompt.trim();
  
  if (trimmedPrompt.length < MIN_PROMPT_LENGTH) {
    return { valid: false, error: `提示词太短，至少需要${MIN_PROMPT_LENGTH}个字符` };
  }

  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: `提示词太长，最多${MAX_PROMPT_LENGTH}个字符` };
  }

  // 检查是否包含潜在的注入攻击
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /eval\(/i,
    /import\s+/i,
    /require\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedPrompt)) {
      return { valid: false, error: '提示词包含不允许的内容' };
    }
  }

  return { valid: true };
}

/**
 * 清理用户输入
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // 移除尖括号
    .replace(/\\/g, '') // 移除反斜杠
    .slice(0, MAX_PROMPT_LENGTH); // 确保长度限制
}