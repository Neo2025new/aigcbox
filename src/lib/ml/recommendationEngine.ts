/**
 * 个性化推荐引擎
 * 基于用户行为、工具效果和上下文推荐最适合的工具和参数
 */

import { userBehaviorPredictor, UserBehaviorData, PredictionResult } from './userBehaviorPredictor';
import { imageQualityAssessor, ImageQualityMetrics } from './imageQualityAssessor';
import { ALL_TOOLS, ToolConfig } from '../gemini';

export interface RecommendationContext {
  userId: string;
  sessionId: string;
  currentTime: number;
  userPrompt: string;
  hasImages: boolean;
  imageCount: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  networkSpeed: 'slow' | 'medium' | 'fast';
  previousGenerations?: {
    toolId: string;
    success: boolean;
    quality: number;
  }[];
}

export interface ToolRecommendation {
  toolId: string;
  toolName: string;
  confidence: number;
  reasons: string[];
  suggestedParameters: Record<string, any>;
  estimatedQuality: number;
  estimatedGenerationTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface RecommendationResult {
  primaryRecommendations: ToolRecommendation[];
  alternativeOptions: ToolRecommendation[];
  quickStart: {
    toolId: string;
    presetPrompt: string;
    oneClickGenerate: boolean;
  };
  personalizedTips: string[];
  learningPath?: {
    currentLevel: string;
    nextSuggestions: string[];
    skillProgression: Record<string, number>;
  };
}

class RecommendationEngine {
  private toolPerformanceHistory: Map<string, ToolPerformanceData[]> = new Map();
  private userSkillLevels: Map<string, UserSkillLevel> = new Map();
  private contextualPatterns: Map<string, ContextPattern[]> = new Map();

  constructor() {
    this.initializeRecommendationData();
  }

  /**
   * 获取个性化推荐
   */
  async getRecommendations(context: RecommendationContext): Promise<RecommendationResult> {
    // 1. 获取用户行为预测结果
    const behaviorPrediction = userBehaviorPredictor.predictToolPreference(
      context.userId,
      {
        timeOfDay: new Date(context.currentTime).getHours(),
        dayOfWeek: new Date(context.currentTime).getDay(),
        deviceType: context.deviceType,
        lastToolUsed: context.previousGenerations?.[0]?.toolId
      }
    );

    // 2. 分析提示词上下文
    const promptAnalysis = this.analyzePromptContext(context.userPrompt);

    // 3. 基于设备和网络条件筛选工具
    const suitableTools = this.filterToolsByCapabilities(context);

    // 4. 计算工具推荐分数
    const toolScores = await this.calculateToolScores(
      suitableTools,
      behaviorPrediction,
      promptAnalysis,
      context
    );

    // 5. 生成主要推荐
    const primaryRecommendations = toolScores
      .slice(0, 3)
      .map(score => this.buildToolRecommendation(score, context));

    // 6. 生成替代选项
    const alternativeOptions = toolScores
      .slice(3, 6)
      .map(score => this.buildToolRecommendation(score, context));

    // 7. 生成快速开始选项
    const quickStart = this.generateQuickStartOption(context, primaryRecommendations[0]);

    // 8. 生成个性化提示
    const personalizedTips = this.generatePersonalizedTips(context, behaviorPrediction);

    // 9. 生成学习路径（如果是新用户或中级用户）
    const learningPath = this.generateLearningPath(context.userId);

    return {
      primaryRecommendations,
      alternativeOptions,
      quickStart,
      personalizedTips,
      learningPath
    };
  }

  /**
   * 记录工具使用结果（用于改进推荐）
   */
  recordToolUsage(
    toolId: string,
    context: RecommendationContext,
    result: {
      success: boolean;
      generationTime: number;
      qualityScore: number;
      userSatisfaction?: number;
    }
  ): void {
    const performanceData: ToolPerformanceData = {
      toolId,
      userId: context.userId,
      timestamp: Date.now(),
      promptComplexity: this.analyzePromptComplexity(context.userPrompt),
      deviceType: context.deviceType,
      networkSpeed: context.networkSpeed,
      success: result.success,
      generationTime: result.generationTime,
      qualityScore: result.qualityScore,
      userSatisfaction: result.userSatisfaction || 3
    };

    // 记录工具性能数据
    if (!this.toolPerformanceHistory.has(toolId)) {
      this.toolPerformanceHistory.set(toolId, []);
    }
    
    const history = this.toolPerformanceHistory.get(toolId)!;
    history.push(performanceData);
    
    // 保持最近500条记录
    if (history.length > 500) {
      history.shift();
    }

    // 更新用户技能等级
    this.updateUserSkillLevel(context.userId, toolId, result.success, result.qualityScore);

    // 记录上下文模式
    this.recordContextualPattern(context, result);
  }

