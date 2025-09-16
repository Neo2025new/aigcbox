// 输入清理和消毒函数

// HTML实体转义
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

// 清理用户输入的提示词
export function sanitizePrompt(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // 移除控制字符
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // 移除潜在的脚本标签和事件处理器
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // 限制长度
  sanitized = sanitized.substring(0, 1000);
  
  // 标准化空白字符
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

// 清理文件名
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }
  
  // 获取文件扩展名
  const lastDotIndex = filename.lastIndexOf('.');
  let name = filename;
  let ext = '';
  
  if (lastDotIndex !== -1) {
    name = filename.substring(0, lastDotIndex);
    ext = filename.substring(lastDotIndex);
  }
  
  // 清理文件名部分
  name = name
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 只保留安全字符
    .replace(/_{2,}/g, '_') // 移除连续的下划线
    .substring(0, 100); // 限制长度
  
  // 清理扩展名
  ext = ext
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')
    .substring(0, 10);
  
  // 确保文件名不为空
  if (!name) {
    name = 'file';
  }
  
  return name + ext;
}

// 清理URL参数
export function sanitizeUrlParam(param: string): string {
  if (!param || typeof param !== 'string') {
    return '';
  }
  
  // URL编码特殊字符
  return encodeURIComponent(param)
    .substring(0, 200); // 限制长度
}

// 清理JSON输入
export function sanitizeJson(input: any): any {
  if (typeof input === 'string') {
    return sanitizePrompt(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeJson(item));
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // 跳过原型链上的属性
      if (!Object.prototype.hasOwnProperty.call(input, key)) {
        continue;
      }
      // 清理键名
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeJson(value);
      }
    }
    return sanitized;
  }
  
  // 对于其他类型，直接返回
  return input;
}

// 验证并清理Base64字符串
export function sanitizeBase64(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  // 移除data URL前缀
  const base64Match = input.match(/^data:image\/[a-z]+;base64,(.+)$/i);
  const base64String = base64Match ? base64Match[1] : input;
  
  // 验证Base64格式
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64String)) {
    return null;
  }
  
  // 限制大小（约10MB的Base64）
  if (base64String.length > 13_333_333) {
    return null;
  }
  
  return base64String;
}

// 清理错误消息（避免信息泄露）
export function sanitizeErrorMessage(error: any): string {
  const errorMessages: Record<string, string> = {
    'ECONNREFUSED': '服务暂时不可用',
    'ETIMEDOUT': '请求超时',
    'ENOTFOUND': '服务不可达',
    'SAFETY': '内容不符合安全政策',
    'QUOTA': 'API配额已用完',
    'INVALID_API_KEY': '服务配置错误',
    'PERMISSION_DENIED': '权限不足',
  };
  
  // 检查错误类型
  const errorString = String(error?.message || error || '');
  
  // 查找匹配的错误类型
  for (const [key, message] of Object.entries(errorMessages)) {
    if (errorString.includes(key)) {
      return message;
    }
  }
  
  // 默认错误消息
  return '处理请求时发生错误';
}

// 清理和验证MIME类型
export function sanitizeMimeType(mimeType: string): string | null {
  const allowedMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
  ];
  
  const cleaned = mimeType?.toLowerCase().trim();
  
  if (allowedMimeTypes.includes(cleaned)) {
    return cleaned;
  }
  
  return null;
}

// 防止路径遍历攻击
export function sanitizePath(path: string): string {
  if (!path || typeof path !== 'string') {
    return '';
  }
  
  // 移除路径遍历模式
  let sanitized = path
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  
  // 只允许安全的路径字符
  sanitized = sanitized.replace(/[^a-zA-Z0-9/_.-]/g, '');
  
  return sanitized;
}