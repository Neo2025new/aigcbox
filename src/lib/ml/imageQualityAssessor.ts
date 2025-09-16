/**
 * 图像质量评估系统
 * 基于多维度指标评估生成图像质量
 */

export interface ImageQualityMetrics {
  technicalQuality: {
    sharpness: number;        // 清晰度 (0-1)
    contrast: number;         // 对比度 (0-1)
    brightness: number;       // 亮度 (0-1)
    colorBalance: number;     // 色彩平衡 (0-1)
    noiseLevel: number;       // 噪点水平 (0-1, 越低越好)
    resolution: number;       // 分辨率评分 (0-1)
  };
  contentQuality: {
    promptAlignment: number;  // 与提示词匹配度 (0-1)
    completeness: number;     // 内容完整性 (0-1)
    creativity: number;       // 创意度 (0-1)
    aesthetics: number;       // 美学评分 (0-1)
    coherence: number;        // 内容连贯性 (0-1)
  };
  overallScore: number;       // 总体评分 (0-100)
  category: 'excellent' | 'good' | 'fair' | 'poor';
  suggestions: string[];      // 改进建议
}

export interface QualityAssessmentRequest {
  imageData: string;          // base64 或 URL
  originalPrompt: string;     // 原始提示词
  toolId: string;            // 使用的工具ID
  userFeedback?: number;     // 用户评分 (1-5)
  metadata?: {
    generationTime: number;
    modelUsed: string;
    parameters: Record<string, any>;
  };
}

class ImageQualityAssessor {
  private qualityHistory: Map<string, ImageQualityMetrics[]> = new Map();
  private qualityThresholds = {
    excellent: 85,
    good: 70,
    fair: 50,
    poor: 0
  };

  /**
   * 评估图像质量
   */
  async assessImageQuality(request: QualityAssessmentRequest): Promise<ImageQualityMetrics> {
    try {
      // 1. 技术质量分析
      const technicalMetrics = await this.analyzeTechnicalQuality(request.imageData);
      
      // 2. 内容质量分析
      const contentMetrics = await this.analyzeContentQuality(
        request.imageData,
        request.originalPrompt,
        request.toolId
      );
      
      // 3. 计算总体评分
      const overallScore = this.calculateOverallScore(technicalMetrics, contentMetrics);
      const category = this.categorizeQuality(overallScore);
      
      // 4. 生成改进建议
      const suggestions = this.generateSuggestions(
        technicalMetrics,
        contentMetrics,
        request.toolId,
        request.originalPrompt
      );
      
      const result: ImageQualityMetrics = {
        technicalQuality: technicalMetrics,
        contentQuality: contentMetrics,
        overallScore,
        category,
        suggestions
      };
      
      // 5. 记录历史数据
      this.recordQualityMetrics(request.toolId, result);
      
      // 6. 如果有用户反馈，更新模型
      if (request.userFeedback) {
        this.updateQualityModel(result, request.userFeedback, request.toolId);
      }
      
      return result;
      
    } catch (error) {
      console.error('Image quality assessment failed:', error);
      return this.getDefaultQualityMetrics();
    }
  }

  /**
   * 分析技术质量
   */
  private async analyzeTechnicalQuality(imageData: string): Promise<ImageQualityMetrics['technicalQuality']> {
    // 在实际应用中，这里会使用图像处理库来分析
    // 这里提供一个基于启发式算法的实现
    
    const canvas = await this.loadImageToCanvas(imageData);
    if (!canvas) {
      return {
        sharpness: 0.5,
        contrast: 0.5,
        brightness: 0.5,
        colorBalance: 0.5,
        noiseLevel: 0.5,
        resolution: 0.5
      };
    }
    
    const ctx = canvas.getContext('2d')!;
    const imageData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData2.data;
    
    // 分析各项指标
    const sharpness = this.calculateSharpness(pixels, canvas.width, canvas.height);
    const contrast = this.calculateContrast(pixels);
    const brightness = this.calculateBrightness(pixels);
    const colorBalance = this.calculateColorBalance(pixels);
    const noiseLevel = this.calculateNoiseLevel(pixels, canvas.width, canvas.height);
    const resolution = this.evaluateResolution(canvas.width, canvas.height);
    
    return {
      sharpness,
      contrast,
      brightness,
      colorBalance,
      noiseLevel,
      resolution
    };
  }