  /**
   * 分析提示词上下文
   */
  private analyzePromptContext(prompt: string): PromptAnalysis {
    const keywords = this.extractKeywords(prompt);
    const sentiment = this.analyzeSentiment(prompt);
    const complexity = this.analyzePromptComplexity(prompt);
    const category = this.categorizePrompt(keywords);
    const style = this.detectArtStyle(prompt);
    const subjects = this.extractSubjects(prompt);

    return {
      keywords,
      sentiment,
      complexity,
      category,
      style,
      subjects,
      length: prompt.length,
      isDetailed: prompt.length > 100,
      hasSpecificRequirements: this.hasSpecificRequirements(prompt)
    };
  }

  /**
   * 基于设备能力筛选工具
   */
  private filterToolsByCapabilities(context: RecommendationContext): ToolConfig[] {
    return ALL_TOOLS.filter(tool => {
      // 移动设备优化
      if (context.deviceType === 'mobile') {
        // 排除需要多图或处理复杂的工具
        if (tool.requiresMultipleImages) return false;
      }

      // 网络速度限制
      if (context.networkSpeed === 'slow') {
        // 优先推荐生成速度快的工具
        const fastTools = ['textToImage', 'imageEditor', 'backgroundReplace'];
        if (!fastTools.includes(tool.id)) return false;
      }

      // 图片依赖检查
      if (tool.requiresImage && !context.hasImages) return false;
      if (tool.requiresMultipleImages && context.imageCount < 2) return false;

      return true;
    });
  }

