import type { NextRequest } from 'next/server';

// 安全事件类型
export type SecurityEventType = 
  | 'rate_limit_exceeded'
  | 'invalid_input'
  | 'unauthorized_access'
  | 'suspicious_activity'
  | 'file_validation_failed'
  | 'api_error'
  | 'csrf_attempt'
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'path_traversal_attempt';

// 安全事件严重程度
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 安全事件接口
export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  details: any;
  url?: string;
  method?: string;
}

// 安全事件日志类
class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;
  
  // 记录安全事件
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };
    
    // 添加到内存缓存
    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }
    
    // 输出到控制台（生产环境应发送到日志服务）
    this.outputLog(fullEvent);
    
    // 触发告警（如果需要）
    this.checkAlert(fullEvent);
  }
  
  // 输出日志
  private outputLog(event: SecurityEvent): void {
    const logLevel = this.getLogLevel(event.severity);
    const logMessage = this.formatLogMessage(event);
    
    console[logLevel]('[SECURITY]', logMessage);
    
    // 在生产环境，这里应该发送到日志服务
    // 例如: Sentry, DataDog, CloudWatch, etc.
    if (process.env.NODE_ENV === 'production') {
      // this.sendToLogService(event);
    }
  }
  
  // 格式化日志消息
  private formatLogMessage(event: SecurityEvent): string {
    return JSON.stringify({
      type: event.type,
      severity: event.severity,
      timestamp: event.timestamp.toISOString(),
      ip: event.ip || 'unknown',
      userAgent: event.userAgent?.substring(0, 100),
      requestId: event.requestId,
      url: event.url,
      method: event.method,
      details: event.details,
    });
  }
  
  // 获取日志级别
  private getLogLevel(severity: SecuritySeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case SecuritySeverity.LOW:
        return 'log';
      case SecuritySeverity.MEDIUM:
        return 'warn';
      case SecuritySeverity.HIGH:
      case SecuritySeverity.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }
  
  // 检查是否需要触发告警
  private checkAlert(event: SecurityEvent): void {
    // 严重和高风险事件立即告警
    if (event.severity === SecuritySeverity.CRITICAL || 
        event.severity === SecuritySeverity.HIGH) {
      this.sendAlert(event);
    }
    
    // 检查是否有异常模式（如同一IP的多次失败尝试）
    if (event.ip) {
      const recentEvents = this.getRecentEventsByIP(event.ip, 5 * 60 * 1000); // 5分钟内
      if (recentEvents.length > 10) {
        this.sendAlert({
          ...event,
          type: 'suspicious_activity',
          severity: SecuritySeverity.HIGH,
          details: {
            ...event.details,
            suspiciousPattern: `${recentEvents.length} events from same IP in 5 minutes`,
          },
        });
      }
    }
  }
  
  // 发送告警
  private sendAlert(event: SecurityEvent): void {
    console.error('[ALERT]', `Security alert: ${event.type}`, event);
    
    // 在生产环境，这里应该发送告警
    // 例如: 发送邮件、Slack通知、PagerDuty等
    if (process.env.NODE_ENV === 'production') {
      // this.sendToAlertService(event);
    }
  }
  
  // 获取特定IP的最近事件
  private getRecentEventsByIP(ip: string, timeWindow: number): SecurityEvent[] {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.events.filter(
      event => event.ip === ip && event.timestamp > cutoff
    );
  }
  
  // 获取统计信息
  getStats(timeWindow = 60 * 60 * 1000): {
    total: number;
    bySeverity: Record<SecuritySeverity, number>;
    byType: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
  } {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentEvents = this.events.filter(event => event.timestamp > cutoff);
    
    const bySeverity: Record<SecuritySeverity, number> = {
      [SecuritySeverity.LOW]: 0,
      [SecuritySeverity.MEDIUM]: 0,
      [SecuritySeverity.HIGH]: 0,
      [SecuritySeverity.CRITICAL]: 0,
    };
    
    const byType: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    
    for (const event of recentEvents) {
      bySeverity[event.severity]++;
      byType[event.type] = (byType[event.type] || 0) + 1;
      if (event.ip) {
        ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
      }
    }
    
    const topIPs = Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
    
    return {
      total: recentEvents.length,
      bySeverity,
      byType,
      topIPs,
    };
  }
}

// 创建全局实例
export const securityMonitor = new SecurityMonitor();

// 辅助函数：从请求中提取信息
export function extractRequestInfo(request: NextRequest): {
  ip: string;
  userAgent: string;
  requestId: string;
  url: string;
  method: string;
} {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  return {
    ip: cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
    url: request.url,
    method: request.method,
  };
}

// 快捷日志函数
export function logSecurityEvent(
  type: SecurityEventType,
  severity: SecuritySeverity,
  details: any,
  request?: NextRequest
): void {
  const requestInfo = request ? extractRequestInfo(request) : {};
  
  securityMonitor.logEvent({
    type,
    severity,
    details,
    ...requestInfo,
  });
}

// 检测可疑模式
export function detectSuspiciousPatterns(input: string): {
  detected: boolean;
  patterns: string[];
} {
  const patterns: string[] = [];
  
  // SQL注入模式
  if (/(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i.test(input)) {
    patterns.push('sql_injection');
  }
  
  // XSS模式
  if (/<script|javascript:|on\w+=/i.test(input)) {
    patterns.push('xss');
  }
  
  // 路径遍历
  if (/\.\.\/|\.\.\\/.test(input)) {
    patterns.push('path_traversal');
  }
  
  // 命令注入
  if (/[;&|`$()]/.test(input)) {
    patterns.push('command_injection');
  }
  
  return {
    detected: patterns.length > 0,
    patterns,
  };
}