/**
 * A/B测试框架
 * 支持工具效果对比、参数优化和用户体验测试
 */

export interface ABTestConfig {
  testId: string;
  testName: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: number;
  endDate?: number;
  targetUsers: {
    percentage: number;
    criteria?: {
      newUsers?: boolean;
      skillLevel?: 'beginner' | 'intermediate' | 'advanced';
      deviceType?: string[];
      activeUsers?: boolean;
    };
  };
  variants: ABTestVariant[];
  metrics: ABTestMetric[];
  trafficSplit: Record<string, number>; // variant -> percentage
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  changes: {
    type: 'tool' | 'parameter' | 'ui' | 'prompt' | 'algorithm';
    target: string;
    value: any;
    condition?: string;
  }[];
  isControl?: boolean;
}

export interface ABTestMetric {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'quality' | 'performance' | 'satisfaction';
  target: string; // 目标值
  unit: string;
  higherIsBetter: boolean;
  significance: number; // 显著性水平
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  metrics: Record<string, number>;
  context: {
    deviceType: string;
    userAgent: string;
    networkSpeed: string;
    timeOfDay: number;
    dayOfWeek: number;
  };
  completed: boolean;
}

export interface ABTestAnalysis {
  testId: string;
  status: 'running' | 'conclusive' | 'inconclusive';
  totalSamples: number;
  results: {
    variantId: string;
    variantName: string;
    sampleSize: number;
    metrics: Record<string, {
      value: number;
      confidenceInterval: [number, number];
      pValue: number;
      isSignificant: boolean;
      improvement: number; // vs control
    }>;
  }[];
  winner?: {
    variantId: string;
    confidence: number;
    improvement: Record<string, number>;
  };
  recommendations: string[];
}

class ABTestFramework {
  private activeTests: Map<string, ABTestConfig> = new Map();
  private testResults: Map<string, ABTestResult[]> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private testHistory: ABTestConfig[] = [];

  constructor() {
    this.loadActiveTests();
  }

  /**
   * 创建A/B测试
   */
  createTest(config: ABTestConfig): void {
    // 验证配置
    this.validateTestConfig(config);
    
    // 设置默认流量分配
    if (!config.trafficSplit || Object.keys(config.trafficSplit).length === 0) {
      const equalSplit = 1 / config.variants.length;
      config.trafficSplit = config.variants.reduce((split, variant) => {
        split[variant.id] = equalSplit;
        return split;
      }, {} as Record<string, number>);
    }

    config.status = 'draft';
    this.activeTests.set(config.testId, config);
    this.persistTestConfig(config);
  }

  /**
   * 启动A/B测试
   */
  startTest(testId: string): void {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = 'active';
    test.startDate = Date.now();
    this.activeTests.set(testId, test);
    this.persistTestConfig(test);
  }

  /**
   * 获取用户的测试分组
   */
  getUserVariant(userId: string, testId: string, context: {
    deviceType: string;
    userAgent: string;
    isNewUser: boolean;
    userSkillLevel: string;
  }): string | null {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'active') {
      return null;
    }

    // 检查用户是否符合目标条件
    if (!this.isUserEligible(userId, test, context)) {
      return null;
    }

    // 检查是否已有分配
    if (this.userAssignments.has(userId)) {
      const userTests = this.userAssignments.get(userId)!;
      if (userTests.has(testId)) {
        return userTests.get(testId)!;
      }
    }

    // 进行分组
    const variant = this.assignUserToVariant(userId, test);
    
    // 记录分配
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(testId, variant.id);