  /**
   * 计算工具推荐分数
   */
  private async calculateToolScores(
    tools: ToolConfig[],
    behaviorPrediction: PredictionResult,
    promptAnalysis: PromptAnalysis,
    context: RecommendationContext
  ): Promise<ToolScore[]> {
    const scores: ToolScore[] = [];

    for (const tool of tools) {
      let score = 0;

      // 1. 用户行为匹配度 (30%)
      const behaviorScore = behaviorPrediction.recommendedTools.includes(tool.id) ? 
        behaviorPrediction.confidenceScore : 0.3;
      score += behaviorScore * 0.3;

      // 2. 提示词匹配度 (25%)
      const promptScore = this.calculatePromptMatchScore(tool, promptAnalysis);
      score += promptScore * 0.25;

      // 3. 历史性能表现 (20%)
      const performanceScore = this.calculateToolPerformanceScore(tool.id, context);
      score += performanceScore * 0.2;

      // 4. 用户技能匹配度 (15%)
      const skillScore = this.calculateSkillMatchScore(tool, context.userId);
      score += skillScore * 0.15;

      // 5. 上下文适应性 (10%)
      const contextScore = this.calculateContextScore(tool, context);
      score += contextScore * 0.1;

      scores.push({
        toolId: tool.id,
        tool,
        score,
        components: {
          behavior: behaviorScore,
          prompt: promptScore,
          performance: performanceScore,
          skill: skillScore,
          context: contextScore
        }
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * 构建工具推荐对象
   */
  private buildToolRecommendation(
    toolScore: ToolScore,
    context: RecommendationContext
  ): ToolRecommendation {
    const tool = toolScore.tool;
    const reasons = this.generateRecommendationReasons(toolScore, context);
    const suggestedParameters = this.generateSuggestedParameters(tool, context);
    const estimatedQuality = this.estimateGenerationQuality(tool, context);
    const estimatedTime = this.estimateGenerationTime(tool, context);
    const difficulty = this.assessToolDifficulty(tool, context.userId);

    return {
      toolId: tool.id,
      toolName: tool.name,
      confidence: Math.round(toolScore.score * 100),
      reasons,
      suggestedParameters,
      estimatedQuality,
      estimatedGenerationTime: estimatedTime,
      difficulty
    };
  }

  /**
   * 生成推荐原因
   */
  private generateRecommendationReasons(
    toolScore: ToolScore,
    context: RecommendationContext
  ): string[] {
    const reasons: string[] = [];
    const components = toolScore.components;

    if (components.behavior > 0.7) {
      reasons.push('基于您的使用习惯，这个工具很适合您');
    }

    if (components.prompt > 0.8) {
      reasons.push('与您的描述内容高度匹配');
    }

    if (components.performance > 0.8) {
      reasons.push('该工具在类似场景中表现优异');
    }

    if (components.skill > 0.7) {
      reasons.push('难度适中，适合您当前的使用水平');
    }

    if (context.deviceType === 'mobile' && components.context > 0.8) {
      reasons.push('针对移动设备优化，体验更佳');
    }

    // 默认原因
    if (reasons.length === 0) {
      reasons.push('综合评估推荐');
    }

    return reasons;
  }

  /**
   * 生成建议参数
   */
  private generateSuggestedParameters(
    tool: ToolConfig,
    context: RecommendationContext
  ): Record<string, any> {
    const baseParams = userBehaviorPredictor
      .predictToolPreference(context.userId, {
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        deviceType: context.deviceType
      }).suggestedParameters;

    // 根据工具类型调整参数
    const adjustedParams = { ...baseParams };

    // 根据设备类型调整
    if (context.deviceType === 'mobile') {
      adjustedParams.quality = 'medium'; // 移动设备使用中等质量
      adjustedParams.size = 'small';
    }

    // 根据网络速度调整
    if (context.networkSpeed === 'slow') {
      adjustedParams.complexity = 'simple';
      adjustedParams.imageCount = 1;
    }

    return adjustedParams;
  }

  /**
   * 估算生成质量
   */
  private estimateGenerationQuality(tool: ToolConfig, context: RecommendationContext): number {
    const toolHistory = this.toolPerformanceHistory.get(tool.id) || [];
    
    if (toolHistory.length === 0) {
      return this.getToolBaselineQuality(tool.id);
    }

    // 计算相似上下文的平均质量
    const similarCases = toolHistory.filter(h => 
      h.deviceType === context.deviceType &&
      Math.abs(h.promptComplexity - this.analyzePromptComplexity(context.userPrompt)) < 0.3
    );

    if (similarCases.length === 0) {
      return toolHistory.reduce((sum, h) => sum + h.qualityScore, 0) / toolHistory.length;
    }

    return similarCases.reduce((sum, h) => sum + h.qualityScore, 0) / similarCases.length;
  }

  /**
   * 估算生成时间
   */
  private estimateGenerationTime(tool: ToolConfig, context: RecommendationContext): number {
    const baseTime = this.getToolBaseGenerationTime(tool.id);
    
    // 根据设备类型调整
    let multiplier = 1;
    if (context.deviceType === 'mobile') multiplier *= 1.2;
    if (context.networkSpeed === 'slow') multiplier *= 1.5;
    if (context.hasImages) multiplier *= 1.3;

    return Math.round(baseTime * multiplier);
  }

  /**
   * 评估工具难度
   */
  private assessToolDifficulty(tool: ToolConfig, userId: string): 'beginner' | 'intermediate' | 'advanced' {
    const userSkill = this.userSkillLevels.get(userId);
    
    // 基于工具特性的难度评估
    let complexity = 0;
    if (tool.requiresImage) complexity += 1;
    if (tool.requiresMultipleImages) complexity += 2;
    if (tool.parameters && Object.keys(tool.parameters).length > 3) complexity += 1;

    // 基于用户技能调整
    if (userSkill) {
      const userLevel = userSkill.overallLevel;
      if (userLevel > 0.7 && complexity <= 2) return 'beginner';
      if (userLevel > 0.5 && complexity <= 3) return 'intermediate';
    }

    if (complexity <= 1) return 'beginner';
    if (complexity <= 3) return 'intermediate';
    return 'advanced';
  }

  /**
   * 生成快速开始选项
   */
  private generateQuickStartOption(
    context: RecommendationContext,
    primaryRecommendation: ToolRecommendation
  ): RecommendationResult['quickStart'] {
    const presetPrompts = this.generatePresetPrompts(
      primaryRecommendation.toolId,
      context.userPrompt
    );

    return {
      toolId: primaryRecommendation.toolId,
      presetPrompt: presetPrompts[0] || context.userPrompt,
      oneClickGenerate: primaryRecommendation.difficulty === 'beginner'
    };
  }

  /**
   * 生成个性化提示
   */
  private generatePersonalizedTips(
    context: RecommendationContext,
    behaviorPrediction: PredictionResult
  ): string[] {
    const tips: string[] = [];
    const userStats = userBehaviorPredictor.getUserStats(context.userId);

    // 基于用户经验的提示
    if (userStats.totalGenerations < 5) {
      tips.push('💡 新手提示：尝试使用详细的描述来获得更好的效果');
      tips.push('📚 建议先从简单的文字生成图片开始练习');
    } else if (userStats.avgSuccessRate < 0.6) {
      tips.push('🎯 提高成功率：尝试使用更简洁明确的描述词');
      tips.push('🔧 建议使用与您内容匹配度更高的工具');
    }

    // 基于时间的提示
    const currentHour = new Date().getHours();
    if (currentHour >= 22 || currentHour <= 6) {
      tips.push('🌙 深夜创作：建议使用"夜晚"、"月光"等关键词获得更好的氛围');
    }

    // 基于设备的提示
    if (context.deviceType === 'mobile') {
      tips.push('📱 移动端优化：建议使用简单明确的描述，避免过长的文字');
    }

    // 基于历史偏好的提示
    if (userStats.favoriteTools.length > 0) {
      const favoriteTool = userStats.favoriteTools[0];
      tips.push(`⭐ 您最常使用 ${favoriteTool}，可以尝试结合其他工具获得不同效果`);
    }

    return tips.slice(0, 3); // 最多显示3个提示
  }

  /**
   * 生成学习路径
   */
  private generateLearningPath(userId: string): RecommendationResult['learningPath'] | undefined {
    const userSkill = this.userSkillLevels.get(userId);
    const userStats = userBehaviorPredictor.getUserStats(userId);

    if (!userSkill || userStats.totalGenerations < 10) {
      return {
        currentLevel: '新手',
        nextSuggestions: [
          '尝试使用不同类型的工具',
          '学习如何写出更准确的提示词',
          '了解各工具的特点和适用场景'
        ],
        skillProgression: {
          '基础使用': 0.3,
          '提示词优化': 0.1,
          '工具选择': 0.2,
          '参数调整': 0.0
        }
      };
    }

    if (userSkill.overallLevel < 0.7) {
      return {
        currentLevel: '进阶',
        nextSuggestions: [
          '学习更复杂工具的使用技巧',
          '尝试多图合成功能',
          '掌握参数调整的技巧'
        ],
        skillProgression: {
          '基础使用': 0.8,
          '提示词优化': 0.6,
          '工具选择': 0.7,
          '参数调整': 0.4
        }
      };
    }

    // 高级用户不需要学习路径
    return undefined;
  }

  // 辅助方法实现
  private calculatePromptMatchScore(tool: ToolConfig, analysis: PromptAnalysis): number {
    let score = 0.5; // 基础分数

    // 类别匹配
    if (tool.category === analysis.category) {
      score += 0.3;
    }

    // 关键词匹配
    const toolKeywords = this.getToolKeywords(tool.id);
    const matchingKeywords = analysis.keywords.filter(kw => 
      toolKeywords.some(tk => tk.includes(kw) || kw.includes(tk))
    );
    score += (matchingKeywords.length / Math.max(analysis.keywords.length, 1)) * 0.2;

    return Math.min(score, 1);
  }

  private calculateToolPerformanceScore(toolId: string, context: RecommendationContext): number {
    const history = this.toolPerformanceHistory.get(toolId) || [];
    
    if (history.length === 0) {
      return 0.5; // 默认分数
    }

    // 筛选相似上下文的记录
    const relevantHistory = history.filter(h => 
      h.deviceType === context.deviceType
    );

    if (relevantHistory.length === 0) {
      return history.reduce((sum, h) => sum + h.qualityScore, 0) / history.length / 100;
    }

    return relevantHistory.reduce((sum, h) => sum + h.qualityScore, 0) / relevantHistory.length / 100;
  }

  private calculateSkillMatchScore(tool: ToolConfig, userId: string): number {
    const userSkill = this.userSkillLevels.get(userId);
    
    if (!userSkill) {
      return 0.5; // 新用户默认分数
    }

    const toolDifficulty = this.getToolDifficulty(tool);
    const skillGap = Math.abs(userSkill.overallLevel - toolDifficulty);
    
    // 技能匹配度越高分数越高
    return Math.max(0, 1 - skillGap);
  }

  private calculateContextScore(tool: ToolConfig, context: RecommendationContext): number {
    let score = 0.5;

    // 设备适配性
    if (context.deviceType === 'mobile' && !tool.requiresMultipleImages) {
      score += 0.2;
    }

    // 网络适配性
    if (context.networkSpeed === 'fast' || !this.isHighBandwidthTool(tool.id)) {
      score += 0.2;
    }

    // 时间上下文
    const hour = new Date(context.currentTime).getHours();
    if (this.isNightTimeAppropriate(tool.id) && (hour >= 20 || hour <= 6)) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private updateUserSkillLevel(
    userId: string,
    toolId: string,
    success: boolean,
    qualityScore: number
  ): void {
    if (!this.userSkillLevels.has(userId)) {
      this.userSkillLevels.set(userId, {
        userId,
        overallLevel: 0.3,
        toolSpecificLevels: new Map(),
        totalGenerations: 0,
        successfulGenerations: 0,
        lastUpdated: Date.now()
      });
    }

    const skillLevel = this.userSkillLevels.get(userId)!;
    skillLevel.totalGenerations++;
    
    if (success) {
      skillLevel.successfulGenerations++;
    }

    // 更新整体技能等级
    const successRate = skillLevel.successfulGenerations / skillLevel.totalGenerations;
    const qualityFactor = qualityScore / 100;
    skillLevel.overallLevel = (successRate * 0.6 + qualityFactor * 0.4);

    // 更新工具特定技能
    if (!skillLevel.toolSpecificLevels.has(toolId)) {
      skillLevel.toolSpecificLevels.set(toolId, { attempts: 0, successes: 0, avgQuality: 0 });
    }

    const toolSkill = skillLevel.toolSpecificLevels.get(toolId)!;
    toolSkill.attempts++;
    if (success) toolSkill.successes++;
    toolSkill.avgQuality = (toolSkill.avgQuality * (toolSkill.attempts - 1) + qualityScore) / toolSkill.attempts;

    skillLevel.lastUpdated = Date.now();
  }

  private recordContextualPattern(
    context: RecommendationContext,
    result: { success: boolean; qualityScore: number }
  ): void {
    const pattern: ContextPattern = {
      timeOfDay: new Date(context.currentTime).getHours(),
      dayOfWeek: new Date(context.currentTime).getDay(),
      deviceType: context.deviceType,
      networkSpeed: context.networkSpeed,
      promptLength: context.userPrompt.length,
      hasImages: context.hasImages,
      success: result.success,
      qualityScore: result.qualityScore,
      timestamp: Date.now()
    };

    const key = `${context.deviceType}_${context.networkSpeed}`;
    if (!this.contextualPatterns.has(key)) {
      this.contextualPatterns.set(key, []);
    }

    const patterns = this.contextualPatterns.get(key)!;
    patterns.push(pattern);

    // 保持最近200个模式
    if (patterns.length > 200) {
      patterns.shift();
    }
  }

  // 更多辅助方法...
  private analyzePromptComplexity(prompt: string): number {
    const factors = [
      prompt.length > 100 ? 0.3 : prompt.length / 300,
      (prompt.split(',').length - 1) * 0.1,
      (prompt.match(/[，。；！？]/g)?.length || 0) * 0.05,
      prompt.includes('详细') || prompt.includes('复杂') ? 0.2 : 0
    ];
    
    return Math.min(factors.reduce((sum, f) => sum + f, 0), 1);
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 10);
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['美丽', '漂亮', '精致', '优雅', '华丽', '温暖', '明亮'];
    const negativeWords = ['黑暗', '恐怖', '悲伤', '冷漠', '破旧', '阴沉'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private categorizePrompt(keywords: string[]): string {
    const categoryKeywords = {
      'Creative': ['创意', '艺术', '抽象', '想象'],
      'Professional': ['专业', '商业', '产品', '展示'],
      'Style': ['风格', '复古', '现代', '古典'],
      'Editor': ['编辑', '修改', '调整', '改变']
    };

    for (const [category, words] of Object.entries(categoryKeywords)) {
      if (words.some(word => keywords.some(kw => kw.includes(word)))) {
        return category;
      }
    }

    return 'Creative'; // 默认分类
  }

  private detectArtStyle(prompt: string): string {
    const styles = {
      '写实': ['写实', '真实', '照片'],
      '卡通': ['卡通', '动画', '可爱'],
      '油画': ['油画', '艺术', '绘画'],
      '水彩': ['水彩', '淡雅', '清新'],
      '素描': ['素描', '线条', '黑白']
    };

    for (const [style, keywords] of Object.entries(styles)) {
      if (keywords.some(kw => prompt.includes(kw))) {
        return style;
      }
    }

    return '写实'; // 默认风格
  }

  private extractSubjects(prompt: string): string[] {
    const subjects = [];
    const subjectPatterns = [
      /(?:一个|一位|一只)([^\s，。！？]+)/g,
      /([^\s，。！？]+)(?:的|在|是)/g
    ];

    for (const pattern of subjectPatterns) {
      const matches = prompt.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 1) {
          subjects.push(match[1]);
        }
      }
    }

    return subjects.slice(0, 3); // 最多3个主体
  }

  private hasSpecificRequirements(prompt: string): boolean {
    const specificWords = ['必须', '要求', '需要', '应该', '一定', '确保', '包含'];
    return specificWords.some(word => prompt.includes(word));
  }

  private getToolKeywords(toolId: string): string[] {
    const keywords: Record<string, string[]> = {
      'photoToFigure': ['手办', '模型', '3D', '角色', '玩具'],
      'filmNoir': ['黑白', '电影', '复古', '戏剧', '阴影'],
      'interiorDesign': ['室内', '设计', '装修', '家具', '空间'],
      'fashionEcommerce': ['时尚', '服装', '模特', '电商', '展示']
    };
    
    return keywords[toolId] || [];
  }

  private getToolDifficulty(tool: ToolConfig): number {
    let difficulty = 0.3; // 基础难度
    
    if (tool.requiresImage) difficulty += 0.2;
    if (tool.requiresMultipleImages) difficulty += 0.3;
    if (tool.parameters && Object.keys(tool.parameters).length > 2) difficulty += 0.2;
    
    return Math.min(difficulty, 1);
  }

  private isHighBandwidthTool(toolId: string): boolean {
    const highBandwidthTools = ['multiImageFusion', 'groupPhoto', 'fashionEcommerce'];
    return highBandwidthTools.includes(toolId);
  }

  private isNightTimeAppropriate(toolId: string): boolean {
    const nightTools = ['filmNoir', 'characterStory'];
    return nightTools.includes(toolId);
  }

  private getToolBaselineQuality(toolId: string): number {
    const baselines: Record<string, number> = {
      'textToImage': 75,
      'photoToFigure': 80,
      'imageEditor': 70,
      'filmNoir': 85,
      'interiorDesign': 82
    };
    
    return baselines[toolId] || 70;
  }

  private getToolBaseGenerationTime(toolId: string): number {
    const baseTimes: Record<string, number> = {
      'textToImage': 30,
      'photoToFigure': 45,
      'imageEditor': 25,
      'multiImageFusion': 60,
      'fashionEcommerce': 50
    };
    
    return baseTimes[toolId] || 35;
  }

  private generatePresetPrompts(toolId: string, userPrompt: string): string[] {
    const presets: Record<string, string[]> = {
      'textToImage': [
        '一个美丽的风景，包含山脉和湖泊，阳光明媚的天气',
        '可爱的小动物在花园里玩耍，色彩鲜艳',
        '未来科技城市，高楼大厦，霓虹灯闪烁'
      ],
      'photoToFigure': [
        '将照片转换成精致的3D手办模型，放在透明底座上',
        '制作成Q版卡通手办，保持原有特征',
        '转换为限量版收藏手办，包装盒展示'
      ]
    };
    
    return presets[toolId] || [userPrompt];
  }

  private initializeRecommendationData(): void {
    // 初始化推荐引擎的基础数据
    // 在实际应用中，这些数据应该从数据库加载
  }
}

// 接口定义
interface ToolPerformanceData {
  toolId: string;
  userId: string;
  timestamp: number;
  promptComplexity: number;
  deviceType: string;
  networkSpeed: string;
  success: boolean;
  generationTime: number;
  qualityScore: number;
  userSatisfaction: number;
}

interface UserSkillLevel {
  userId: string;
  overallLevel: number;
  toolSpecificLevels: Map<string, {
    attempts: number;
    successes: number;
    avgQuality: number;
  }>;
  totalGenerations: number;
  successfulGenerations: number;
  lastUpdated: number;
}

interface ContextPattern {
  timeOfDay: number;
  dayOfWeek: number;
  deviceType: string;
  networkSpeed: string;
  promptLength: number;
  hasImages: boolean;
  success: boolean;
  qualityScore: number;
  timestamp: number;
}

interface PromptAnalysis {
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: number;
  category: string;
  style: string;
  subjects: string[];
  length: number;
  isDetailed: boolean;
  hasSpecificRequirements: boolean;
}

interface ToolScore {
  toolId: string;
  tool: ToolConfig;
  score: number;
  components: {
    behavior: number;
    prompt: number;
    performance: number;
    skill: number;
    context: number;
  };
}

export const recommendationEngine = new RecommendationEngine();