/**
 * 特征工程系统
 * 提取和处理用户行为、图像生成相关的特征数据
 */

export interface UserFeatures {
  // 基础用户特征
  userId: string;
  sessionId: string;
  accountAge: number; // 天数
  isNewUser: boolean;
  
  // 使用行为特征
  totalGenerations: number;
  successfulGenerations: number;
  successRate: number;
  averageSessionLength: number;
  sessionsPerWeek: number;
  favoriteCategories: string[];
  mostUsedTools: string[];
  
  // 时间模式特征
  preferredTimeOfDay: number[];
  preferredDaysOfWeek: number[];
  timezoneBucket: string;
  
  // 设备和技术特征
  primaryDeviceType: 'mobile' | 'tablet' | 'desktop';
  averageNetworkSpeed: 'slow' | 'medium' | 'fast';
  browserType: string;
  screenResolution: string;
  
  // 内容偏好特征
  averagePromptLength: number;
  complexityPreference: 'simple' | 'moderate' | 'complex';
  stylePreferences: Record<string, number>;
  subjectPreferences: Record<string, number>;
  
  // 质量和满意度特征
  averageQualityScore: number;
  averageSatisfactionRating: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
  
  // 高级行为模式
  explorationScore: number; // 尝试新工具的倾向
  consistencyScore: number; // 使用习惯的一致性
  learningCurve: number; // 技能提升速度
  
  lastUpdated: number;
}

export interface ImageGenerationFeatures {
  // 生成任务基础特征
  generationId: string;
  userId: string;
  toolId: string;
  timestamp: number;
  
  // 输入特征
  promptText: string;
  promptLength: number;
  promptComplexity: number;
  keywordCount: number;
  hasImages: boolean;
  inputImageCount: number;
  
  // 语义特征
  promptEmbedding: number[]; // 文本向量化
  semanticCategories: string[];
  sentimentScore: number;
  creativityScore: number;
  specificityScore: number;
  
  // 技术参数特征
  toolParameters: Record<string, any>;
  parameterComplexity: number;
  isDefaultParameters: boolean;
  
  // 上下文特征
  deviceType: string;
  networkSpeed: string;
  timeOfDay: number;
  dayOfWeek: number;
  sessionPosition: number; // 在会话中的位置
  
  // 结果特征
  generationTime: number;
  success: boolean;
  qualityScore: number;
  userSatisfaction?: number;
  
  // 图像特征（生成后提取）
  imageFeatures?: {
    dimensions: { width: number; height: number };
    dominantColors: string[];
    brightness: number;
    contrast: number;
    colorfulness: number;
    complexity: number;
    faces: number;
    objects: string[];
    textContent: string;
  };
}

export interface FeatureVector {
  userId: string;
  features: number[];
  featureNames: string[];
  timestamp: number;
  context: string;
}

class FeatureEngineeringSystem {
  private userFeatureCache: Map<string, UserFeatures> = new Map();
  private featureHistory: Map<string, ImageGenerationFeatures[]> = new Map();
  private featureScalers: Map<string, { min: number; max: number }> = new Map();
  
  // 特征提取器配置
  private featureConfig = {
    userFeatures: {
      temporal: ['hour', 'dayOfWeek', 'weekOfYear'],
      behavioral: ['successRate', 'sessionFrequency', 'toolDiversity'],
      preference: ['promptComplexity', 'qualityExpectation', 'styleConsistency'],
      contextual: ['deviceStability', 'networkQuality', 'locationConsistency']
    },
    imageFeatures: {
      prompt: ['length', 'complexity', 'sentiment', 'keywords'],
      technical: ['parameters', 'toolType', 'inputCount'],
      quality: ['outputScore', 'userRating', 'objectiveMetrics'],
      performance: ['generationTime', 'retryCount', 'errorRate']
    }
  };

  constructor() {
    this.initializeFeatureSystem();
  }

  /**
   * 提取用户特征
   */
  async extractUserFeatures(
    userId: string,
    recentActivity?: ImageGenerationFeatures[]
  ): Promise<UserFeatures> {
    // 从缓存获取现有特征
    let features = this.userFeatureCache.get(userId) || this.initializeUserFeatures(userId);
    
    // 如果有新的活动数据，更新特征
    if (recentActivity && recentActivity.length > 0) {
      features = await this.updateUserFeaturesWithActivity(features, recentActivity);
    }
    
    // 计算派生特征
    features = this.calculateDerivedUserFeatures(features);
    
    // 更新缓存
    this.userFeatureCache.set(userId, features);
    
    return features;
  }