    return variant.id;
  }

  /**
   * 记录测试结果
   */
  recordTestResult(result: ABTestResult): void {
    if (!this.testResults.has(result.testId)) {
      this.testResults.set(result.testId, []);
    }

    const results = this.testResults.get(result.testId)!;
    results.push(result);

    // 异步持久化
    this.persistTestResult(result);

    // 检查是否需要自动停止测试
    this.checkAutoStop(result.testId);
  }

  /**
   * 分析测试结果
   */
  analyzeTest(testId: string): ABTestAnalysis {
    const test = this.activeTests.get(testId);
    const results = this.testResults.get(testId) || [];

    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const analysis: ABTestAnalysis = {
      testId,
      status: 'running',
      totalSamples: results.length,
      results: [],
      recommendations: []
    };

    // 按变体分组结果
    const variantResults = new Map<string, ABTestResult[]>();
    for (const result of results) {
      if (!variantResults.has(result.variantId)) {
        variantResults.set(result.variantId, []);
      }
      variantResults.get(result.variantId)!.push(result);
    }

    // 找到控制组
    const controlVariant = test.variants.find(v => v.isControl);
    const controlResults = controlVariant ? variantResults.get(controlVariant.id) || [] : [];

    // 分析每个变体
    for (const variant of test.variants) {
      const variantData = variantResults.get(variant.id) || [];
      
      const metrics: Record<string, any> = {};
      
      for (const metric of test.metrics) {
        const values = variantData
          .filter(r => r.metrics[metric.id] !== undefined)
          .map(r => r.metrics[metric.id]);

        if (values.length === 0) continue;

        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // 计算置信区间
        const confidenceInterval = this.calculateConfidenceInterval(mean, stdDev, values.length);
        
        // 与控制组比较
        let pValue = 1;
        let improvement = 0;
        let isSignificant = false;

        if (controlResults.length > 0 && !variant.isControl) {
          const controlValues = controlResults
            .filter(r => r.metrics[metric.id] !== undefined)
            .map(r => r.metrics[metric.id]);
          
          if (controlValues.length > 0) {
            const controlMean = controlValues.reduce((sum, v) => sum + v, 0) / controlValues.length;
            pValue = this.calculatePValue(values, controlValues);
            improvement = ((mean - controlMean) / controlMean) * 100;
            isSignificant = pValue < metric.significance;
          }
        }

        metrics[metric.id] = {
          value: mean,
          confidenceInterval,
          pValue,
          isSignificant,
          improvement
        };
      }

      analysis.results.push({
        variantId: variant.id,
        variantName: variant.name,
        sampleSize: variantData.length,
        metrics
      });
    }

    // 确定测试状态和获胜者
    this.determineTestOutcome(analysis, test);

    // 生成建议
    analysis.recommendations = this.generateRecommendations(analysis, test);

    return analysis;
  }

  /**
   * 获取工具效果对比测试
   */
  createToolComparisonTest(
    testName: string,
    toolA: string,
    toolB: string,
    targetMetrics: string[] = ['quality', 'satisfaction', 'generationTime']
  ): ABTestConfig {
    const testId = `tool-comparison-${Date.now()}`;
    
    return {
      testId,
      testName: `${testName}: ${toolA} vs ${toolB}`,
      description: `比较 ${toolA} 和 ${toolB} 两个工具的效果`,
      status: 'draft',
      startDate: Date.now(),
      targetUsers: {
        percentage: 0.2, // 20%用户参与
        criteria: {
          activeUsers: true
        }
      },
      variants: [
        {
          id: 'control',
          name: toolA,
          description: `使用 ${toolA} 工具`,
          changes: [
            {
              type: 'tool',
              target: 'selectedTool',
              value: toolA
            }
          ],
          isControl: true
        },
        {
          id: 'variant',
          name: toolB,
          description: `使用 ${toolB} 工具`,
          changes: [
            {
              type: 'tool',
              target: 'selectedTool',
              value: toolB
            }
          ]
        }
      ],
      metrics: targetMetrics.map(metric => ({
        id: metric,
        name: this.getMetricDisplayName(metric),
        type: this.getMetricType(metric),
        target: this.getMetricTarget(metric),
        unit: this.getMetricUnit(metric),
        higherIsBetter: this.isMetricHigherBetter(metric),
        significance: 0.05
      })),
      trafficSplit: {
        'control': 0.5,
        'variant': 0.5
      }
    };
  }

  /**
   * 创建参数优化测试
   */
  createParameterOptimizationTest(
    testName: string,
    toolId: string,
    parameterName: string,
    values: any[]
  ): ABTestConfig {
    const testId = `param-optimization-${Date.now()}`;
    
    const variants = values.map((value, index) => ({
      id: `param-${index}`,
      name: `${parameterName}=${value}`,
      description: `设置 ${parameterName} 参数为 ${value}`,
      changes: [
        {
          type: 'parameter' as const,
          target: parameterName,
          value,
          condition: `toolId === '${toolId}'`
        }
      ],
      isControl: index === 0
    }));

    const trafficSplit = variants.reduce((split, variant) => {
      split[variant.id] = 1 / variants.length;
      return split;
    }, {} as Record<string, number>);

    return {
      testId,
      testName: `${testName}: ${toolId} 参数优化`,
      description: `测试 ${toolId} 工具的 ${parameterName} 参数不同值的效果`,
      status: 'draft',
      startDate: Date.now(),
      targetUsers: {
        percentage: 0.3,
        criteria: {
          skillLevel: 'intermediate'
        }
      },
      variants,
      metrics: [
        {
          id: 'quality',
          name: '图像质量',
          type: 'quality',
          target: '80',
          unit: 'score',
          higherIsBetter: true,
          significance: 0.05
        },
        {
          id: 'satisfaction',
          name: '用户满意度',
          type: 'satisfaction',
          target: '4.0',
          unit: 'rating',
          higherIsBetter: true,
          significance: 0.05
        }
      ],
      trafficSplit
    };
  }

  /**
   * 获取正在进行的测试列表
   */
  getActiveTests(): ABTestConfig[] {
    return Array.from(this.activeTests.values()).filter(test => test.status === 'active');
  }

  /**
   * 获取测试统计信息
   */
  getTestStats(testId: string): {
    totalSamples: number;
    variantDistribution: Record<string, number>;
    conversionRates: Record<string, number>;
    averageMetrics: Record<string, Record<string, number>>;
  } {
    const results = this.testResults.get(testId) || [];
    const test = this.activeTests.get(testId);
    
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const variantDistribution: Record<string, number> = {};
    const variantMetrics: Record<string, number[]> = {};
    const conversions: Record<string, number> = {};

    // 统计分布和指标
    for (const result of results) {
      variantDistribution[result.variantId] = (variantDistribution[result.variantId] || 0) + 1;
      
      if (result.completed) {
        conversions[result.variantId] = (conversions[result.variantId] || 0) + 1;
      }

      for (const [metricId, value] of Object.entries(result.metrics)) {
        const key = `${result.variantId}-${metricId}`;
        if (!variantMetrics[key]) {
          variantMetrics[key] = [];
        }
        variantMetrics[key].push(value);
      }
    }

    // 计算转化率
    const conversionRates: Record<string, number> = {};
    for (const [variantId, total] of Object.entries(variantDistribution)) {
      conversionRates[variantId] = (conversions[variantId] || 0) / total;
    }

    // 计算平均指标
    const averageMetrics: Record<string, Record<string, number>> = {};
    for (const [key, values] of Object.entries(variantMetrics)) {
      const [variantId, metricId] = key.split('-');
      if (!averageMetrics[variantId]) {
        averageMetrics[variantId] = {};
      }
      averageMetrics[variantId][metricId] = values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    return {
      totalSamples: results.length,
      variantDistribution,
      conversionRates,
      averageMetrics
    };
  }

  /**
   * 停止测试
   */
  stopTest(testId: string, reason?: string): void {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    test.status = 'completed';
    test.endDate = Date.now();
    
    // 移动到历史记录
    this.testHistory.push(test);
    this.activeTests.delete(testId);
    
    this.persistTestConfig(test);
  }

  // 私有方法实现
  private validateTestConfig(config: ABTestConfig): void {
    if (!config.testId || !config.testName) {
      throw new Error('Test ID and name are required');
    }

    if (config.variants.length < 2) {
      throw new Error('At least 2 variants are required');
    }

    if (config.targetUsers.percentage <= 0 || config.targetUsers.percentage > 1) {
      throw new Error('Target user percentage must be between 0 and 1');
    }

    // 检查流量分配是否合理
    if (config.trafficSplit) {
      const totalTraffic = Object.values(config.trafficSplit).reduce((sum, p) => sum + p, 0);
      if (Math.abs(totalTraffic - 1) > 0.01) {
        throw new Error('Traffic split must sum to 1');
      }
    }
  }

  private isUserEligible(userId: string, test: ABTestConfig, context: any): boolean {
    const criteria = test.targetUsers.criteria;
    if (!criteria) return true;

    // 新用户条件
    if (criteria.newUsers !== undefined && criteria.newUsers !== context.isNewUser) {
      return false;
    }

    // 技能等级条件
    if (criteria.skillLevel && criteria.skillLevel !== context.userSkillLevel) {
      return false;
    }

    // 设备类型条件
    if (criteria.deviceType && !criteria.deviceType.includes(context.deviceType)) {
      return false;
    }

    // 随机采样
    const hash = this.hashString(userId + test.testId);
    const probability = (hash % 10000) / 10000;
    return probability < test.targetUsers.percentage;
  }

  private assignUserToVariant(userId: string, test: ABTestConfig): ABTestVariant {
    const hash = this.hashString(userId + test.testId + 'variant');
    const probability = (hash % 10000) / 10000;
    
    let cumulativeProb = 0;
    for (const variant of test.variants) {
      cumulativeProb += test.trafficSplit[variant.id];
      if (probability <= cumulativeProb) {
        return variant;
      }
    }
    
    return test.variants[0]; // fallback
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateConfidenceInterval(mean: number, stdDev: number, n: number): [number, number] {
    const tScore = 1.96; // 95% confidence interval
    const margin = tScore * (stdDev / Math.sqrt(n));
    return [mean - margin, mean + margin];
  }

  private calculatePValue(sample1: number[], sample2: number[]): number {
    // 简化的t检验实现
    if (sample1.length < 2 || sample2.length < 2) return 1;

    const mean1 = sample1.reduce((sum, v) => sum + v, 0) / sample1.length;
    const mean2 = sample2.reduce((sum, v) => sum + v, 0) / sample2.length;
    
    const var1 = sample1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / (sample1.length - 1);
    const var2 = sample2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / (sample2.length - 1);
    
    const pooledVar = ((sample1.length - 1) * var1 + (sample2.length - 1) * var2) / 
                     (sample1.length + sample2.length - 2);
    
    const tStat = (mean1 - mean2) / Math.sqrt(pooledVar * (1/sample1.length + 1/sample2.length));
    
    // 简化的p值估算（实际应用中应使用更准确的t分布）
    return Math.max(0.001, Math.min(0.999, Math.abs(tStat) / 3));
  }

  private determineTestOutcome(analysis: ABTestAnalysis, test: ABTestConfig): void {
    let hasSignificantResults = false;
    let bestVariant: any = null;
    let bestScore = -Infinity;

    for (const result of analysis.results) {
      let score = 0;
      let significantMetrics = 0;

      for (const metric of test.metrics) {
        const metricResult = result.metrics[metric.id];
        if (metricResult && metricResult.isSignificant) {
          significantMetrics++;
          hasSignificantResults = true;
          
          // 计算综合分数
          const normalizedImprovement = Math.max(-100, Math.min(100, metricResult.improvement));
          score += normalizedImprovement * (metric.higherIsBetter ? 1 : -1);
        }
      }

      if (score > bestScore && significantMetrics > 0) {
        bestScore = score;
        bestVariant = result;
      }
    }

    if (hasSignificantResults && bestVariant && analysis.totalSamples >= 100) {
      analysis.status = 'conclusive';
      analysis.winner = {
        variantId: bestVariant.variantId,
        confidence: 0.95,
        improvement: Object.entries(bestVariant.metrics).reduce((acc, [metricId, data]: [string, any]) => {
          acc[metricId] = data.improvement;
          return acc;
        }, {} as Record<string, number>)
      };
    } else if (analysis.totalSamples >= 1000) {
      analysis.status = 'inconclusive';
    }
  }

  private generateRecommendations(analysis: ABTestAnalysis, test: ABTestConfig): string[] {
    const recommendations: string[] = [];

    if (analysis.status === 'conclusive' && analysis.winner) {
      const winner = test.variants.find(v => v.id === analysis.winner!.variantId);
      recommendations.push(`建议采用变体 "${winner?.name}"，在关键指标上有显著改善`);
      
      const improvements = Object.entries(analysis.winner.improvement)
        .filter(([_, improvement]) => Math.abs(improvement) > 5)
        .map(([metric, improvement]) => `${metric}: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);
      
      if (improvements.length > 0) {
        recommendations.push(`主要改善: ${improvements.join(', ')}`);
      }
    } else if (analysis.status === 'inconclusive') {
      recommendations.push('测试结果不显著，建议延长测试时间或增加样本量');
      
      if (analysis.totalSamples < 500) {
        recommendations.push('当前样本量较小，建议继续收集数据');
      }
    } else {
      recommendations.push('测试仍在进行中，建议继续收集数据');
      
      const minSamples = 100;
      const remainingSamples = Math.max(0, minSamples - analysis.totalSamples);
      if (remainingSamples > 0) {
        recommendations.push(`建议至少再收集 ${remainingSamples} 个样本`);
      }
    }

    return recommendations;
  }

  private checkAutoStop(testId: string): void {
    const analysis = this.analyzeTest(testId);
    
    // 自动停止条件
    if (analysis.status === 'conclusive' && analysis.totalSamples >= 500) {
      // 如果有明确的获胜者且样本充足，考虑自动停止
      console.log(`Test ${testId} reached conclusive results. Consider stopping.`);
    } else if (analysis.totalSamples >= 5000) {
      // 如果样本量很大但仍无结论，可能需要重新设计测试
      console.log(`Test ${testId} has large sample but inconclusive results. Consider redesigning.`);
    }
  }

  private getMetricDisplayName(metric: string): string {
    const names: Record<string, string> = {
      'quality': '图像质量',
      'satisfaction': '用户满意度',
      'generationTime': '生成时间',
      'conversionRate': '转化率',
      'engagement': '用户参与度'
    };
    return names[metric] || metric;
  }

  private getMetricType(metric: string): ABTestMetric['type'] {
    const types: Record<string, ABTestMetric['type']> = {
      'quality': 'quality',
      'satisfaction': 'satisfaction',
      'generationTime': 'performance',
      'conversionRate': 'conversion',
      'engagement': 'engagement'
    };
    return types[metric] || 'engagement';
  }

  private getMetricTarget(metric: string): string {
    const targets: Record<string, string> = {
      'quality': '80',
      'satisfaction': '4.0',
      'generationTime': '30',
      'conversionRate': '0.1',
      'engagement': '5'
    };
    return targets[metric] || '1';
  }

  private getMetricUnit(metric: string): string {
    const units: Record<string, string> = {
      'quality': 'score',
      'satisfaction': 'rating',
      'generationTime': 'seconds',
      'conversionRate': 'rate',
      'engagement': 'actions'
    };
    return units[metric] || 'count';
  }

  private isMetricHigherBetter(metric: string): boolean {
    const higherIsBetter: Record<string, boolean> = {
      'quality': true,
      'satisfaction': true,
      'generationTime': false,
      'conversionRate': true,
      'engagement': true
    };
    return higherIsBetter[metric] ?? true;
  }

  private loadActiveTests(): void {
    // 从持久化存储加载测试配置
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('abTests');
      if (stored) {
        try {
          const tests = JSON.parse(stored);
          for (const test of tests) {
            if (test.status === 'active') {
              this.activeTests.set(test.testId, test);
            }
          }
        } catch (e) {
          console.warn('Failed to load A/B tests:', e);
        }
      }
    }
  }

  private persistTestConfig(test: ABTestConfig): void {
    // 持久化测试配置
    if (typeof window !== 'undefined') {
      try {
        const allTests = [...Array.from(this.activeTests.values()), ...this.testHistory];
        localStorage.setItem('abTests', JSON.stringify(allTests));
      } catch (e) {
        console.warn('Failed to persist test config:', e);
      }
    }
  }

  private persistTestResult(result: ABTestResult): void {
    // 持久化测试结果（实际应用中应该发送到服务器）
    if (typeof window !== 'undefined') {
      try {
        const key = `testResults_${result.testId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(result);
        // 只保留最近1000个结果
        if (existing.length > 1000) {
          existing.splice(0, existing.length - 1000);
        }
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (e) {
        console.warn('Failed to persist test result:', e);
      }
    }
  }
}

export const abTestFramework = new ABTestFramework();