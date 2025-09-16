/**
 * ML模型监控服务
 * 监控模型性能、数据漂移、系统健康状况等
 */

import { recordMetric, recordMetrics } from '@/app/api/metrics/route';

export interface ModelPerformanceMetrics {
  modelId: string;
  timestamp: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number; // ms
  throughput: number; // requests/second
  errorRate: number;
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
}

export interface DataDriftMetrics {
  featureName: string;
  timestamp: number;
  driftScore: number; // 0-1, higher means more drift
  pValue: number;
  referenceDistribution: number[];
  currentDistribution: number[];
  threshold: number;
  isDrifting: boolean;
}

export interface ModelHealthStatus {
  modelId: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  lastHealthCheck: number;
  issues: string[];
  recommendations: string[];
  uptime: number;
  version: string;
}

export interface AlertConfig {
  alertId: string;
  name: string;
  description: string;
  condition: string; // 'accuracy < 0.7' | 'latency > 1000' | 'errorRate > 0.05'
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  recipients: string[];
  throttleMinutes: number;
}

export interface MLAlert {
  alertId: string;
  triggeredAt: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  modelId?: string;
  metricName: string;
  currentValue: number;
  threshold: number;
  resolved: boolean;
  resolvedAt?: number;
}

class MLMonitoringService {
  private performanceHistory: Map<string, ModelPerformanceMetrics[]> = new Map();
  private driftHistory: Map<string, DataDriftMetrics[]> = new Map();
  private healthStatus: Map<string, ModelHealthStatus> = new Map();
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private activeAlerts: Map<string, MLAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  // 性能阈值配置
  private performanceThresholds = {
    accuracy: { warning: 0.75, critical: 0.6 },
    latency: { warning: 1000, critical: 2000 },
    errorRate: { warning: 0.05, critical: 0.1 },
    memoryUsage: { warning: 512, critical: 1024 },
    cpuUsage: { warning: 70, critical: 90 }
  };

  // 数据漂移阈值
  private driftThresholds = {
    moderate: 0.3,
    significant: 0.7,
    severe: 0.9
  };

  constructor() {
    this.initializeMonitoring();
    this.setupDefaultAlerts();
  }

  /**
   * 记录模型性能指标
   */
  async recordModelPerformance(metrics: ModelPerformanceMetrics): Promise<void> {
    const { modelId } = metrics;
    
    // 存储历史数据
    if (!this.performanceHistory.has(modelId)) {
      this.performanceHistory.set(modelId, []);
    }
    
    const history = this.performanceHistory.get(modelId)!;
    history.push(metrics);
    
    // 保持最近1000条记录
    if (history.length > 1000) {
      history.shift();
    }
    
    // 记录到监控系统
    await this.recordMetricsToSystem(modelId, metrics);
    
    // 检查性能告警
    await this.checkPerformanceAlerts(metrics);
    
    // 更新健康状态
    this.updateModelHealth(modelId, metrics);
  }

  /**
   * 检测数据漂移
   */
  async detectDataDrift(
    featureName: string,
    currentData: number[],
    referenceData: number[],
    threshold = 0.3
  ): Promise<DataDriftMetrics> {
    const driftScore = this.calculateKSStatistic(currentData, referenceData);
    const pValue = this.calculateKSPValue(driftScore, currentData.length, referenceData.length);
    const isDrifting = driftScore > threshold;

    const driftMetrics: DataDriftMetrics = {
      featureName,
      timestamp: Date.now(),
      driftScore,
      pValue,
      referenceDistribution: this.calculateDistribution(referenceData),
      currentDistribution: this.calculateDistribution(currentData),
      threshold,
      isDrifting
    };

    // 存储漂移历史
    if (!this.driftHistory.has(featureName)) {
      this.driftHistory.set(featureName, []);
    }
    
    const history = this.driftHistory.get(featureName)!;
    history.push(driftMetrics);
    
    // 保持最近500条记录
    if (history.length > 500) {
      history.shift();
    }

    // 记录漂移指标
    await recordMetrics({
      [`ml_drift_score_${featureName}`]: driftScore,
      [`ml_drift_pvalue_${featureName}`]: pValue,
    });

    // 检查漂移告警
    if (isDrifting) {
      await this.triggerDriftAlert(featureName, driftMetrics);
    }

    return driftMetrics;
  }

