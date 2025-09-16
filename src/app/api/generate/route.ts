import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validatePrompt, validateImageFiles, sanitizeInput } from '@/lib/validation';
import { rateLimiter, getClientIdentifier } from '@/lib/rateLimit';

// \u4ece\u73af\u5883\u53d8\u91cf\u83b7\u53d6API\u5bc6\u94a5\uff0c\u4e0d\u63d0\u4f9b\u9ed8\u8ba4\u503c
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set');
  throw new Error('API configuration error');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: NextRequest) {
  // 速率限制检查
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimiter.check(clientId);
  
  if (!rateLimitResult.allowed) {
    const resetDate = new Date(rateLimitResult.resetTime).toISOString();
    return NextResponse.json(
      { 
        error: '请求过于频繁',
        details: '您的请求速度过快，请稍后再试',
        resetTime: resetDate
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': process.env.RATE_LIMIT_PER_MINUTE || '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetDate,
        }
      }
    );
  }
  
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const uploadedImages = formData.getAll('images') as File[];
    const numberOfImages = parseInt(formData.get('numberOfImages') as string || '1');

    // 验证提示词
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.valid) {
      return NextResponse.json(
        { 
          error: promptValidation.error,
          success: false 
        },
        { status: 400 }
      );
    }
    
    // 验证上传图片
    if (uploadedImages.length > 0) {
      const filesValidation = validateImageFiles(uploadedImages);
      if (!filesValidation.valid) {
        return NextResponse.json(
          { 
            error: filesValidation.error,
            success: false 
          },
          { status: 400 }
        );
      }
    }
    
    // 清理和处理提示词
    const sanitizedPrompt = sanitizeInput(prompt);

    // 从环境变量读取模型配置
    const modelId = process.env.GEMINI_MODEL_ID || "gemini-2.5-flash-image-preview";
    
    const model = genAI.getGenerativeModel({ 
      model: modelId,
      generationConfig: {
        temperature: 0.9,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      },
    });

    const imageParts = await Promise.all(
      uploadedImages.map(async (file) => {
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

    // 使用清理后的提示词
    const parts = uploadedImages.length > 0 
      ? [sanitizedPrompt, ...imageParts]  // 有图片时，将文本和图片一起发送
      : [sanitizedPrompt];                 // 纯文本生成图像
    
    const result = await model.generateContent(parts);
    const response = await result.response;
    
    // 调试：打印响应结构
    console.log('Full response:', result);
    console.log('Response text:', response.text());
    
    // 检查响应中是否包含图像数据
    const generatedImages: string[] = [];
    let textContent = '';
    
    try {
      // 根据文档，图像数据在 candidates[0].content.parts 中
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // 检查是否有内联数据（图像）
            if (part.inlineData && part.inlineData.data) {
              // 将 base64 数据转换为 data URL
              const mimeType = part.inlineData.mimeType || 'image/png';
              const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
              generatedImages.push(dataUrl);
              console.log('Found image in response with mimeType:', mimeType);
            }
            // 收集文本内容
            if (part.text) {
              textContent += part.text;
            }
          }
        }
      }
      
      // 也尝试直接从 response 获取文本
      if (!textContent) {
        textContent = response.text();
      }
    } catch (error) {
      console.error('解析响应时出错:', error);
    }

    // 添加速率限制头部
    const headers = {
      'X-RateLimit-Limit': process.env.RATE_LIMIT_PER_MINUTE || '10',
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      images: generatedImages.length > 0 ? generatedImages : undefined,
      generatedPrompt: textContent || sanitizedPrompt,
      originalPrompt: prompt,
      numberOfImages: numberOfImages,
      message: generatedImages.length > 0 
        ? `成功生成 ${generatedImages.length} 张图片` 
        : 'Gemini 模型返回了文本响应，请检查提示词格式',
      metadata: {
        modelUsed: modelId,
        processingTime: Date.now() - (request as any).startTime || 0,
        imageCount: uploadedImages.length,
      }
    }, { headers });

  } catch (error) {
    console.error('API 错误:', error);
    
    let errorMessage = '生成失败';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // 检测常见的内容政策违规错误
      if (error.message.includes('SAFETY') || 
          error.message.includes('blocked') || 
          error.message.includes('policy') ||
          error.message.includes('HARM')) {
        errorMessage = '内容违反安全政策';
        errorDetails = 'Gemini API 检测到不适当的内容。请尝试：\n• 使用更委婉的描述\n• 避免露骨或暴力内容\n• 使用艺术化的表达方式';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'API 配额限制';
        errorDetails = '已达到 API 使用限制，请稍后再试';
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时';
        errorDetails = '生成时间过长，请尝试简化提示词';
      } else if (error.message.includes('network')) {
        errorMessage = '网络错误';
        errorDetails = '网络连接失败，请检查网络设置';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        success: false
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';