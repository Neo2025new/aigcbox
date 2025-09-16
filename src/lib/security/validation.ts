import { z } from 'zod';

// 请求验证模式
export const generateRequestSchema = z.object({
  prompt: z.string()
    .min(1, '提示词不能为空')
    .max(1000, '提示词长度不能超过1000个字符')
    .refine((val) => !/<script|javascript:|on\w+=/i.test(val), {
      message: '提示词包含不允许的内容'
    }),
  numberOfImages: z.number()
    .min(1)
    .max(4)
    .default(1),
});

// 文件验证模式
export const fileValidationSchema = z.object({
  size: z.number()
    .max(5 * 1024 * 1024, '文件大小不能超过5MB'),
  type: z.enum([
    'image/png',
    'image/jpeg', 
    'image/jpg',
    'image/gif',
    'image/webp'
  ] as const, '不支持的文件类型'),
  name: z.string()
    .max(255, '文件名过长')
    .refine((name) => !/[<>:"/\\|?*\x00-\x1f]/g.test(name), {
      message: '文件名包含非法字符'
    }),
});

// 文件签名验证（魔术字节）
const FILE_SIGNATURES = {
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/jpg': [0xFF, 0xD8, 0xFF],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
} as const;

// 验证文件内容
export async function validateFileContent(file: File): Promise<boolean> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const signature = FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES];
    if (!signature) return false;
    
    // 检查文件头部是否匹配签名
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) {
        return false;
      }
    }
    
    // 对于WebP，还需要检查后续的格式标识
    if (file.type === 'image/webp' && bytes.length > 12) {
      const webpMarker = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      if (webpMarker !== 'WEBP') {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('文件内容验证失败:', error);
    return false;
  }
}

// 完整的文件验证
export async function validateFile(file: File): Promise<{
  success: boolean;
  error?: string;
}> {
  // 基本属性验证
  const validation = fileValidationSchema.safeParse({
    size: file.size,
    type: file.type,
    name: file.name,
  });
  
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || '文件验证失败',
    };
  }
  
  // 内容验证
  const isValidContent = await validateFileContent(file);
  if (!isValidContent) {
    return {
      success: false,
      error: '文件内容与声明的类型不匹配',
    };
  }
  
  return { success: true };
}

// 批量文件验证
export async function validateFiles(files: File[]): Promise<{
  success: boolean;
  errors: string[];
}> {
  if (files.length === 0) {
    return { success: true, errors: [] };
  }
  
  if (files.length > 4) {
    return {
      success: false,
      errors: ['最多只能上传4个文件'],
    };
  }
  
  const errors: string[] = [];
  
  for (const file of files) {
    const result = await validateFile(file);
    if (!result.success && result.error) {
      errors.push(`${file.name}: ${result.error}`);
    }
  }
  
  return {
    success: errors.length === 0,
    errors,
  };
}

// 验证请求的完整性
export async function validateRequest(formData: FormData): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const prompt = formData.get('prompt') as string;
    const numberOfImages = parseInt(formData.get('numberOfImages') as string || '1');
    const images = formData.getAll('images') as File[];
    
    // 验证基本参数
    const paramValidation = generateRequestSchema.safeParse({
      prompt,
      numberOfImages,
    });
    
    if (!paramValidation.success) {
      return {
        success: false,
        error: paramValidation.error.issues[0]?.message || '参数验证失败',
      };
    }
    
    // 验证文件
    if (images.length > 0) {
      const fileValidation = await validateFiles(images);
      if (!fileValidation.success) {
        return {
          success: false,
          error: fileValidation.errors[0] || '文件验证失败',
        };
      }
    }
    
    return {
      success: true,
      data: {
        prompt: paramValidation.data.prompt,
        numberOfImages: paramValidation.data.numberOfImages,
        images,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: '请求验证失败',
    };
  }
}