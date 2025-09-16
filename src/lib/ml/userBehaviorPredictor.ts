/**
 * 用户行为预测模型
 * 基于用户历史行为预测工具偏好和参数选择
 */

export interface UserBehaviorData {
  userId: string;
  sessionId: string;
  timestamp: number;
  toolId: string;
  toolCategory: string;
  parameters: Record<string, any>;
  imageCount: number;
  hasCustomPrompt: boolean;
  customPromptLength: number;
  generationTime: number;
  success: boolean;
  userSatisfaction?: number; // 1-5 rating
}

export interface UserPreference {
  favoriteCategories: string[];
  averageParameters: Record<string, any>;
  preferredImageCount: number;
  successRate: number;
  avgGenerationTime: number;
  complexityPreference: 'simple' | 'moderate' | 'complex';
}

export interface PredictionResult {
  recommendedTools: string[];
  suggestedParameters: Record<string, any>;
  confidenceScore: number;
  reasoning: string;
}

class UserBehaviorPredictor {
  private behaviorHistory: Map<string, UserBehaviorData[]> = new Map();
  private userPreferences: Map<string, UserPreference> = new Map();
  
  constructor() {
    this.initializeModel();
  }

  private initializeModel(): void {
    // 加载历史数据（从数据库或本地存储）
    this.loadHistoricalData();
  }

  /**
   * 记录用户行为
   */
  recordBehavior(data: UserBehaviorData): void {
    const userId = data.userId;
    
    if (!this.behaviorHistory.has(userId)) {
      this.behaviorHistory.set(userId, []);
    }
    
    const userBehavior = this.behaviorHistory.get(userId)!;
    userBehavior.push(data);
    
    // 保持最近100条记录
    if (userBehavior.length > 100) {
      userBehavior.shift();
    }
    
    // 更新用户偏好
    this.updateUserPreferences(userId);
    
    // 持久化数据
    this.persistBehaviorData(userId, data);
  }

  /**
   * 预测用户偏好工具
   */
  predictToolPreference(userId: string, context: {
    timeOfDay: number;
    dayOfWeek: number;
    deviceType: string;
    lastToolUsed?: string;
  }): PredictionResult {
    const userHistory = this.behaviorHistory.get(userId) || [];
    const userPref = this.userPreferences.get(userId);
    
    if (userHistory.length < 3) {
      return this.getDefaultRecommendation(context);
    }

    // 基于历史行为的工具推荐算法
    const toolUsageCount = this.calculateToolUsage(userHistory);
    const categoryPreferences = this.calculateCategoryPreferences(userHistory);
    const timeBasedPatterns = this.analyzeTimePatterns(userHistory, context);
    
    // 计算推荐分数
    const recommendations = this.calculateRecommendationScores(
      toolUsageCount,
      categoryPreferences,
      timeBasedPatterns,
      context
    );
    
    // 推荐参数
    const suggestedParams = this.predictParameters(userId, recommendations[0]?.toolId);
    
    return {
      recommendedTools: recommendations.slice(0, 5).map(r => r.toolId),
      suggestedParameters: suggestedParams,
      confidenceScore: this.calculateConfidence(userHistory.length, userPref?.successRate || 0),
      reasoning: this.generateReasoning(recommendations[0], userPref)
    };
  }

  /**
   * 分析用户成功率
   */
  analyzeUserSuccessRate(userId: string): {
    overallSuccessRate: number;
    toolSuccessRates: Record<string, number>;
    improvementSuggestions: string[];
  } {
    const userHistory = this.behaviorHistory.get(userId) || [];
    
    if (userHistory.length === 0) {
      return {
        overallSuccessRate: 0,
        toolSuccessRates: {},
        improvementSuggestions: ['开始使用工具来获得个性化建议']
      };
    }

    const successCount = userHistory.filter(h => h.success).length;
    const overallSuccessRate = successCount / userHistory.length;
    
    // 按工具统计成功率
    const toolStats = userHistory.reduce((acc, h) => {
      if (!acc[h.toolId]) {
        acc[h.toolId] = { total: 0, success: 0 };
      }
      acc[h.toolId].total++;
      if (h.success) acc[h.toolId].success++;
      return acc;
    }, {} as Record<string, { total: number; success: number }>);
    
    const toolSuccessRates = Object.entries(toolStats).reduce((acc, [toolId, stats]) => {
      acc[toolId] = stats.success / stats.total;
      return acc;
    }, {} as Record<string, number>);
    
    // 生成改进建议
    const improvementSuggestions = this.generateImprovementSuggestions(
      overallSuccessRate,
      toolSuccessRates,
      userHistory
    );
    
    return {
      overallSuccessRate,
      toolSuccessRates,
      improvementSuggestions
    };
  }

