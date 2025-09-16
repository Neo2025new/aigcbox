// 移除客户端SDK初始化，仅保留工具定义和类型
import { NANO_BANANA_TOOLS, ToolConfig, getToolById } from './nano-banana-tools';

export interface GenerateImageParams {
  prompt: string;
  images?: File[];
  numberOfImages?: number;
}

export interface GenerateImageResponse {
  success: boolean;
  images?: string[];
  error?: string;
}

function fileToGenerativePart(file: File): Promise<{
  inlineData: {
    data: string;
    mimeType: string;
  };
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve({
        inlineData: {
          data: base64.split(',')[1],
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 移除客户端生成函数，统一使用API路由
// 该函数已废弃，请使用 /api/generate 接口
export async function generateImage({
  prompt,
  images = [],
  numberOfImages = 1,
}: GenerateImageParams): Promise<GenerateImageResponse> {
  console.warn('generateImage is deprecated, use /api/generate instead');
  return {
    success: false,
    error: 'Please use /api/generate endpoint instead'
  };
}

// 将原有的工具转换为新格式
const ORIGINAL_TOOLS: ToolConfig[] = [
  {
    id: 'textToImage',
    name: '文字生成图片',
    description: '根据文字描述生成全新的图片',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: false,
    promptTemplate: (userInput: string = '') => 
      userInput || 'Create a beautiful and artistic image',
  },
  {
    id: 'photoToFigure',
    name: '照片转手办',
    description: '将照片转换成3D手办模型效果',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') => 
      `Turn this photo into a character figure. Behind it, place a box with character's image printed on it, and a computer showing the blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Set the scene indoors with bright lighting. ${userInput}`,
  },
  {
    id: 'imageEditor',
    name: '图片编辑助手',
    description: '对图片进行编辑修改（改变颜色、添加元素、修改细节等）',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') => 
      `Edit this image according to the following requirements: ${userInput || 'Enhance the image quality, improve colors and contrast, make it more vivid and appealing'}`,
  },
  {
    id: 'sketchPose',
    name: '草图控制姿势',
    description: '保持人物形象不变，按照新姿势生成图片',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    requiresMultipleImages: true,
    promptTemplate: (userInput: string = '') =>
      `Keeping the character image and clothing details of Figure 1 unchanged, generate a new picture according to the posture of Figure 2. ${userInput}`,
  },
  {
    id: 'productDisplay',
    name: '产品展示',
    description: '让模特展示指定产品',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    requiresMultipleImages: true,
    promptTemplate: (userInput: string = '') =>
      `Keep the character image and clothing details of Figure 1 unchanged, and display the toy in Figure 2 to generate a new picture. ${userInput}`,
  },
  {
    id: 'changeViewAngle',
    name: '改变视角',
    description: '改变图片的拍摄视角',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') =>
      `Change the perspective to a high angle, looking down from above as if from the ceiling corner. ${userInput}`,
  },
  {
    id: 'backgroundReplace',
    name: '背景服装替换',
    description: '替换背景和服装',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') =>
      `Keep the character image unchanged, replace the background with a room with a Christmas atmosphere, and replace the girl's clothes with Santa Claus clothes. ${userInput}`,
  },
  {
    id: 'wireframeMesh',
    name: '3D网格特效',
    description: '添加3D线框网格效果',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') =>
      `Draw cyan surface wire frame (grid-like) mesh inside the silhouette, that shows the 3D shape of what you see from the figure. ${userInput}`,
  },
  {
    id: 'groupPhoto',
    name: '多人合影',
    description: '多张照片合成合影',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    requiresMultipleImages: true,
    promptTemplate: (userInput: string = '') =>
      `Let these people take a photo together at the sunset beach. ${userInput}`,
  },
  {
    id: 'emoticons',
    name: '表情包制作',
    description: '制作搞笑表情包',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') =>
      `Use this IP image to create 9 funny and exaggerated emoticons. ${userInput}`,
  },
  {
    id: 'lineToRender',
    name: '线稿渲染',
    description: '将线稿转换为3D渲染图',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') =>
      `Render this line drawing into a finished 3D interior design with realistic lighting and materials. ${userInput}`,
  },
  {
    id: 'photoRestore',
    name: '老照片修复',
    description: '上色并修复老照片',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') =>
      `Colorize and restore this old photo in high definition, maintaining historical accuracy. ${userInput}`,
  },
  {
    id: 'characterStory',
    name: '角色故事创作',
    description: '创建连续的故事场景',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: false,
    promptTemplate: (userInput: string = '') =>
      `Create an 8-part visual story with consistent characters. Each scene should maintain character consistency while showing different emotional moments and plot developments. ${userInput}`,
  },
  {
    id: 'multiImageFusion',
    name: '多图融合',
    description: '将多张图片融合成一张',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    requiresMultipleImages: true,
    promptTemplate: (userInput: string = '') =>
      `Combine these images into a single seamless composition, blending elements naturally. ${userInput}`,
  },
  {
    id: 'fashionEcommerce',
    name: '时尚电商摄影',
    description: '生成专业电商产品图',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    requiresMultipleImages: true,
    promptTemplate: (userInput: string = '') =>
      `Create professional e-commerce fashion photography. Take the clothing from image 1 and have the model from image 2 wear it, generating realistic full-body shots with proper lighting. ${userInput}`,
  },
  {
    id: 'interiorDesign',
    name: '室内设计风格转换',
    description: '改变室内设计风格',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') =>
      `Transform this room into a modern minimalist style with Scandinavian aesthetics, using neutral colors and natural materials. ${userInput}`,
  },
  {
    id: 'productMockup',
    name: '产品样机生成',
    description: '创建产品营销素材',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') =>
      `Create professional product mockups with multiple angles and realistic lighting for marketing materials. ${userInput}`,
  },
  {
    id: 'naturalEdit',
    name: '自然语言编辑',
    description: '使用自然语言编辑图片',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: true,
    promptTemplate: (userInput: string = '') =>
      userInput || 'Edit the image according to the following instructions:',
  },
  {
    id: 'filmNoir',
    name: '黑白电影风格',
    description: '创建黑白电影风格叙事',
    category: '原始工具',
    caseNumber: 'Original',
    requiresImage: false,
    promptTemplate: (userInput: string = '') =>
      `Create a classic black and white film noir detective story with dramatic lighting and vintage cinematography. ${userInput}`,
  },
];

// 合并所有工具
export const ALL_TOOLS: ToolConfig[] = [...ORIGINAL_TOOLS, ...NANO_BANANA_TOOLS];

// 保持向后兼容的TOOL_PRESETS
export const TOOL_PRESETS = ORIGINAL_TOOLS.reduce((acc, tool) => {
  acc[tool.id] = {
    name: tool.name,
    description: tool.description,
    promptTemplate: tool.promptTemplate,
    requiresImage: tool.requiresImage,
    requiresMultipleImages: tool.requiresMultipleImages,
  };
  return acc;
}, {} as any);

// 导出工具相关函数
export { TOOL_CATEGORIES, getToolsByCategory, searchTools } from './nano-banana-tools';
export type { ToolConfig } from './nano-banana-tools';

// 新的生成函数，支持工具参数
export async function generateImageWithTool({
  toolId,
  params = {},
  userInput = '',
  images = [],
}: {
  toolId: string;
  params?: Record<string, string>;
  userInput?: string;
  images?: File[];
}): Promise<GenerateImageResponse> {
  const tool = getToolById(toolId) || ALL_TOOLS.find(t => t.id === toolId);
  
  if (!tool) {
    return {
      success: false,
      error: `Tool ${toolId} not found`,
    };
  }
  
  const prompt = tool.promptTemplate(userInput, params);
  
  return generateImage({
    prompt,
    images,
  });
}