  /**
   * 批量检测所有特征的数据漂移
   */
  async detectAllFeatureDrift(
    currentFeatures: Record<string, number[]>,
    referenceFeatures: Record<string, number[]>
  ): Promise<DataDriftMetrics[]> {
    const driftResults: DataDriftMetrics[] = [];

    for (const [featureName, currentData] of Object.entries(currentFeatures)) {
      if (referenceFeatures[featureName]) {
        const driftMetrics = await this.detectDataDrift(
          featureName,
          currentData,
          referenceFeatures[featureName]
        );
        driftResults.push(driftMetrics);
      }
    }

    // 计算整体漂移分数
    const overallDriftScore = driftResults.reduce((sum, d) => sum + d.driftScore, 0) / driftResults.length;
    await recordMetric('ml_overall_drift_score', overallDriftScore);

    return driftResults;
  }

  /**
   * 获取模型健康状态
   */
  getModelHealth(modelId: string): ModelHealthStatus | null {
    return this.healthStatus.get(modelId) || null;
  }

  /**
   * 获取所有模型健康状态
   */
  getAllModelHealth(): ModelHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * 设置告警规则
   */
  setAlertRule(config: AlertConfig): void {
    this.alertConfigs.set(config.alertId, config);
    this.persistAlertConfig(config);
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): MLAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * 解决告警
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.persistAlert(alert);
    }
  }

  /**
   * 生成模型性能报告
   */
  generatePerformanceReport(modelId: string, hours = 24): {
    summary: {
      avgAccuracy: number;
      avgLatency: number;
      totalRequests: number;
      errorRate: number;
    };
    trends: {
      accuracyTrend: 'improving' | 'stable' | 'degrading';
      latencyTrend: 'improving' | 'stable' | 'degrading';
    };
    alerts: MLAlert[];
    recommendations: string[];
  } {
    const history = this.performanceHistory.get(modelId) || [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentMetrics = history.filter(m => m.timestamp >= cutoff);

    if (recentMetrics.length === 0) {
      return {
        summary: { avgAccuracy: 0, avgLatency: 0, totalRequests: 0, errorRate: 0 },
        trends: { accuracyTrend: 'stable', latencyTrend: 'stable' },
        alerts: [],
        recommendations: ['缺少性能数据，建议增加监控采样']
      };
    }

    // 计算总结指标
    const summary = {
      avgAccuracy: recentMetrics.reduce((sum, m) => sum + m.accuracy, 0) / recentMetrics.length,
      avgLatency: recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length,
      totalRequests: recentMetrics.reduce((sum, m) => sum + m.throughput, 0),
      errorRate: recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length
    };

    // 分析趋势
    const trends = {
      accuracyTrend: this.calculateTrend(recentMetrics.map(m => m.accuracy)),
      latencyTrend: this.calculateTrend(recentMetrics.map(m => m.latency), false) // 延迟越低越好
    };

    // 获取相关告警
    const modelAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.modelId === modelId && alert.triggeredAt >= cutoff);

    // 生成建议
    const recommendations = this.generatePerformanceRecommendations(summary, trends, modelAlerts);

    return { summary, trends, alerts: modelAlerts, recommendations };
  }

  /**
   * 开始监控
   */
  startMonitoring(intervalMinutes = 5): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
      await this.cleanupOldData();
      await this.updateSystemMetrics();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // 私有方法实现
  private async recordMetricsToSystem(modelId: string, metrics: ModelPerformanceMetrics): Promise<void> {
    const metricsToRecord = {
      [`ml_model_accuracy_${modelId}`]: metrics.accuracy,
      [`ml_model_latency_${modelId}`]: metrics.latency,
      [`ml_model_throughput_${modelId}`]: metrics.throughput,
      [`ml_model_error_rate_${modelId}`]: metrics.errorRate,
      [`ml_model_memory_usage_${modelId}`]: metrics.memoryUsage,
      [`ml_model_cpu_usage_${modelId}`]: metrics.cpuUsage,
    };

    await recordMetrics(metricsToRecord);
  }

  private async checkPerformanceAlerts(metrics: ModelPerformanceMetrics): Promise<void> {
    const checks = [
      {
        metric: 'accuracy',
        value: metrics.accuracy,
        condition: (v: number) => v < this.performanceThresholds.accuracy.critical,
        severity: 'critical' as const,
        message: `模型准确率过低: ${(metrics.accuracy * 100).toFixed(2)}%`
      },
      {
        metric: 'latency',
        value: metrics.latency,
        condition: (v: number) => v > this.performanceThresholds.latency.critical,
        severity: 'critical' as const,
        message: `模型响应时间过长: ${metrics.latency}ms`
      },
      {
        metric: 'errorRate',
        value: metrics.errorRate,
        condition: (v: number) => v > this.performanceThresholds.errorRate.warning,
        severity: 'warning' as const,
        message: `模型错误率偏高: ${(metrics.errorRate * 100).toFixed(2)}%`
      },
      {
        metric: 'memoryUsage',
        value: metrics.memoryUsage,
        condition: (v: number) => v > this.performanceThresholds.memoryUsage.warning,
        severity: 'warning' as const,
        message: `内存使用量偏高: ${metrics.memoryUsage}MB`
      }
    ];

    for (const check of checks) {
      if (check.condition(check.value)) {
        await this.triggerAlert({
          alertId: `${metrics.modelId}_${check.metric}_${Date.now()}`,
          triggeredAt: Date.now(),
          severity: check.severity,
          message: check.message,
          modelId: metrics.modelId,
          metricName: check.metric,
          currentValue: check.value,
          threshold: this.getThreshold(check.metric, check.severity),
          resolved: false
        });
      }
    }
  }

  private updateModelHealth(modelId: string, metrics: ModelPerformanceMetrics): void {
    const issues: string[] = [];
    let status: ModelHealthStatus['status'] = 'healthy';

    // 检查各项指标
    if (metrics.accuracy < this.performanceThresholds.accuracy.critical) {
      issues.push('准确率过低');
      status = 'critical';
    } else if (metrics.accuracy < this.performanceThresholds.accuracy.warning) {
      issues.push('准确率偏低');
      if (status === 'healthy') status = 'warning';
    }

    if (metrics.latency > this.performanceThresholds.latency.critical) {
      issues.push('响应时间过长');
      status = 'critical';
    } else if (metrics.latency > this.performanceThresholds.latency.warning) {
      issues.push('响应时间偏长');
      if (status === 'healthy') status = 'warning';
    }

    if (metrics.errorRate > this.performanceThresholds.errorRate.critical) {
      issues.push('错误率过高');
      status = 'critical';
    } else if (metrics.errorRate > this.performanceThresholds.errorRate.warning) {
      issues.push('错误率偏高');
      if (status === 'healthy') status = 'warning';
    }

    // 生成建议
    const recommendations = this.generateHealthRecommendations(issues, metrics);

    const healthStatus: ModelHealthStatus = {
      modelId,
      status,
      lastHealthCheck: Date.now(),
      issues,
      recommendations,
      uptime: this.calculateUptime(modelId),
      version: '1.0.0' // 这里应该从模型元数据获取
    };

    this.healthStatus.set(modelId, healthStatus);
  }

  private calculateKSStatistic(sample1: number[], sample2: number[]): number {
    // Kolmogorov-Smirnov统计量计算
    const combined = [...sample1, ...sample2].sort((a, b) => a - b);
    const uniqueValues = [...new Set(combined)];
    
    let maxDiff = 0;
    
    for (const value of uniqueValues) {
      const cdf1 = sample1.filter(x => x <= value).length / sample1.length;
      const cdf2 = sample2.filter(x => x <= value).length / sample2.length;
      const diff = Math.abs(cdf1 - cdf2);
      maxDiff = Math.max(maxDiff, diff);
    }
    
    return maxDiff;
  }

  private calculateKSPValue(ksStatistic: number, n1: number, n2: number): number {
    // 简化的KS检验p值计算
    const n = (n1 * n2) / (n1 + n2);
    const lambda = ksStatistic * Math.sqrt(n);
    
    // 近似计算p值
    return Math.max(0.001, 2 * Math.exp(-2 * lambda * lambda));
  }

  private calculateDistribution(data: number[], bins = 10): number[] {
    if (data.length === 0) return new Array(bins).fill(0);
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    const distribution = new Array(bins).fill(0);
    
    for (const value of data) {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      distribution[binIndex]++;
    }
    
    // 归一化
    return distribution.map(count => count / data.length);
  }

  private async triggerDriftAlert(featureName: string, driftMetrics: DataDriftMetrics): Promise<void> {
    const severity = driftMetrics.driftScore > this.driftThresholds.severe ? 'critical' :
                    driftMetrics.driftScore > this.driftThresholds.significant ? 'warning' : 'info';
    
    const alert: MLAlert = {
      alertId: `drift_${featureName}_${Date.now()}`,
      triggeredAt: Date.now(),
      severity,
      message: `特征 ${featureName} 检测到数据漂移 (漂移分数: ${driftMetrics.driftScore.toFixed(3)})`,
      metricName: 'data_drift',
      currentValue: driftMetrics.driftScore,
      threshold: driftMetrics.threshold,
      resolved: false
    };
    
    await this.triggerAlert(alert);
  }

  private async triggerAlert(alert: MLAlert): Promise<void> {
    // 检查是否需要节流
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(a => a.metricName === alert.metricName && 
                a.modelId === alert.modelId && 
                !a.resolved &&
                (Date.now() - a.triggeredAt) < 30 * 60 * 1000); // 30分钟内不重复告警

    if (existingAlert) {
      return; // 跳过重复告警
    }

    this.activeAlerts.set(alert.alertId, alert);
    this.persistAlert(alert);
    
    // 发送告警通知
    await this.sendAlertNotification(alert);
    
    // 记录告警指标
    await recordMetrics({
      'ml_alerts_total': this.activeAlerts.size,
      [`ml_alerts_${alert.severity}`]: 1
    });
  }

  private calculateTrend(values: number[], higherIsBetter = true): 'improving' | 'stable' | 'degrading' {
    if (values.length < 3) return 'stable';
    
    const recent = values.slice(-Math.min(5, values.length));
    const older = values.slice(0, Math.min(5, values.length));
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    const threshold = 0.05; // 5%变化阈值
    
    if (Math.abs(change) < threshold) return 'stable';
    
    const isImproving = higherIsBetter ? change > 0 : change < 0;
    return isImproving ? 'improving' : 'degrading';
  }

  private generatePerformanceRecommendations(
    summary: any,
    trends: any,
    alerts: MLAlert[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (summary.avgAccuracy < 0.7) {
      recommendations.push('模型准确率偏低，建议重新训练或调整参数');
    }
    
    if (summary.avgLatency > 1000) {
      recommendations.push('响应时间过长，建议优化模型或增加计算资源');
    }
    
    if (summary.errorRate > 0.05) {
      recommendations.push('错误率偏高，检查输入数据质量和模型稳定性');
    }
    
    if (trends.accuracyTrend === 'degrading') {
      recommendations.push('准确率呈下降趋势，建议监控数据漂移和模型老化');
    }
    
    if (trends.latencyTrend === 'degrading') {
      recommendations.push('响应时间呈上升趋势，建议检查系统负载和资源使用');
    }
    
    if (alerts.length > 5) {
      recommendations.push('告警数量较多，建议优先解决critical级别的问题');
    }
    
    return recommendations.slice(0, 5); // 最多5个建议
  }

  private generateHealthRecommendations(issues: string[], metrics: ModelPerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (issues.includes('准确率过低') || issues.includes('准确率偏低')) {
      recommendations.push('检查训练数据质量，考虑重新训练模型');
    }
    
    if (issues.includes('响应时间过长') || issues.includes('响应时间偏长')) {
      recommendations.push('优化模型架构或增加计算资源');
    }
    
    if (issues.includes('错误率过高') || issues.includes('错误率偏高')) {
      recommendations.push('检查输入数据验证和异常处理逻辑');
    }
    
    if (metrics.memoryUsage > this.performanceThresholds.memoryUsage.warning) {
      recommendations.push('监控内存使用，考虑优化模型大小');
    }
    
    if (metrics.cpuUsage > this.performanceThresholds.cpuUsage.warning) {
      recommendations.push('CPU使用率较高，考虑负载均衡或扩容');
    }
    
    return recommendations;
  }

  private calculateUptime(modelId: string): number {
    // 简化的运行时间计算
    const healthStatus = this.healthStatus.get(modelId);
    if (!healthStatus) return 0;
    
    return Date.now() - (healthStatus.lastHealthCheck || Date.now());
  }

  private getThreshold(metric: string, severity: 'warning' | 'critical'): number {
    const thresholds = this.performanceThresholds as any;
    return thresholds[metric]?.[severity] || 0;
  }

  private async performHealthChecks(): Promise<void> {
    // 执行定期健康检查
    for (const [modelId, health] of this.healthStatus.entries()) {
      if (Date.now() - health.lastHealthCheck > 10 * 60 * 1000) { // 10分钟无更新
        health.status = 'offline';
        health.issues.push('模型长时间无响应');
      }
    }
  }

  private async cleanupOldData(): Promise<void> {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7天
    
    // 清理旧的性能数据
    for (const [modelId, history] of this.performanceHistory.entries()) {
      const filtered = history.filter(m => m.timestamp >= cutoff);
      this.performanceHistory.set(modelId, filtered);
    }
    
    // 清理旧的漂移数据
    for (const [featureName, history] of this.driftHistory.entries()) {
      const filtered = history.filter(m => m.timestamp >= cutoff);
      this.driftHistory.set(featureName, filtered);
    }
    
    // 清理已解决的告警
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoff) {
        this.activeAlerts.delete(alertId);
      }
    }
  }

  private async updateSystemMetrics(): Promise<void> {
    const activeModels = this.healthStatus.size;
    const healthyModels = Array.from(this.healthStatus.values()).filter(h => h.status === 'healthy').length;
    const criticalModels = Array.from(this.healthStatus.values()).filter(h => h.status === 'critical').length;
    
    await recordMetrics({
      'ml_models_total': activeModels,
      'ml_models_healthy': healthyModels,
      'ml_models_critical': criticalModels,
      'ml_active_alerts_total': Array.from(this.activeAlerts.values()).filter(a => !a.resolved).length,
    });
  }

  private async sendAlertNotification(alert: MLAlert): Promise<void> {
    // 在实际应用中，这里会发送邮件、短信、Slack通知等
    console.log(`[ML Alert ${alert.severity.toUpperCase()}] ${alert.message}`);
    
    // 可以集成到通知服务
    // await notificationService.send({
    //   type: 'ml_alert',
    //   severity: alert.severity,
    //   message: alert.message,
    //   recipients: this.getAlertRecipients(alert)
    // });
  }

  private persistAlert(alert: MLAlert): void {
    // 在实际应用中，这里会保存到数据库
    if (typeof window !== 'undefined') {
      try {
        const alerts = JSON.parse(localStorage.getItem('ml_alerts') || '[]');
        alerts.push(alert);
        // 只保留最近100个告警
        if (alerts.length > 100) {
          alerts.shift();
        }
        localStorage.setItem('ml_alerts', JSON.stringify(alerts));
      } catch (e) {
        console.warn('Failed to persist alert:', e);
      }
    }
  }

  private persistAlertConfig(config: AlertConfig): void {
    // 持久化告警配置
    if (typeof window !== 'undefined') {
      try {
        const configs = Array.from(this.alertConfigs.values());
        localStorage.setItem('ml_alert_configs', JSON.stringify(configs));
      } catch (e) {
        console.warn('Failed to persist alert config:', e);
      }
    }
  }

  private initializeMonitoring(): void {
    // 加载持久化的配置和数据
    if (typeof window !== 'undefined') {
      try {
        // 加载告警配置
        const configs = JSON.parse(localStorage.getItem('ml_alert_configs') || '[]');
        for (const config of configs) {
          this.alertConfigs.set(config.alertId, config);
        }
        
        // 加载告警历史
        const alerts = JSON.parse(localStorage.getItem('ml_alerts') || '[]');
        for (const alert of alerts) {
          if (!alert.resolved) {
            this.activeAlerts.set(alert.alertId, alert);
          }
        }
      } catch (e) {
        console.warn('Failed to load monitoring data:', e);
      }
    }
  }

  private setupDefaultAlerts(): void {
    // 设置默认告警规则
    const defaultAlerts: AlertConfig[] = [
      {
        alertId: 'low_accuracy',
        name: '模型准确率告警',
        description: '模型准确率低于阈值时触发',
        condition: 'accuracy < 0.7',
        severity: 'warning',
        enabled: true,
        recipients: ['admin@example.com'],
        throttleMinutes: 30
      },
      {
        alertId: 'high_latency',
        name: '响应时间告警',
        description: '模型响应时间过长时触发',
        condition: 'latency > 1000',
        severity: 'warning',
        enabled: true,
        recipients: ['admin@example.com'],
        throttleMinutes: 15
      },
      {
        alertId: 'high_error_rate',
        name: '错误率告警',
        description: '模型错误率过高时触发',
        condition: 'errorRate > 0.05',
        severity: 'critical',
        enabled: true,
        recipients: ['admin@example.com'],
        throttleMinutes: 10
      }
    ];
    
    for (const alert of defaultAlerts) {
      this.setAlertRule(alert);
    }
  }
}

export const mlMonitoringService = new MLMonitoringService();