  private calculateToolUsage(history: UserBehaviorData[]): Record<string, number> {
    return history.reduce((acc, h) => {
      acc[h.toolId] = (acc[h.toolId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateCategoryPreferences(history: UserBehaviorData[]): Record<string, number> {
    const categoryCount = history.reduce((acc, h) => {
      acc[h.toolCategory] = (acc[h.toolCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const total = history.length;
    return Object.entries(categoryCount).reduce((acc, [category, count]) => {
      acc[category] = count / total;
      return acc;
    }, {} as Record<string, number>);
  }

  private analyzeTimePatterns(history: UserBehaviorData[], context: any): Record<string, number> {
    // 分析时间模式（简化版）
    const currentHour = context.timeOfDay;
    const relevantHistory = history.filter(h => {
      const hourDiff = Math.abs(new Date(h.timestamp).getHours() - currentHour);
      return hourDiff <= 2;
    });
    
    return this.calculateToolUsage(relevantHistory);
  }

  private calculateRecommendationScores(
    toolUsage: Record<string, number>,
    categoryPref: Record<string, number>,
    timePatterns: Record<string, number>,
    context: any
  ): Array<{ toolId: string; score: number; }> {
    // 综合评分算法
    const scores = new Map<string, number>();
    
    // 基于工具使用频率
    Object.entries(toolUsage).forEach(([toolId, count]) => {
      scores.set(toolId, (scores.get(toolId) || 0) + count * 0.4);
    });
    
    // 基于时间模式
    Object.entries(timePatterns).forEach(([toolId, count]) => {
      scores.set(toolId, (scores.get(toolId) || 0) + count * 0.3);
    });
    
    return Array.from(scores.entries())
      .map(([toolId, score]) => ({ toolId, score }))
      .sort((a, b) => b.score - a.score);
  }

  private predictParameters(userId: string, toolId?: string): Record<string, any> {
    if (!toolId) return {};
    
    const userHistory = this.behaviorHistory.get(userId) || [];
    const toolHistory = userHistory.filter(h => h.toolId === toolId);
    
    if (toolHistory.length === 0) return {};
    
    // 计算参数的平均值或最常用值
    const paramStats = toolHistory.reduce((acc, h) => {
      Object.entries(h.parameters).forEach(([key, value]) => {
        if (!acc[key]) acc[key] = [];
        acc[key].push(value);
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    // 返回最常用的参数组合
    return Object.entries(paramStats).reduce((acc, [key, values]) => {
      // 对于数值类型，计算平均值
      if (typeof values[0] === 'number') {
        acc[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
      } else {
        // 对于字符串类型，返回最常用的值
        const frequency = values.reduce((freq, v) => {
          freq[v] = (freq[v] || 0) + 1;
          return freq;
        }, {} as Record<string, number>);
        acc[key] = Object.entries(frequency)
          .sort((a, b) => b[1] - a[1])[0][0];
      }
      return acc;
    }, {} as Record<string, any>);
  }

  private calculateConfidence(historyLength: number, successRate: number): number {
    const lengthFactor = Math.min(historyLength / 20, 1); // 20次使用达到最高置信度
    const successFactor = successRate;
    return Math.round((lengthFactor * 0.6 + successFactor * 0.4) * 100) / 100;
  }

  private generateReasoning(topRecommendation: any, userPref?: UserPreference): string {
    if (!topRecommendation) return '基于默认推荐';
    
    const reasons = [];
    if (userPref?.successRate && userPref.successRate > 0.8) {
      reasons.push('您在此类工具上有很高的成功率');
    }
    
    reasons.push('基于您的历史使用模式');
    
    return reasons.join('，');
  }

  private generateImprovementSuggestions(
    overallRate: number,
    toolRates: Record<string, number>,
    history: UserBehaviorData[]
  ): string[] {
    const suggestions = [];
    
    if (overallRate < 0.6) {
      suggestions.push('尝试使用更详细的描述词来提高生成成功率');
      suggestions.push('选择与您内容匹配度更高的工具');
    }
    
    // 找出成功率最低的工具
    const worstTool = Object.entries(toolRates)
      .sort((a, b) => a[1] - b[1])[0];
    
    if (worstTool && worstTool[1] < 0.4) {
      suggestions.push(`考虑减少使用 ${worstTool[0]} 工具，或调整使用方式`);
    }
    
    // 分析参数复杂度
    const avgPromptLength = history.reduce((sum, h) => sum + h.customPromptLength, 0) / history.length;
    if (avgPromptLength < 20) {
      suggestions.push('尝试使用更详细的提示词描述');
    } else if (avgPromptLength > 200) {
      suggestions.push('尝试简化提示词，避免过于复杂的描述');
    }
    
    return suggestions;
  }

  private getDefaultRecommendation(context: any): PredictionResult {
    return {
      recommendedTools: ['textToImage', 'imageEditor', 'photoRestore'],
      suggestedParameters: {},
      confidenceScore: 0.3,
      reasoning: '基于新用户默认推荐'
    };
  }

  private updateUserPreferences(userId: string): void {
    const history = this.behaviorHistory.get(userId) || [];
    if (history.length < 3) return;
    
    const recent = history.slice(-20); // 最近20条记录
    
    const categoryCount = recent.reduce((acc, h) => {
      acc[h.toolCategory] = (acc[h.toolCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
    
    const successRate = recent.filter(h => h.success).length / recent.length;
    const avgGenerationTime = recent.reduce((sum, h) => sum + h.generationTime, 0) / recent.length;
    
    this.userPreferences.set(userId, {
      favoriteCategories,
      averageParameters: {},
      preferredImageCount: Math.round(recent.reduce((sum, h) => sum + h.imageCount, 0) / recent.length),
      successRate,
      avgGenerationTime,
      complexityPreference: this.determineComplexityPreference(recent)
    });
  }

  private determineComplexityPreference(history: UserBehaviorData[]): 'simple' | 'moderate' | 'complex' {
    const avgPromptLength = history.reduce((sum, h) => sum + h.customPromptLength, 0) / history.length;
    
    if (avgPromptLength < 50) return 'simple';
    if (avgPromptLength < 150) return 'moderate';
    return 'complex';
  }

  private loadHistoricalData(): void {
    // 从本地存储或数据库加载数据
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userBehaviorData');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.behaviorHistory = new Map(Object.entries(data));
        } catch (e) {
          console.warn('Failed to load behavior data:', e);
        }
      }
    }
  }

  private persistBehaviorData(userId: string, data: UserBehaviorData): void {
    // 持久化到本地存储（生产环境应该保存到数据库）
    if (typeof window !== 'undefined') {
      try {
        const allData = Object.fromEntries(this.behaviorHistory);
        localStorage.setItem('userBehaviorData', JSON.stringify(allData));
      } catch (e) {
        console.warn('Failed to persist behavior data:', e);
      }
    }
  }

  /**
   * 获取用户统计信息
   */
  getUserStats(userId: string): {
    totalGenerations: number;
    favoriteTools: string[];
    avgSuccessRate: number;
    totalTimeSpent: number;
  } {
    const history = this.behaviorHistory.get(userId) || [];
    const toolUsage = this.calculateToolUsage(history);
    
    return {
      totalGenerations: history.length,
      favoriteTools: Object.entries(toolUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([toolId]) => toolId),
      avgSuccessRate: history.length > 0 ? 
        history.filter(h => h.success).length / history.length : 0,
      totalTimeSpent: history.reduce((sum, h) => sum + h.generationTime, 0)
    };
  }
}

export const userBehaviorPredictor = new UserBehaviorPredictor();