  /**
   * 提取单次生成的特征
   */
  async extractGenerationFeatures(
    generationData: {
      userId: string;
      toolId: string;
      prompt: string;
      parameters: Record<string, any>;
      images?: File[];
      context: {
        deviceType: string;
        networkSpeed: string;
        timestamp: number;
      };
    }
  ): Promise<ImageGenerationFeatures> {
    const timestamp = generationData.context.timestamp;
    const date = new Date(timestamp);
    
    // 基础特征
    const features: ImageGenerationFeatures = {
      generationId: `gen_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      userId: generationData.userId,
      toolId: generationData.toolId,
      timestamp,
      
      // 输入特征
      promptText: generationData.prompt,
      promptLength: generationData.prompt.length,
      promptComplexity: this.calculatePromptComplexity(generationData.prompt),
      keywordCount: this.extractKeywords(generationData.prompt).length,
      hasImages: (generationData.images?.length || 0) > 0,
      inputImageCount: generationData.images?.length || 0,
      
      // 语义特征
      promptEmbedding: await this.generateTextEmbedding(generationData.prompt),
      semanticCategories: this.classifyPromptSemantics(generationData.prompt),
      sentimentScore: this.calculateSentiment(generationData.prompt),
      creativityScore: this.assessCreativity(generationData.prompt),
      specificityScore: this.assessSpecificity(generationData.prompt),
      
      // 技术参数特征
      toolParameters: generationData.parameters,
      parameterComplexity: this.calculateParameterComplexity(generationData.parameters),
      isDefaultParameters: this.isDefaultParameters(generationData.parameters),
      
      // 上下文特征
      deviceType: generationData.context.deviceType,
      networkSpeed: generationData.context.networkSpeed,
      timeOfDay: date.getHours(),
      dayOfWeek: date.getDay(),
      sessionPosition: await this.calculateSessionPosition(generationData.userId, timestamp),
      
      // 结果特征（初始值，生成后更新）
      generationTime: 0,
      success: false,
      qualityScore: 0
    };
    
    return features;
  }

  /**
   * 更新生成结果特征
   */
  async updateGenerationResult(
    generationId: string,
    result: {
      success: boolean;
      generationTime: number;
      qualityScore: number;
      userSatisfaction?: number;
      imageData?: string;
    }
  ): Promise<void> {
    const userHistory = Array.from(this.featureHistory.values()).flat();
    const generation = userHistory.find(g => g.generationId === generationId);
    
    if (!generation) return;
    
    // 更新结果特征
    generation.success = result.success;
    generation.generationTime = result.generationTime;
    generation.qualityScore = result.qualityScore;
    generation.userSatisfaction = result.userSatisfaction;
    
    // 提取图像特征（如果有图像数据）
    if (result.imageData) {
      generation.imageFeatures = await this.extractImageFeatures(result.imageData);
    }
    
    // 记录到历史
    this.recordGenerationFeatures(generation);
    
    // 触发用户特征更新
    this.extractUserFeatures(generation.userId, [generation]);
  }

  /**
   * 创建特征向量（用于ML模型）
   */
  createFeatureVector(
    userFeatures: UserFeatures,
    generationFeatures?: ImageGenerationFeatures,
    context = 'recommendation'
  ): FeatureVector {
    const features: number[] = [];
    const featureNames: string[] = [];
    
    // 用户特征向量
    this.addUserFeaturesToVector(userFeatures, features, featureNames);
    
    // 生成特征向量（如果有）
    if (generationFeatures) {
      this.addGenerationFeaturesToVector(generationFeatures, features, featureNames);
    }
    
    // 特征标准化
    const normalizedFeatures = this.normalizeFeatures(features, featureNames);
    
    return {
      userId: userFeatures.userId,
      features: normalizedFeatures,
      featureNames,
      timestamp: Date.now(),
      context
    };
  }

  /**
   * 特征重要性分析
   */
  analyzeFeatureImportance(
    vectors: FeatureVector[],
    targetValues: number[]
  ): Record<string, number> {
    if (vectors.length !== targetValues.length || vectors.length === 0) {
      return {};
    }
    
    const featureNames = vectors[0].featureNames;
    const importance: Record<string, number> = {};
    
    // 使用相关系数计算特征重要性
    for (let i = 0; i < featureNames.length; i++) {
      const featureValues = vectors.map(v => v.features[i]);
      const correlation = this.calculateCorrelation(featureValues, targetValues);
      importance[featureNames[i]] = Math.abs(correlation);
    }
    
    return importance;
  }

  /**
   * 获取用户行为洞察
   */
  getUserBehaviorInsights(userId: string): {
    patterns: Record<string, any>;
    anomalies: string[];
    recommendations: string[];
    trends: Record<string, 'increasing' | 'decreasing' | 'stable'>;
  } {
    const userFeatures = this.userFeatureCache.get(userId);
    const userHistory = this.featureHistory.get(userId) || [];
    
    if (!userFeatures || userHistory.length < 5) {
      return {
        patterns: {},
        anomalies: [],
        recommendations: ['需要更多数据来分析用户行为模式'],
        trends: {}
      };
    }
    
    // 分析行为模式
    const patterns = this.analyzeUserPatterns(userFeatures, userHistory);
    
    // 检测异常行为
    const anomalies = this.detectBehaviorAnomalies(userFeatures, userHistory);
    
    // 生成个性化建议
    const recommendations = this.generateBehaviorRecommendations(patterns, anomalies);
    
    // 分析趋势
    const trends = this.analyzeBehaviorTrends(userHistory);
    
    return { patterns, anomalies, recommendations, trends };
  }

  // 私有方法实现
  private initializeUserFeatures(userId: string): UserFeatures {
    return {
      userId,
      sessionId: '',
      accountAge: 0,
      isNewUser: true,
      totalGenerations: 0,
      successfulGenerations: 0,
      successRate: 0,
      averageSessionLength: 0,
      sessionsPerWeek: 0,
      favoriteCategories: [],
      mostUsedTools: [],
      preferredTimeOfDay: [],
      preferredDaysOfWeek: [],
      timezoneBucket: 'GMT',
      primaryDeviceType: 'desktop',
      averageNetworkSpeed: 'medium',
      browserType: 'unknown',
      screenResolution: '1920x1080',
      averagePromptLength: 0,
      complexityPreference: 'moderate',
      stylePreferences: {},
      subjectPreferences: {},
      averageQualityScore: 0,
      averageSatisfactionRating: 0,
      qualityTrend: 'stable',
      explorationScore: 0,
      consistencyScore: 0,
      learningCurve: 0,
      lastUpdated: Date.now()
    };
  }

  private async updateUserFeaturesWithActivity(
    features: UserFeatures,
    activities: ImageGenerationFeatures[]
  ): Promise<UserFeatures> {
    const updated = { ...features };
    
    // 更新基础统计
    updated.totalGenerations += activities.length;
    updated.successfulGenerations += activities.filter(a => a.success).length;
    updated.successRate = updated.successfulGenerations / updated.totalGenerations;
    
    // 更新时间偏好
    const hourCounts = activities.reduce((acc, a) => {
      acc[a.timeOfDay] = (acc[a.timeOfDay] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    updated.preferredTimeOfDay = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    
    // 更新工具偏好
    const toolCounts = activities.reduce((acc, a) => {
      acc[a.toolId] = (acc[a.toolId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    updated.mostUsedTools = Object.entries(toolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tool]) => tool);
    
    // 更新质量指标
    const qualityScores = activities.filter(a => a.qualityScore > 0).map(a => a.qualityScore);
    if (qualityScores.length > 0) {
      updated.averageQualityScore = qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length;
    }
    
    // 更新复杂度偏好
    const avgComplexity = activities.reduce((sum, a) => sum + a.promptComplexity, 0) / activities.length;
    updated.complexityPreference = 
      avgComplexity < 0.3 ? 'simple' :
      avgComplexity < 0.7 ? 'moderate' : 'complex';
    
    updated.lastUpdated = Date.now();
    return updated;
  }

  private calculateDerivedUserFeatures(features: UserFeatures): UserFeatures {
    const updated = { ...features };
    
    // 计算探索分数
    updated.explorationScore = Math.min(
      updated.mostUsedTools.length / 10, // 使用工具多样性
      1
    );
    
    // 计算一致性分数
    updated.consistencyScore = updated.totalGenerations > 0 ? 
      1 - (updated.mostUsedTools.length / updated.totalGenerations) : 0;
    
    // 计算学习曲线（质量改善趋势）
    updated.learningCurve = updated.qualityTrend === 'improving' ? 0.8 :
                           updated.qualityTrend === 'stable' ? 0.5 : 0.2;
    
    return updated;
  }

  private calculatePromptComplexity(prompt: string): number {
    const factors = [
      // 长度因子
      Math.min(prompt.length / 200, 1) * 0.3,
      
      // 结构复杂度（逗号、句号等）
      ((prompt.match(/[，。；！？,;!?]/g) || []).length / 10) * 0.2,
      
      // 修饰词数量
      ((prompt.match(/\b(美丽|精致|详细|复杂|华丽|优雅)\b/g) || []).length / 5) * 0.2,
      
      // 技术词汇
      ((prompt.match(/\b(分辨率|渲染|材质|光影|构图)\b/g) || []).length / 3) * 0.2,
      
      // 特定要求
      prompt.includes('必须') || prompt.includes('要求') ? 0.1 : 0
    ];
    
    return Math.min(factors.reduce((sum, f) => sum + f, 0), 1);
  }

  private extractKeywords(text: string): string[] {
    // 简化的关键词提取
    const stopWords = new Set(['的', '在', '和', '是', '有', '一个', '这个', 'the', 'a', 'an', 'and', 'or', 'but']);
    
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 20);
  }

  private async generateTextEmbedding(text: string): Promise<number[]> {
    // 简化的文本向量化（实际应用中应使用预训练的embedding模型）
    const keywords = this.extractKeywords(text);
    const embedding = new Array(128).fill(0);
    
    // 基于关键词生成简单的向量
    for (let i = 0; i < keywords.length && i < embedding.length; i++) {
      const hash = this.hashString(keywords[i]);
      embedding[i] = (hash % 1000) / 1000;
    }
    
    return embedding;
  }

  private classifyPromptSemantics(prompt: string): string[] {
    const categories: string[] = [];
    
    const categoryKeywords = {
      'portrait': ['人物', '肖像', 'portrait', 'person', 'face'],
      'landscape': ['风景', '山水', 'landscape', 'nature', 'scenery'],
      'abstract': ['抽象', 'abstract', '艺术', 'artistic'],
      'realistic': ['写实', 'realistic', '真实', 'photo'],
      'fantasy': ['幻想', 'fantasy', '魔法', 'magical'],
      'futuristic': ['未来', 'futuristic', '科幻', 'sci-fi'],
      'vintage': ['复古', 'vintage', '古典', 'classical']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => prompt.toLowerCase().includes(kw.toLowerCase()))) {
        categories.push(category);
      }
    }
    
    return categories;
  }

  private calculateSentiment(text: string): number {
    const positiveWords = ['美丽', '漂亮', '精致', '优雅', '华丽', '温暖', '明亮', 'beautiful', 'elegant'];
    const negativeWords = ['黑暗', '恐怖', '悲伤', '冷漠', '破旧', '阴沉', 'dark', 'sad'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    // 返回-1到1之间的情感分数
    if (positiveCount + negativeCount === 0) return 0;
    return (positiveCount - negativeCount) / (positiveCount + negativeCount);
  }

  private assessCreativity(prompt: string): number {
    const creativeWords = ['创意', '独特', '想象', '梦幻', '超现实', '抽象', 'creative', 'unique', 'imagination'];
    const matchCount = creativeWords.filter(word => prompt.toLowerCase().includes(word.toLowerCase())).length;
    return Math.min(matchCount / 3, 1);
  }

  private assessSpecificity(prompt: string): number {
    const specificWords = ['具体', '详细', '精确', '确切', 'specific', 'detailed', 'precise'];
    const numbers = (prompt.match(/\d+/g) || []).length;
    const colors = (prompt.match(/(红色|蓝色|绿色|黄色|紫色|orange|blue|red|green)/g) || []).length;
    
    const specificity = (
      specificWords.filter(word => prompt.includes(word)).length * 0.3 +
      Math.min(numbers / 3, 1) * 0.4 +
      Math.min(colors / 2, 1) * 0.3
    );
    
    return Math.min(specificity, 1);
  }

  private calculateParameterComplexity(parameters: Record<string, any>): number {
    const paramCount = Object.keys(parameters).length;
    const hasAdvancedParams = Object.keys(parameters).some(key => 
      ['resolution', 'quality', 'style', 'seed'].includes(key)
    );
    
    return Math.min(paramCount / 10 + (hasAdvancedParams ? 0.3 : 0), 1);
  }

  private isDefaultParameters(parameters: Record<string, any>): boolean {
    const defaultValues = {
      'numberOfImages': 1,
      'quality': 'medium',
      'size': 'medium'
    };
    
    return Object.entries(parameters).every(([key, value]) => 
      defaultValues[key as keyof typeof defaultValues] === value
    );
  }

  private async calculateSessionPosition(userId: string, timestamp: number): Promise<number> {
    const userHistory = this.featureHistory.get(userId) || [];
    const sessionStart = timestamp - (30 * 60 * 1000); // 30分钟会话窗口
    const sessionGenerations = userHistory.filter(g => 
      g.timestamp >= sessionStart && g.timestamp <= timestamp
    );
    
    return sessionGenerations.length + 1;
  }

  private async extractImageFeatures(imageData: string): Promise<ImageGenerationFeatures['imageFeatures']> {
    // 在实际应用中，这里会使用图像处理库来提取特征
    // 这里提供一个模拟实现
    
    return {
      dimensions: { width: 512, height: 512 },
      dominantColors: ['#FF5733', '#33FF57', '#3357FF'],
      brightness: 0.6,
      contrast: 0.7,
      colorfulness: 0.8,
      complexity: 0.5,
      faces: 0,
      objects: ['background', 'foreground'],
      textContent: ''
    };
  }

  private addUserFeaturesToVector(
    features: UserFeatures,
    vector: number[],
    names: string[]
  ): void {
    // 数值特征
    const numericFeatures = [
      ['accountAge', features.accountAge],
      ['totalGenerations', features.totalGenerations],
      ['successRate', features.successRate],
      ['averageSessionLength', features.averageSessionLength],
      ['sessionsPerWeek', features.sessionsPerWeek],
      ['averagePromptLength', features.averagePromptLength],
      ['averageQualityScore', features.averageQualityScore],
      ['averageSatisfactionRating', features.averageSatisfactionRating],
      ['explorationScore', features.explorationScore],
      ['consistencyScore', features.consistencyScore],
      ['learningCurve', features.learningCurve]
    ];
    
    for (const [name, value] of numericFeatures) {
      vector.push(Number(value) || 0);
      names.push(`user_${name}`);
    }
    
    // 分类特征（One-hot编码）
    const deviceTypes = ['mobile', 'tablet', 'desktop'];
    for (const deviceType of deviceTypes) {
      vector.push(features.primaryDeviceType === deviceType ? 1 : 0);
      names.push(`user_device_${deviceType}`);
    }
    
    const complexityPrefs = ['simple', 'moderate', 'complex'];
    for (const pref of complexityPrefs) {
      vector.push(features.complexityPreference === pref ? 1 : 0);
      names.push(`user_complexity_${pref}`);
    }
  }

  private addGenerationFeaturesToVector(
    features: ImageGenerationFeatures,
    vector: number[],
    names: string[]
  ): void {
    // 生成任务特征
    const generationFeatures = [
      ['promptLength', features.promptLength],
      ['promptComplexity', features.promptComplexity],
      ['keywordCount', features.keywordCount],
      ['inputImageCount', features.inputImageCount],
      ['sentimentScore', features.sentimentScore],
      ['creativityScore', features.creativityScore],
      ['specificityScore', features.specificityScore],
      ['parameterComplexity', features.parameterComplexity],
      ['timeOfDay', features.timeOfDay],
      ['dayOfWeek', features.dayOfWeek],
      ['sessionPosition', features.sessionPosition]
    ];
    
    for (const [name, value] of generationFeatures) {
      vector.push(Number(value) || 0);
      names.push(`gen_${name}`);
    }
    
    // 布尔特征
    vector.push(features.hasImages ? 1 : 0);
    names.push('gen_hasImages');
    
    vector.push(features.isDefaultParameters ? 1 : 0);
    names.push('gen_isDefaultParameters');
  }

  private normalizeFeatures(features: number[], featureNames: string[]): number[] {
    return features.map((feature, index) => {
      const name = featureNames[index];
      const scaler = this.featureScalers.get(name);
      
      if (!scaler) {
        // 初始化缩放器
        this.featureScalers.set(name, { min: feature, max: feature });
        return feature;
      }
      
      // 更新缩放器
      scaler.min = Math.min(scaler.min, feature);
      scaler.max = Math.max(scaler.max, feature);
      
      // Min-Max标准化
      if (scaler.max === scaler.min) return 0.5;
      return (feature - scaler.min) / (scaler.max - scaler.min);
    });
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private recordGenerationFeatures(features: ImageGenerationFeatures): void {
    if (!this.featureHistory.has(features.userId)) {
      this.featureHistory.set(features.userId, []);
    }
    
    const history = this.featureHistory.get(features.userId)!;
    history.push(features);
    
    // 保持最近500条记录
    if (history.length > 500) {
      history.shift();
    }
  }

  private analyzeUserPatterns(
    userFeatures: UserFeatures,
    history: ImageGenerationFeatures[]
  ): Record<string, any> {
    const patterns: Record<string, any> = {};
    
    // 时间模式
    const hourlyUsage = history.reduce((acc, h) => {
      acc[h.timeOfDay] = (acc[h.timeOfDay] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    patterns.peakHours = Object.entries(hourlyUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    
    // 工具使用模式
    const toolUsage = history.reduce((acc, h) => {
      acc[h.toolId] = (acc[h.toolId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    patterns.toolPreference = Object.entries(toolUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tool, count]) => ({ tool, usage: count }));
    
    // 质量趋势
    const recentQuality = history.slice(-10).map(h => h.qualityScore);
    patterns.qualityTrend = this.calculateTrend(recentQuality);
    
    return patterns;
  }

  private detectBehaviorAnomalies(
    userFeatures: UserFeatures,
    history: ImageGenerationFeatures[]
  ): string[] {
    const anomalies: string[] = [];
    
    // 检测异常的成功率下降
    if (userFeatures.successRate < 0.3 && userFeatures.totalGenerations > 10) {
      anomalies.push('成功率异常偏低，可能需要使用指导');
    }
    
    // 检测会话长度异常
    if (userFeatures.averageSessionLength > 120 && history.length > 0) {
      const recentSessions = history.slice(-5);
      if (recentSessions.every(h => h.generationTime > 60)) {
        anomalies.push('生成时间异常偏长，可能存在技术问题');
      }
    }
    
    // 检测工具使用异常
    const recentTools = history.slice(-10).map(h => h.toolId);
    const uniqueTools = new Set(recentTools).size;
    if (uniqueTools === 1 && history.length > 10) {
      anomalies.push('工具使用过于单一，建议尝试其他功能');
    }
    
    return anomalies;
  }

  private generateBehaviorRecommendations(
    patterns: Record<string, any>,
    anomalies: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    // 基于异常的建议
    recommendations.push(...anomalies);
    
    // 基于模式的建议
    if (patterns.toolPreference && patterns.toolPreference.length > 0) {
      const mostUsedTool = patterns.toolPreference[0].tool;
      recommendations.push(`您经常使用 ${mostUsedTool}，可以尝试结合其他工具获得更好效果`);
    }
    
    if (patterns.qualityTrend === 'declining') {
      recommendations.push('最近的生成质量有所下降，建议查看使用技巧或联系客服');
    } else if (patterns.qualityTrend === 'improving') {
      recommendations.push('您的使用技能在不断提高，可以尝试更复杂的功能');
    }
    
    return recommendations.slice(0, 5); // 最多5个建议
  }

  private analyzeBehaviorTrends(
    history: ImageGenerationFeatures[]
  ): Record<string, 'increasing' | 'decreasing' | 'stable'> {
    const trends: Record<string, 'increasing' | 'decreasing' | 'stable'> = {};
    
    if (history.length < 5) return trends;
    
    // 分析质量趋势
    const qualityScores = history.map(h => h.qualityScore);
    trends.quality = this.calculateTrend(qualityScores);
    
    // 分析复杂度趋势
    const complexityScores = history.map(h => h.promptComplexity);
    trends.complexity = this.calculateTrend(complexityScores);
    
    // 分析使用频率趋势（按周分组）
    const weeklyUsage = this.groupByWeek(history);
    const usageCounts = Object.values(weeklyUsage).map(week => week.length);
    trends.usage = this.calculateTrend(usageCounts);
    
    return trends;
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';
    
    const recent = values.slice(-Math.min(5, values.length));
    const older = values.slice(0, Math.min(5, values.length));
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private groupByWeek(history: ImageGenerationFeatures[]): Record<string, ImageGenerationFeatures[]> {
    return history.reduce((acc, item) => {
      const week = Math.floor(item.timestamp / (7 * 24 * 60 * 60 * 1000));
      const key = `week_${week}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, ImageGenerationFeatures[]>);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private initializeFeatureSystem(): void {
    // 初始化特征工程系统
    // 在实际应用中，这里可能需要加载预训练的模型或配置
  }
}

export const featureEngineeringSystem = new FeatureEngineeringSystem();