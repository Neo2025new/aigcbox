import { NextRequest, NextResponse } from 'next/server';

// 清理任务端点 - 每日清理缓存和临时文件
export async function GET(request: NextRequest) {
  // 验证 cron 请求
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cleanupResults = {
      timestamp: new Date().toISOString(),
      tasks: [] as Array<{
        task: string;
        status: 'success' | 'error';
        message: string;
        duration: number;
      }>,
    };

    // 清理任务 1: 清理过期的临时文件
    const tempFileCleanup = await measureTask('temp_files', async () => {
      // 这里添加清理临时文件的逻辑
      // 例如：清理上传的图片缓存
      return 'Temporary files cleaned';
    });
    cleanupResults.tasks.push(tempFileCleanup);

    // 清理任务 2: 清理旧的日志文件
    const logCleanup = await measureTask('logs', async () => {
      // 这里添加清理日志的逻辑
      return 'Log files cleaned';
    });
    cleanupResults.tasks.push(logCleanup);

    // 清理任务 3: 清理缓存
    const cacheCleanup = await measureTask('cache', async () => {
      // 如果使用 Redis 或其他缓存，在这里清理过期条目
      return 'Cache cleaned';
    });
    cleanupResults.tasks.push(cacheCleanup);

    // 清理任务 4: 清理会话数据
    const sessionCleanup = await measureTask('sessions', async () => {
      // 如果有会话存储，清理过期会话
      return 'Sessions cleaned';
    });
    cleanupResults.tasks.push(sessionCleanup);

    const totalDuration = cleanupResults.tasks.reduce((sum, task) => sum + task.duration, 0);
    const failedTasks = cleanupResults.tasks.filter(task => task.status === 'error');

    console.log('Cleanup completed:', {
      totalDuration: `${totalDuration}ms`,
      successfulTasks: cleanupResults.tasks.length - failedTasks.length,
      failedTasks: failedTasks.length,
    });

    return NextResponse.json({
      ...cleanupResults,
      summary: {
        totalDuration: `${totalDuration}ms`,
        successfulTasks: cleanupResults.tasks.length - failedTasks.length,
        failedTasks: failedTasks.length,
      },
    });

  } catch (error) {
    console.error('Cleanup job failed:', error);
    return NextResponse.json({
      error: 'Cleanup job failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// 辅助函数：测量任务执行时间
async function measureTask(
  taskName: string,
  taskFn: () => Promise<string>
): Promise<{
  task: string;
  status: 'success' | 'error';
  message: string;
  duration: number;
}> {
  const startTime = Date.now();
  try {
    const message = await taskFn();
    return {
      task: taskName,
      status: 'success',
      message,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      task: taskName,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

export const runtime = 'nodejs';