  /**
   * 分析内容质量
   */
  private async analyzeContentQuality(
    imageData: string,
    originalPrompt: string,
    toolId: string
  ): Promise<ImageQualityMetrics['contentQuality']> {
    // 这里使用NLP和计算机视觉技术分析内容质量
    // 实际实现可能需要调用外部AI服务
    
    const promptKeywords = this.extractKeywords(originalPrompt);
    const toolCharacteristics = this.getToolCharacteristics(toolId);
    
    // 基于启发式算法的实现
    return {
      promptAlignment: this.assessPromptAlignment(promptKeywords, toolCharacteristics),
      completeness: this.assessCompleteness(originalPrompt, toolCharacteristics),
      creativity: this.assessCreativity(toolId, originalPrompt),
      aesthetics: this.assessAesthetics(toolId),
      coherence: this.assessCoherence(promptKeywords)
    };
  }

  /**
   * 计算清晰度
   */
  private calculateSharpness(pixels: Uint8ClampedArray, width: number, height: number): number {
    let totalVariation = 0;
    let count = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 计算灰度值
        const gray = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
        
        // 计算相邻像素的灰度差
        const rightIdx = (y * width + x + 1) * 4;
        const downIdx = ((y + 1) * width + x) * 4;
        
        const rightGray = 0.299 * pixels[rightIdx] + 0.587 * pixels[rightIdx + 1] + 0.114 * pixels[rightIdx + 2];
        const downGray = 0.299 * pixels[downIdx] + 0.587 * pixels[downIdx + 1] + 0.114 * pixels[downIdx + 2];
        
        totalVariation += Math.abs(gray - rightGray) + Math.abs(gray - downGray);
        count += 2;
      }
    }
    
    const avgVariation = totalVariation / count;
    return Math.min(avgVariation / 50, 1); // 归一化到0-1
  }

  /**
   * 计算对比度
   */
  private calculateContrast(pixels: Uint8ClampedArray): number {
    let min = 255;
    let max = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      min = Math.min(min, gray);
      max = Math.max(max, gray);
    }
    
    return (max - min) / 255;
  }

  /**
   * 计算亮度
   */
  private calculateBrightness(pixels: Uint8ClampedArray): number {
    let totalBrightness = 0;
    const pixelCount = pixels.length / 4;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      totalBrightness += gray;
    }
    
    const avgBrightness = totalBrightness / pixelCount / 255;
    
    // 理想亮度在0.4-0.7之间
    const ideal = 0.55;
    const deviation = Math.abs(avgBrightness - ideal);
    return Math.max(0, 1 - deviation * 2);
  }

  /**
   * 计算色彩平衡
   */
  private calculateColorBalance(pixels: Uint8ClampedArray): number {
    let totalR = 0, totalG = 0, totalB = 0;
    const pixelCount = pixels.length / 4;
    
    for (let i = 0; i < pixels.length; i += 4) {
      totalR += pixels[i];
      totalG += pixels[i + 1];
      totalB += pixels[i + 2];
    }
    
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    
    // 计算RGB通道的方差
    const rgVariance = Math.pow(avgR - avgG, 2);
    const gbVariance = Math.pow(avgG - avgB, 2);
    const rbVariance = Math.pow(avgR - avgB, 2);
    
    const totalVariance = (rgVariance + gbVariance + rbVariance) / 3;
    
    // 方差越小，色彩平衡越好
    return Math.max(0, 1 - totalVariance / 10000);
  }

  /**
   * 计算噪点水平
   */
  private calculateNoiseLevel(pixels: Uint8ClampedArray, width: number, height: number): number {
    let noise = 0;
    let count = 0;
    
    // 使用简单的高频分量检测噪点
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 3x3核的拉普拉斯算子
        const laplacian = this.applyLaplacianKernel(pixels, x, y, width);
        noise += Math.abs(laplacian);
        count++;
      }
    }
    
    const avgNoise = noise / count;
    return Math.min(avgNoise / 100, 1); // 归一化，值越高噪点越多
  }

  private applyLaplacianKernel(pixels: Uint8ClampedArray, x: number, y: number, width: number): number {
    const kernel = [
      [0, -1, 0],
      [-1, 4, -1],
      [0, -1, 0]
    ];
    
    let result = 0;
    for (let ky = 0; ky < 3; ky++) {
      for (let kx = 0; kx < 3; kx++) {
        const px = x + kx - 1;
        const py = y + ky - 1;
        const idx = (py * width + px) * 4;
        const gray = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
        result += gray * kernel[ky][kx];
      }
    }
    
    return result;
  }

  /**
   * 评估分辨率
   */
  private evaluateResolution(width: number, height: number): number {
    const totalPixels = width * height;
    
    // 分辨率评分标准
    if (totalPixels >= 2073600) return 1.0;  // 1920x1080及以上
    if (totalPixels >= 921600) return 0.8;   // 1280x720
    if (totalPixels >= 307200) return 0.6;   // 640x480
    if (totalPixels >= 76800) return 0.4;    // 320x240
    return 0.2;
  }

  /**
   * 评估提示词匹配度
   */
  private assessPromptAlignment(keywords: string[], toolCharacteristics: any): number {
    // 基于关键词匹配的简化实现
    const relevantKeywords = keywords.filter(kw => 
      toolCharacteristics.expectedKeywords?.some((expected: string) => 
        kw.toLowerCase().includes(expected.toLowerCase())
      )
    );
    
    return Math.min(relevantKeywords.length / Math.max(keywords.length, 1), 1);
  }

  /**
   * 评估内容完整性
   */
  private assessCompleteness(prompt: string, toolCharacteristics: any): number {
    const promptLength = prompt.length;
    
    // 根据工具类型判断完整性
    if (toolCharacteristics.requiresDetailed && promptLength < 50) {
      return 0.3;
    } else if (toolCharacteristics.prefersConcise && promptLength > 200) {
      return 0.7;
    }
    
    return 0.8; // 默认认为比较完整
  }

  /**
   * 评估创意度
   */
  private assessCreativity(toolId: string, prompt: string): number {
    const creativeTools = ['characterStory', 'filmNoir', 'emoticons'];
    const baseCreativity = creativeTools.includes(toolId) ? 0.8 : 0.6;
    
    // 基于提示词的创意性分析
    const creativeWords = ['创意', '独特', '艺术', '抽象', '想象', '梦幻', '超现实'];
    const hasCreativeWords = creativeWords.some(word => prompt.includes(word));
    
    return hasCreativeWords ? Math.min(baseCreativity + 0.2, 1) : baseCreativity;
  }

  /**
   * 评估美学价值
   */
  private assessAesthetics(toolId: string): number {
    const aestheticScores: Record<string, number> = {
      'photoToFigure': 0.7,
      'filmNoir': 0.9,
      'interiorDesign': 0.8,
      'fashionEcommerce': 0.8,
      'characterStory': 0.7,
      'textToImage': 0.6
    };
    
    return aestheticScores[toolId] || 0.6;
  }

  /**
   * 评估内容连贯性
   */
  private assessCoherence(keywords: string[]): number {
    // 简化的连贯性检查
    if (keywords.length <= 1) return 1.0;
    
    // 检查关键词之间的关联性（这里使用简化的实现）
    const coherenceScore = Math.max(0.5, 1 - (keywords.length * 0.1));
    return coherenceScore;
  }

  /**
   * 计算总体评分
   */
  private calculateOverallScore(
    technical: ImageQualityMetrics['technicalQuality'],
    content: ImageQualityMetrics['contentQuality']
  ): number {
    // 技术质量权重 40%，内容质量权重 60%
    const technicalScore = (
      technical.sharpness * 0.25 +
      technical.contrast * 0.2 +
      technical.brightness * 0.15 +
      technical.colorBalance * 0.15 +
      (1 - technical.noiseLevel) * 0.15 +
      technical.resolution * 0.1
    ) * 40;
    
    const contentScore = (
      content.promptAlignment * 0.3 +
      content.completeness * 0.2 +
      content.creativity * 0.2 +
      content.aesthetics * 0.2 +
      content.coherence * 0.1
    ) * 60;
    
    return Math.round(technicalScore + contentScore);
  }

  /**
   * 质量分类
   */
  private categorizeQuality(score: number): ImageQualityMetrics['category'] {
    if (score >= this.qualityThresholds.excellent) return 'excellent';
    if (score >= this.qualityThresholds.good) return 'good';
    if (score >= this.qualityThresholds.fair) return 'fair';
    return 'poor';
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(
    technical: ImageQualityMetrics['technicalQuality'],
    content: ImageQualityMetrics['contentQuality'],
    toolId: string,
    prompt: string
  ): string[] {
    const suggestions: string[] = [];
    
    // 技术质量建议
    if (technical.sharpness < 0.6) {
      suggestions.push('尝试使用更高质量的输入图像或调整图像参数');
    }
    
    if (technical.contrast < 0.5) {
      suggestions.push('在提示词中添加"高对比度"或"鲜明"等关键词');
    }
    
    if (technical.brightness < 0.5) {
      suggestions.push('调整亮度设置，或在描述中指明lighting preferences');
    }
    
    if (technical.noiseLevel > 0.7) {
      suggestions.push('图像可能存在噪点，尝试重新生成或使用降噪工具');
    }
    
    // 内容质量建议
    if (content.promptAlignment < 0.6) {
      suggestions.push('提示词与所选工具不够匹配，考虑使用更相关的描述');
    }
    
    if (content.completeness < 0.5) {
      suggestions.push('提示词信息不够完整，尝试添加更多细节描述');
    }
    
    if (content.creativity < 0.5) {
      suggestions.push('尝试使用更有创意的描述词汇来提高图像的艺术性');
    }
    
    // 工具特定建议
    const toolSpecificSuggestions = this.getToolSpecificSuggestions(toolId, content);
    suggestions.push(...toolSpecificSuggestions);
    
    return suggestions;
  }

  /**
   * 获取工具特定的建议
   */
  private getToolSpecificSuggestions(toolId: string, content: ImageQualityMetrics['contentQuality']): string[] {
    const suggestions: string[] = [];
    
    switch (toolId) {
      case 'photoToFigure':
        if (content.completeness < 0.7) {
          suggestions.push('对于手办转换，建议详细描述想要的风格和细节');
        }
        break;
      
      case 'filmNoir':
        if (content.aesthetics < 0.8) {
          suggestions.push('黑白电影风格需要强调戏剧性lighting和composition');
        }
        break;
      
      case 'interiorDesign':
        if (content.promptAlignment < 0.7) {
          suggestions.push('室内设计工具建议指明具体的风格、色彩和材质偏好');
        }
        break;
        
      default:
        break;
    }
    
    return suggestions;
  }

  /**
   * 记录质量指标历史
   */
  private recordQualityMetrics(toolId: string, metrics: ImageQualityMetrics): void {
    if (!this.qualityHistory.has(toolId)) {
      this.qualityHistory.set(toolId, []);
    }
    
    const history = this.qualityHistory.get(toolId)!;
    history.push(metrics);
    
    // 保持最近100条记录
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * 更新质量模型（基于用户反馈）
   */
  private updateQualityModel(
    predictedMetrics: ImageQualityMetrics,
    userFeedback: number,
    toolId: string
  ): void {
    // 实际应用中这里会更新ML模型的权重
    // 目前记录反馈用于后续分析
    console.log(`Quality model feedback: Tool ${toolId}, Predicted: ${predictedMetrics.overallScore}, User: ${userFeedback * 20}`);
  }

  /**
   * 获取工具质量统计
   */
  getToolQualityStats(toolId: string): {
    averageScore: number;
    totalAssessments: number;
    categoryDistribution: Record<string, number>;
    commonIssues: string[];
  } {
    const history = this.qualityHistory.get(toolId) || [];
    
    if (history.length === 0) {
      return {
        averageScore: 0,
        totalAssessments: 0,
        categoryDistribution: {},
        commonIssues: []
      };
    }
    
    const averageScore = history.reduce((sum, m) => sum + m.overallScore, 0) / history.length;
    
    const categoryDistribution = history.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 分析常见问题
    const allSuggestions = history.flatMap(m => m.suggestions);
    const suggestionCounts = allSuggestions.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonIssues = Object.entries(suggestionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([suggestion]) => suggestion);
    
    return {
      averageScore: Math.round(averageScore * 100) / 100,
      totalAssessments: history.length,
      categoryDistribution,
      commonIssues
    };
  }

  // 辅助方法
  private async loadImageToCanvas(imageData: string): Promise<HTMLCanvasElement | null> {
    if (typeof window === 'undefined') return null;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => resolve(null);
      img.src = imageData;
    });
  }

  private extractKeywords(prompt: string): string[] {
    return prompt
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  private getToolCharacteristics(toolId: string): any {
    const characteristics: Record<string, any> = {
      'photoToFigure': {
        requiresDetailed: true,
        expectedKeywords: ['手办', '模型', '3D', '角色'],
        prefersConcise: false
      },
      'filmNoir': {
        requiresDetailed: true,
        expectedKeywords: ['黑白', '电影', '戏剧', 'noir'],
        prefersConcise: false
      },
      'textToImage': {
        requiresDetailed: false,
        expectedKeywords: [],
        prefersConcise: false
      }
    };
    
    return characteristics[toolId] || {
      requiresDetailed: false,
      expectedKeywords: [],
      prefersConcise: false
    };
  }

  private getDefaultQualityMetrics(): ImageQualityMetrics {
    return {
      technicalQuality: {
        sharpness: 0.5,
        contrast: 0.5,
        brightness: 0.5,
        colorBalance: 0.5,
        noiseLevel: 0.5,
        resolution: 0.5
      },
      contentQuality: {
        promptAlignment: 0.5,
        completeness: 0.5,
        creativity: 0.5,
        aesthetics: 0.5,
        coherence: 0.5
      },
      overallScore: 50,
      category: 'fair',
      suggestions: ['无法分析图像质量，请重试']
    };
  }
}

export const imageQualityAssessor = new ImageQualityAssessor();