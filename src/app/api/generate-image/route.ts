import { NextRequest, NextResponse } from 'next/server';

// 使用免费的图像生成服务作为备用方案
async function generateImageFromText(prompt: string): Promise<string | null> {
  try {
    // 使用 Picsum 作为占位图像服务（实际项目中应使用真实的图像生成 API）
    // 这里我们根据提示词生成一个唯一的种子来获取不同的图片
    const seed = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const width = 512;
    const height = 512;
    
    // 使用 Unsplash API 获取相关图片（需要 API key）
    // 或者使用其他免费的图像 API
    const imageUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;
    
    // 获取图像并转换为 base64
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('生成占位图像失败:', error);
    return null;
  }
}

// 使用 AI 图像生成 API（如 Stability AI、Replicate 等）
async function generateWithAI(prompt: string): Promise<string | null> {
  try {
    // 这里可以集成实际的 AI 图像生成服务
    // 例如：Stability AI, Replicate, Hugging Face 等
    
    // 示例：使用 Hugging Face 的免费 API
    // 注意：需要注册获取 API token
    /*
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
      {
        headers: {
          Authorization: "Bearer YOUR_HF_TOKEN",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    */
    
    // 暂时返回 null，使用占位图像
    return null;
  } catch (error) {
    console.error('AI 图像生成失败:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, useAI = false } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: '请提供生成提示词' },
        { status: 400 }
      );
    }
    
    let imageUrl: string | null = null;
    
    // 首先尝试使用 AI 生成
    if (useAI) {
      imageUrl = await generateWithAI(prompt);
    }
    
    // 如果 AI 生成失败，使用占位图像
    if (!imageUrl) {
      imageUrl = await generateImageFromText(prompt);
    }
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: '图像生成失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      image: imageUrl,
      prompt: prompt,
      message: '图像生成成功',
    });
    
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { 
        error: '生成失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';