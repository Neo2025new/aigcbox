import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateRequest } from '@/lib/security/validation';
import { sanitizePrompt, sanitizeErrorMessage } from '@/lib/security/sanitize';
import { checkRateLimit, getRateLimitHeaders, isIPBlacklisted } from '@/lib/security/rate-limit';
import { logSecurityEvent, SecuritySeverity, detectSuspiciousPatterns, extractRequestInfo } from '@/lib/security/monitoring';

// 从环境变量获取API密钥
const API_KEY = process.env.GEMINI_API_KEY;

// 初始化时检查API密钥
if (!API_KEY) {
  console.error('GEMINI_API_KEY is not configured in environment variables');
}

// CORS配置
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

// 检查来源是否允许
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed => 
    allowed === '*' || origin === allowed || origin.startsWith(allowed)
  );
}

// 设置CORS头
function setCorsHeaders(response: NextResponse, origin: string | null): void {
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
}

// 设置安全头
function setSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'");
}

// OPTIONS请求处理（CORS预检）
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  const origin = request.headers.get('origin');
  
  setCorsHeaders(response, origin);
  setSecurityHeaders(response);
  
  return response;
}

export async function POST(request: NextRequest) {
  const requestInfo = extractRequestInfo(request);
  const origin = request.headers.get('origin');
  
  try {
    // 检查API密钥配置
    if (!API_KEY) {
      logSecurityEvent(
        'api_error',
        SecuritySeverity.CRITICAL,
        { error: 'API key not configured' },
        request
      );
      
      const response = NextResponse.json(
        { error: '服务配置错误', requestId: requestInfo.requestId },
        { status: 503 }
      );
      setSecurityHeaders(response);
      return response;
    }
    
    // 检查IP黑名单
    if (isIPBlacklisted(requestInfo.ip)) {
      logSecurityEvent(
        'unauthorized_access',
        SecuritySeverity.HIGH,
        { reason: 'IP blacklisted' },
        request
      );
      
      const response = NextResponse.json(
        { error: '访问被拒绝', requestId: requestInfo.requestId },
        { status: 403 }
      );
      setSecurityHeaders(response);
      return response;
    }
    
    // 检查速率限制
    const rateLimitResult = await checkRateLimit(request, undefined, 10);
    
    if (!rateLimitResult.success) {
      logSecurityEvent(
        'rate_limit_exceeded',
        SecuritySeverity.MEDIUM,
        { 
          limit: rateLimitResult.limit,
          identifier: rateLimitResult.identifier 
        },
        request
      );
      
      const response = NextResponse.json(
        { 
          error: '请求过于频繁，请稍后再试',
          requestId: requestInfo.requestId,
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
      
      // 添加速率限制头
      const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      setSecurityHeaders(response);
      setCorsHeaders(response, origin);
      return response;
    }
    
    // 解析和验证请求
    const formData = await request.formData();
    const validation = await validateRequest(formData);
    
    if (!validation.success) {
      logSecurityEvent(
        'invalid_input',
        SecuritySeverity.LOW,
        { error: validation.error },
        request
      );
      
      const response = NextResponse.json(
        { 
          error: validation.error || '请求参数无效',
          requestId: requestInfo.requestId 
        },
        { status: 400 }
      );
      
      setSecurityHeaders(response);
      setCorsHeaders(response, origin);
      return response;
    }
    
    const { prompt, numberOfImages, images } = validation.data;
    
    // 检测可疑模式
    const suspiciousCheck = detectSuspiciousPatterns(prompt);
    if (suspiciousCheck.detected) {
      logSecurityEvent(
        'suspicious_activity',
        SecuritySeverity.HIGH,
        { 
          patterns: suspiciousCheck.patterns,
          prompt: prompt.substring(0, 100) 
        },
        request
      );
      
      const response = NextResponse.json(
        { 
          error: '检测到不允许的内容',
          requestId: requestInfo.requestId 
        },
        { status: 400 }
      );
      
      setSecurityHeaders(response);
      setCorsHeaders(response, origin);
      return response;
    }
    
    // 清理提示词
    const sanitizedPrompt = sanitizePrompt(prompt);
    
    // 初始化Gemini API
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.9,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      },
    });
    
    // 处理图片
    const imageParts = await Promise.all(
      images.map(async (file: File) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        return {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: file.type,
          },
        };
      })
    );
    
    // 构建请求部分
    const parts = images.length > 0 
      ? [sanitizedPrompt, ...imageParts]
      : [sanitizedPrompt];
    
    // 调用Gemini API
    const result = await model.generateContent(parts);
    const response = await result.response;
    
    // 处理响应
    const generatedImages: string[] = [];
    let textContent = '';
    
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            generatedImages.push(dataUrl);
          }
          if (part.text) {
            textContent += part.text;
          }
        }
      }
    }
    
    if (!textContent) {
      textContent = response.text();
    }
    
    // 记录成功的请求
    logSecurityEvent(
      'api_error',
      SecuritySeverity.LOW,
      { 
        success: true,
        imagesGenerated: generatedImages.length 
      },
      request
    );
    
    // 构建响应
    const successResponse = NextResponse.json({
      success: true,
      images: generatedImages.length > 0 ? generatedImages : undefined,
      generatedPrompt: textContent || sanitizedPrompt,
      originalPrompt: sanitizedPrompt,
      numberOfImages: numberOfImages,
      requestId: requestInfo.requestId,
      message: generatedImages.length > 0 
        ? `成功生成 ${generatedImages.length} 张图片` 
        : 'Gemini 模型返回了文本响应',
    });
    
    // 添加速率限制头（显示剩余配额）
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      successResponse.headers.set(key, value);
    });
    
    setSecurityHeaders(successResponse);
    setCorsHeaders(successResponse, origin);
    return successResponse;
    
  } catch (error) {
    // 记录错误
    logSecurityEvent(
      'api_error',
      SecuritySeverity.MEDIUM,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      request
    );
    
    // 清理错误消息（避免信息泄露）
    const safeErrorMessage = sanitizeErrorMessage(error);
    
    const errorResponse = NextResponse.json(
      { 
        error: safeErrorMessage,
        requestId: requestInfo.requestId,
        success: false
      },
      { status: 500 }
    );
    
    setSecurityHeaders(errorResponse);
    setCorsHeaders(errorResponse, origin);
    return errorResponse;
  }
}

// 设置运行时
export const runtime = 'nodejs';

// 设置最大请求体大小（10MB）
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};