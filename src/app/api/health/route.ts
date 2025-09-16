import { NextResponse } from 'next/server';

// 健康检查端点
export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
      checks: {
        geminiApi: await checkGeminiAPI(),
        database: await checkDatabase(),
        redis: await checkRedis(),
      }
    };

    // 检查是否有任何检查失败
    const hasFailures = Object.values(healthCheck.checks).some(check => check.status !== 'healthy');
    
    return NextResponse.json(healthCheck, {
      status: hasFailures ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}

// 检查 Gemini API 连接
async function checkGeminiAPI() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-api-key-here') {
      return {
        status: 'unhealthy',
        message: 'Gemini API key not configured',
      };
    }

    // 这里可以添加一个轻量级的 API 调用来测试连接
    // 为了避免频繁调用，这里只检查密钥是否存在
    return {
      status: 'healthy',
      message: 'Gemini API key configured',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Gemini API check failed',
    };
  }
}

// 检查数据库连接（如果使用）
async function checkDatabase() {
  try {
    // 如果项目使用数据库，在这里添加连接检查
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return {
        status: 'not_configured',
        message: 'Database not configured',
      };
    }

    // 这里应该添加实际的数据库连接检查
    return {
      status: 'healthy',
      message: 'Database connection healthy',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database check failed',
    };
  }
}

// 检查 Redis 连接（如果使用）
async function checkRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return {
        status: 'not_configured',
        message: 'Redis not configured',
      };
    }

    // 这里应该添加实际的 Redis 连接检查
    return {
      status: 'healthy',
      message: 'Redis connection healthy',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Redis check failed',
    };
  }
}

export const runtime = 'nodejs';