/**
 * Nano Banana 100个创意提示词工具集
 * 基于 https://github.com/JimmyLv/awesome-nano-banana
 */

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  caseNumber: string;
  promptTemplate: (userInput?: string, params?: Record<string, string>) => string;
  requiresImage: boolean;
  requiresMultipleImages?: boolean;
  parameters?: {
    [key: string]: {
      label: string;
      placeholder: string;
      required: boolean;
    };
  };
}

export const TOOL_CATEGORIES = {
  CREATIVE_AD: '创意广告',
  PORTRAIT_ART: '艺术肖像',
  '3D_DESIGN': '3D设计',
  GAME_STYLE: '游戏风格',
  CREATIVE_TRANSFORM: '创意转换',
  PHOTOGRAPHY: '摄影效果',
  ART_STYLE: '艺术风格',
  SCENE_CREATION: '场景创作',
  TECH_EFFECT: '科技特效',
  NATURE_SCENE: '自然场景',
};

export const NANO_BANANA_TOOLS: ToolConfig[] = [
  // Case 100: 创意广告
  {
    id: 'creative_ad',
    name: '创意广告涂鸦',
    description: '真实物体与手绘涂鸦结合的创意广告',
    category: TOOL_CATEGORIES.CREATIVE_AD,
    caseNumber: 'Case 100',
    requiresImage: false,
    parameters: {
      realObject: {
        label: '真实物体',
        placeholder: '例如：coffee bean',
        required: true,
      },
      doodleConcept: {
        label: '涂鸦概念',
        placeholder: '例如：The giant coffee bean becomes a space planet',
        required: true,
      },
      adCopy: {
        label: '广告文案',
        placeholder: '例如：Explore Bold Flavor',
        required: true,
      },
      brandLogo: {
        label: '品牌标志',
        placeholder: '例如：Starbucks logo',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) => 
      `A minimalist and creative advertisement set on a clean white background. A real ${params.realObject || '[Real Object]'} is integrated into a hand-drawn black ink doodle, using loose, playful lines. The ${params.doodleConcept || '[Doodle Concept]'} interacts with the object in a clever, imaginative way. Include bold black ${params.adCopy || '[Ad Copy]'} text at the top or center. Place the ${params.brandLogo || '[Brand Logo]'} clearly at the bottom. The visual should be clean, fun, high-contrast, and conceptually smart. ${userInput}`,
  },

  // Case 99: 黑白肖像艺术
  {
    id: 'bw_portrait',
    name: '黑白肖像艺术',
    description: '高分辨率黑白肖像，编辑和美术摄影风格',
    category: TOOL_CATEGORIES.PORTRAIT_ART,
    caseNumber: 'Case 99',
    requiresImage: false,
    parameters: {
      characterDescription: {
        label: '人物描述',
        placeholder: '例如：messy dark hair, round glasses, contemplative expression',
        required: true,
      },
      moodDescription: {
        label: '氛围描述',
        placeholder: '例如：introspective and artistic',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `A high-resolution black and white portrait artwork, in an editorial and fine art photography style. The composition captures a person with ${params.characterDescription || 'distinctive features'}. Shot from a slightly low angle, dramatic lighting creates deep shadows and bright highlights, emphasizing texture and form. The mood is ${params.moodDescription || 'contemplative'}. High contrast, sharp focus on eyes, shallow depth of field, film grain texture, reminiscent of Irving Penn or Richard Avedon's portrait work. ${userInput}`,
  },

  // Case 98: 模糊剪影
  {
    id: 'blurred_silhouette',
    name: '模糊剪影',
    description: '磨砂玻璃后的模糊剪影效果',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 98',
    requiresImage: false,
    parameters: {
      subject: {
        label: '主体',
        placeholder: '例如：person, cat, hand',
        required: true,
      },
      part: {
        label: '清晰部分',
        placeholder: '例如：hand, face, paw',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `A black and white photograph shows the blurred silhouette of a ${params.subject || '[SUBJECT]'} behind a frosted or translucent surface. The ${params.part || '[PART]'} is sharply defined and pressed against the surface, creating a stark contrast with the rest of the hazy, indistinct figure. The background is a soft gradient of gray tones, enhancing the mysterious and artistic atmosphere. ${userInput}`,
  },

  // Case 97: 针织娃娃
  {
    id: 'knitted_doll',
    name: '针织娃娃',
    description: '手工钩针编织的毛线娃娃',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 97',
    requiresImage: true,
    promptTemplate: (userInput = '') =>
      `A close-up, professionally composed photograph showcasing a hand-crocheted yarn doll gently cradled by two hands. The doll features intricate yarn textures and vibrant colors. The background is softly blurred, highlighting the doll's details. Warm, soft lighting creates a cozy atmosphere. ${userInput}`,
  },

  // Case 96: 摇头娃娃
  {
    id: 'bobblehead',
    name: '摇头娃娃生成器',
    description: '将自拍照转换成摇头娃娃',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 96',
    requiresImage: true,
    parameters: {
      baseText: {
        label: '底座文字',
        placeholder: '例如：Best Developer',
        required: false,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Turn this photo into a bobblehead: enlarge the head slightly, keep the face accurate and cartoonify the body, place on a small round base with the text '${params.baseText || 'AWESOME'}', plain background. ${userInput}`,
  },

  // Case 95: 动物地标自拍
  {
    id: 'animal_selfie',
    name: '动物地标自拍',
    description: '三只动物在著名地标前的自拍',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 95',
    requiresImage: false,
    parameters: {
      animalType: {
        label: '动物类型',
        placeholder: '例如：penguins, cats, dogs',
        required: true,
      },
      landmark: {
        label: '地标',
        placeholder: '例如：Eiffel Tower, Golden Gate Bridge',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `A close-up selfie of three ${params.animalType || 'animals'} with different expressions in front of the iconic ${params.landmark || 'landmark'}. The ${params.animalType || 'animals'} are positioned at varying distances from the camera, creating depth. One is making a silly face, another is winking, and the third is looking surprised. The ${params.landmark || 'landmark'} is clearly visible but slightly out of focus in the background. Natural lighting, photorealistic style, as if they actually took this selfie with a phone camera. ${userInput}`,
  },

  // Case 94: 玻璃质感重塑
  {
    id: 'glass_retexture',
    name: '玻璃质感重塑',
    description: '将物体转换为玻璃材质',
    category: TOOL_CATEGORIES['3D_DESIGN'],
    caseNumber: 'Case 94',
    requiresImage: true,
    promptTemplate: (userInput = '') =>
      `Transform this object into glass: borosilicate glass material, 85% transparent with subtle green tint at edges, smooth surface with occasional controlled bubbles, high clarity with prismatic light effects at curves, studio lighting with key light from upper left, gradient background from light gray to white, product photography style, hyperrealistic. ${userInput}`,
  },

  // Case 93: 毛绒玩具转换
  {
    id: 'plush_toy',
    name: '毛绒玩具转换',
    description: '将图片转换成毛绒玩具效果',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 93',
    requiresImage: true,
    promptTemplate: (userInput = '') =>
      `Transform this into a plush toy: soft fabric texture, visible stitching, button eyes, simplified cute features, sitting on white background, product photography style. ${userInput}`,
  },

  // Case 92: 迪士尼皮克斯海报
  {
    id: 'disney_pixar_poster',
    name: '迪士尼皮克斯海报',
    description: '迪士尼皮克斯电影海报风格',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 92',
    requiresImage: false,
    parameters: {
      movieTitle: {
        label: '电影标题',
        placeholder: '例如：Adventure Time',
        required: true,
      },
      mainCharacter: {
        label: '主角描述',
        placeholder: '例如：a brave young explorer',
        required: true,
      },
      setting: {
        label: '场景设置',
        placeholder: '例如：magical forest',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Disney Pixar movie poster style: '${params.movieTitle || 'ADVENTURE'}' in colorful 3D letters at top, ${params.mainCharacter || 'animated character'} as the main character in center, supporting characters in background, ${params.setting || 'magical world'}, bright colors, whimsical atmosphere, 'Coming Soon' at bottom. ${userInput}`,
  },

  // Case 91: 乐高风格转换
  {
    id: 'lego_transformation',
    name: '乐高风格转换',
    description: '将图片转换为乐高积木风格',
    category: TOOL_CATEGORIES.GAME_STYLE,
    caseNumber: 'Case 91',
    requiresImage: true,
    promptTemplate: (userInput = '') =>
      `Transform this into LEGO: made entirely of LEGO bricks, visible studs and connections, bright plastic colors, on LEGO baseplate, toy photography style, shallow depth of field. ${userInput}`,
  },

  // Case 90: Emoji混合
  {
    id: 'emoji_kitchen',
    name: 'Emoji厨房',
    description: '混合两个emoji创造新的表情',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 90',
    requiresImage: false,
    parameters: {
      emoji1: {
        label: '第一个Emoji',
        placeholder: '例如：😍 heart eyes',
        required: true,
      },
      emoji2: {
        label: '第二个Emoji',
        placeholder: '例如：🤖 robot',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Emoji Kitchen style: blend ${params.emoji1 || 'emoji'} and ${params.emoji2 || 'emoji'} into one creative hybrid emoji, flat design, yellow background, Google emoji art style, smooth gradients, playful and expressive. ${userInput}`,
  },

  // Case 89: 复古游戏精灵
  {
    id: 'retro_game_sprite',
    name: '复古游戏精灵',
    description: '16位像素艺术精灵',
    category: TOOL_CATEGORIES.GAME_STYLE,
    caseNumber: 'Case 89',
    requiresImage: false,
    parameters: {
      character: {
        label: '角色描述',
        placeholder: '例如：warrior with sword',
        required: true,
      },
      pose: {
        label: '姿势',
        placeholder: '例如：idle stance, jumping',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `16-bit pixel art sprite: ${params.character || 'character'}, ${params.pose || 'idle'} pose, limited color palette, visible pixels, transparent background, SNES era style. ${userInput}`,
  },

  // Case 88: 微缩场景
  {
    id: 'miniature_scene',
    name: '微缩场景',
    description: '移轴摄影效果的微缩世界',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 88',
    requiresImage: false,
    parameters: {
      scene: {
        label: '场景描述',
        placeholder: '例如：busy city street',
        required: true,
      },
      focalPoint: {
        label: '焦点',
        placeholder: '例如：center intersection',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Tilt-shift photography of ${params.scene || 'scene'}, miniature effect, shallow depth of field with sharp focus on ${params.focalPoint || 'center'}, bright saturated colors, looks like a detailed model train set, shot from high angle. ${userInput}`,
  },

  // Case 87: 霓虹灯招牌
  {
    id: 'neon_sign',
    name: '霓虹灯招牌',
    description: '发光的霓虹灯文字效果',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 87',
    requiresImage: false,
    parameters: {
      text: {
        label: '文字内容',
        placeholder: '例如：OPEN 24/7',
        required: true,
      },
      color: {
        label: '霓虹颜色',
        placeholder: '例如：hot pink, electric blue',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Neon sign design: '${params.text || 'NEON'}' in ${params.color || 'hot pink'} neon tubes, mounted on dark brick wall, realistic glass tubes with visible electrodes, subtle glow and reflection on wall, night scene, moody lighting. ${userInput}`,
  },

  // Case 86: 3D图标
  {
    id: '3d_icon',
    name: '3D应用图标',
    description: 'Big Sur风格的3D图标设计',
    category: TOOL_CATEGORIES['3D_DESIGN'],
    caseNumber: 'Case 86',
    requiresImage: false,
    parameters: {
      object: {
        label: '物体描述',
        placeholder: '例如：calculator, camera',
        required: true,
      },
      colorScheme: {
        label: '配色方案',
        placeholder: '例如：purple to pink gradient',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `3D app icon: ${params.object || 'object'}, isometric view, soft shadows, ${params.colorScheme || 'gradient'} background, glossy finish, rounded corners, Big Sur style, Blender 3D render quality. ${userInput}`,
  },

  // Case 85: 超现实素描
  {
    id: 'surreal_sketch',
    name: '超现实素描互动',
    description: '铅笔素描与彩色实物的超现实结合',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 85',
    requiresImage: false,
    parameters: {
      subject1: {
        label: '素描主体',
        placeholder: '例如：a person, a cat',
        required: true,
      },
      subject2: {
        label: '彩色实物',
        placeholder: '例如：a giant apple, a coffee cup',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `A pencil sketch of ${params.subject1 || 'subject'} interacting with ${params.subject2 || 'object'}, where ${params.subject2 || 'object'} is rendered as a realistic, full-color object, creating a surreal contrast against the hand-drawn style of ${params.subject1 || 'subject'} and the background. ${userInput}`,
  },

  // Case 84: 动物硅胶手腕垫
  {
    id: 'silicone_wrist_rest',
    name: '动物硅胶手腕垫',
    description: '可爱的动物造型硅胶手腕垫',
    category: TOOL_CATEGORIES['3D_DESIGN'],
    caseNumber: 'Case 84',
    requiresImage: false,
    parameters: {
      animalEmoji: {
        label: '动物emoji',
        placeholder: '例如：🐼, 🐱, 🐶',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Create an image of a cute chibi-style silicone wrist rest based on the ${params.animalEmoji || '🐼'} emoji. The wrist rest is made of soft, food-grade silicone with a skin-friendly matte surface. Designed in a personified cartoon style, the expression is lively, with both arms stretched out as if hugging the user's wrist. Round, soft, and adorable shape. Product photography style, 45-degree top-down view, white background, soft lighting. ${userInput}`,
  },

  // Case 83: 发光解剖图
  {
    id: 'glowing_anatomy',
    name: '发光解剖图',
    description: '科技感的发光线条解剖图',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 83',
    requiresImage: false,
    parameters: {
      subject: {
        label: '主体',
        placeholder: '例如：human body, cat, mechanical device',
        required: true,
      },
      part: {
        label: '重点部位',
        placeholder: '例如：heart, brain, engine',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `A digital illustration of a ${params.subject || 'subject'}, portrayed with a network of glowing clean pristine blue lines outlining its anatomy. The image is set against a dark background. ${params.part || 'part'} is emphasized with a red glow to indicate significance. The style is both educational and visually captivating, designed to resemble an advanced imaging technique. ${userInput}`,
  },

  // Case 82: 城市天气预报
  {
    id: 'city_weather',
    name: '城市天气预报',
    description: '等距视角的城市天气场景',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 82',
    requiresImage: false,
    parameters: {
      city: {
        label: '城市名称',
        placeholder: '例如：Tokyo, Paris',
        required: true,
      },
      weather: {
        label: '天气状况',
        placeholder: '例如：heavy rain, sunny, snow',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Show a clear 45-degree bird's-eye view of an isometric miniature ${params.city || 'city'} with ${params.weather || 'weather'}. Include iconic landmarks. The scene should have appropriate lighting for the weather, with weather effects clearly visible. Tilt-shift photography style, vibrant colors, detailed architecture. ${userInput}`,
  },

  // Case 81: 食物飞溅
  {
    id: 'food_splash',
    name: '食物飞溅艺术',
    description: '高速摄影捕捉食物飞溅瞬间',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 81',
    requiresImage: false,
    parameters: {
      food: {
        label: '食物',
        placeholder: '例如：strawberry, coffee bean',
        required: true,
      },
      liquid: {
        label: '液体',
        placeholder: '例如：milk, water, chocolate',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `High-speed photography of ${params.food || 'food'} splashing into ${params.liquid || 'liquid'}, captured at the moment of impact. Dramatic splash with droplets frozen in mid-air. Professional food photography lighting, ultra-sharp focus, visible motion. ${userInput}`,
  },

  // Case 80: 双重曝光
  {
    id: 'double_exposure',
    name: '双重曝光',
    description: '轮廓与场景的艺术融合',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 80',
    requiresImage: false,
    parameters: {
      primary: {
        label: '主要轮廓',
        placeholder: '例如：person profile, animal',
        required: true,
      },
      secondary: {
        label: '内部场景',
        placeholder: '例如：forest, cityscape, ocean',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Double exposure photography combining ${params.primary || 'silhouette'} with ${params.secondary || 'scene'} inside. The ${params.secondary || 'scene'} fills the shape of the ${params.primary || 'silhouette'}, creating a seamless blend. Artistic composition, high contrast. ${userInput}`,
  },

  // 继续添加更多工具...
  // Case 79-70
  {
    id: 'paper_cutout',
    name: '纸艺剪纸',
    description: '多层纸艺剪纸效果',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 79',
    requiresImage: false,
    parameters: {
      scene: {
        label: '场景描述',
        placeholder: '例如：forest with animals',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Layered paper cut art depicting ${params.scene || 'scene'}, multiple depth layers from 5-7 sheets of colored paper, each layer creating shadows, photographed from above with soft side lighting to show depth and texture. ${userInput}`,
  },

  {
    id: 'cyberpunk_portrait',
    name: '赛博朋克肖像',
    description: '霓虹灯光的赛博朋克风格肖像',
    category: TOOL_CATEGORIES.PORTRAIT_ART,
    caseNumber: 'Case 78',
    requiresImage: false,
    parameters: {
      character: {
        label: '人物描述',
        placeholder: '例如：young woman with silver hair',
        required: true,
      },
      cybernetics: {
        label: '赛博改造',
        placeholder: '例如：glowing eye implant',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Cyberpunk portrait: ${params.character || 'character'}, neon pink and blue lighting reflecting on face, ${params.cybernetics || 'cybernetic features'}, rain-slicked street background with holographic advertisements, blade runner aesthetic, high contrast, moody atmosphere. ${userInput}`,
  },

  {
    id: 'isometric_room',
    name: '等距房间',
    description: '等距视角的3D房间设计',
    category: TOOL_CATEGORIES['3D_DESIGN'],
    caseNumber: 'Case 77',
    requiresImage: false,
    parameters: {
      roomType: {
        label: '房间类型',
        placeholder: '例如：bedroom, office, kitchen',
        required: true,
      },
      style: {
        label: '风格',
        placeholder: '例如：modern, retro, japanese',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Isometric 3D room: ${params.roomType || 'room'} in ${params.style || 'modern'} style, detailed furniture and decorations, soft ambient lighting, miniature diorama feel, 45-degree angle view. ${userInput}`,
  },

  {
    id: 'watercolor_landscape',
    name: '水彩风景',
    description: '水彩画风格的风景艺术',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 76',
    requiresImage: false,
    parameters: {
      landscape: {
        label: '风景描述',
        placeholder: '例如：mountain lake at sunset',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Watercolor painting of ${params.landscape || 'landscape'}, wet-on-wet technique with colors bleeding into each other, visible paper texture, artistic brushstrokes, impressionistic style. ${userInput}`,
  },

  {
    id: 'vintage_poster',
    name: '复古旅行海报',
    description: '装饰艺术风格的复古海报',
    category: TOOL_CATEGORIES.CREATIVE_AD,
    caseNumber: 'Case 75',
    requiresImage: false,
    parameters: {
      destination: {
        label: '目的地',
        placeholder: '例如：Paris, Tokyo',
        required: true,
      },
      tagline: {
        label: '标语',
        placeholder: '例如：City of Lights',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Vintage travel poster for ${params.destination || 'destination'}: bold Art Deco typography saying '${params.tagline || 'Visit Today'}', stylized illustration of landmarks, limited color palette, 1930s graphic design style, aged paper texture. ${userInput}`,
  },

  {
    id: 'floating_island',
    name: '浮空岛',
    description: '奇幻风格的浮空岛场景',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 74',
    requiresImage: false,
    parameters: {
      island: {
        label: '岛屿描述',
        placeholder: '例如：ancient temple ruins',
        required: true,
      },
      sky: {
        label: '天空描述',
        placeholder: '例如：sunset, stormy',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Fantasy floating island: ${params.island || 'mystical island'}, suspended in ${params.sky || 'dramatic'} sky, waterfalls cascading into clouds below, epic scale, magical atmosphere. ${userInput}`,
  },

  {
    id: 'origami_animal',
    name: '折纸动物',
    description: '精美的折纸动物艺术',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 73',
    requiresImage: false,
    parameters: {
      animal: {
        label: '动物类型',
        placeholder: '例如：crane, dragon, fox',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Origami ${params.animal || 'animal'} made from white paper, precise geometric folds visible, single light source creating dramatic shadows, minimalist background, macro photography style. ${userInput}`,
  },

  {
    id: 'split_season',
    name: '分割季节',
    description: '同一场景的不同季节对比',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 72',
    requiresImage: false,
    parameters: {
      subject: {
        label: '主体',
        placeholder: '例如：tree, landscape, house',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Single ${params.subject || 'tree'} split vertically showing winter on the left and summer on the right, seamless transition in the middle, same composition both sides, dramatic seasonal contrast, photorealistic. ${userInput}`,
  },

  {
    id: 'holographic_display',
    name: '全息显示',
    description: '未来科技的全息投影效果',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 71',
    requiresImage: false,
    parameters: {
      content: {
        label: '显示内容',
        placeholder: '例如：3D model, data visualization',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Futuristic holographic display projecting ${params.content || '3D content'} in mid-air, blue-green translucent projection with scan lines, dark room with ambient glow, sci-fi UI design, volumetric light beams. ${userInput}`,
  },

  {
    id: 'macro_crystal',
    name: '微距水晶',
    description: '极致微距的水晶摄影',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 70',
    requiresImage: false,
    parameters: {
      crystal: {
        label: '水晶类型',
        placeholder: '例如：quartz, amethyst',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Extreme macro photography of ${params.crystal || 'crystal'}, showing internal fractures and inclusions, rainbow light refraction, sharp geometric faces, bokeh background, focus stacking for complete sharpness. ${userInput}`,
  },

  // 继续添加 Case 69-50
  {
    id: 'steampunk_machine',
    name: '蒸汽朋克机械',
    description: '维多利亚时代的蒸汽朋克装置',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 69',
    requiresImage: false,
    parameters: {
      device: {
        label: '装置类型',
        placeholder: '例如：time machine, flying ship',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Steampunk ${params.device || 'machine'}: brass gears, copper pipes, steam vents, Victorian era aesthetic, intricate mechanical details, leather and wood accents, industrial revolution style. ${userInput}`,
  },

  {
    id: 'bioluminescent_creature',
    name: '生物发光生物',
    description: '深海发光生物',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 68',
    requiresImage: false,
    parameters: {
      creature: {
        label: '生物类型',
        placeholder: '例如：jellyfish, deep sea fish',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Bioluminescent ${params.creature || 'creature'} in deep ocean darkness, glowing with ethereal blue-green light, translucent body with visible internal structures, underwater photography style. ${userInput}`,
  },

  {
    id: 'art_nouveau_poster',
    name: '新艺术运动海报',
    description: '新艺术运动风格装饰海报',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 67',
    requiresImage: false,
    parameters: {
      subject: {
        label: '主题',
        placeholder: '例如：spring festival, theater show',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Art Nouveau poster for ${params.subject || 'event'}: flowing organic lines, floral motifs, elegant typography, muted earth tones with gold accents, Alphonse Mucha inspired style. ${userInput}`,
  },

  {
    id: 'ice_sculpture',
    name: '冰雕艺术',
    description: '晶莹剔透的冰雕作品',
    category: TOOL_CATEGORIES['3D_DESIGN'],
    caseNumber: 'Case 66',
    requiresImage: false,
    parameters: {
      sculpture: {
        label: '雕塑内容',
        placeholder: '例如：swan, dragon, castle',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Ice sculpture of ${params.sculpture || 'figure'}: crystal clear ice with internal light refraction, detailed carving marks visible, backlit with blue-white light, winter festival setting. ${userInput}`,
  },

  {
    id: 'comic_panel',
    name: '漫画分镜',
    description: '动作漫画分镜效果',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 65',
    requiresImage: false,
    parameters: {
      action: {
        label: '动作场景',
        placeholder: '例如：superhero landing, battle scene',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Comic book panel showing ${params.action || 'action scene'}: dynamic angles, motion lines, bold ink outlines, Ben Day dots for shading, speech bubbles, dramatic perspective. ${userInput}`,
  },

  {
    id: 'terrarium_world',
    name: '微型生态瓶',
    description: '玻璃瓶中的微型生态世界',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 64',
    requiresImage: false,
    parameters: {
      ecosystem: {
        label: '生态系统',
        placeholder: '例如：tropical jungle, desert oasis',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Glass terrarium containing miniature ${params.ecosystem || 'ecosystem'}: tiny plants, moss, small decorative elements, condensation on glass, soft natural lighting, macro photography. ${userInput}`,
  },

  {
    id: 'neon_cybercity',
    name: '赛博城市夜景',
    description: '霓虹闪烁的未来城市',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 63',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Cyberpunk cityscape at night: towering skyscrapers with holographic advertisements, neon signs in Japanese and English, flying vehicles, rain-slicked streets reflecting lights, dystopian atmosphere. ${userInput}`,
  },

  {
    id: 'stained_glass',
    name: '彩色玻璃窗',
    description: '教堂风格的彩色玻璃艺术',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 62',
    requiresImage: false,
    parameters: {
      design: {
        label: '设计主题',
        placeholder: '例如：nature scene, geometric pattern',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Stained glass window design: ${params.design || 'artistic pattern'}, vibrant colored glass pieces separated by lead lines, light streaming through creating colorful shadows, Gothic cathedral style. ${userInput}`,
  },

  {
    id: 'galaxy_nebula',
    name: '星系星云',
    description: '壮丽的太空星云景象',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 61',
    requiresImage: false,
    parameters: {
      colors: {
        label: '主要颜色',
        placeholder: '例如：purple and blue, red and orange',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Deep space nebula in ${params.colors || 'vibrant colors'}: swirling cosmic clouds, bright stars scattered throughout, distant galaxies visible, Hubble telescope quality, ethereal and majestic. ${userInput}`,
  },

  {
    id: 'japanese_garden',
    name: '日式庭园',
    description: '宁静的日式庭园景观',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 60',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Traditional Japanese garden: koi pond with stone bridge, carefully pruned bonsai trees, raked gravel patterns, moss-covered stones, pagoda in background, cherry blossoms, serene atmosphere. ${userInput}`,
  },

  // 继续添加 Case 59-40
  {
    id: 'food_art_portrait',
    name: '食物艺术肖像',
    description: '用食材创作的人物肖像',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 59',
    requiresImage: false,
    parameters: {
      foodType: {
        label: '食材类型',
        placeholder: '例如：vegetables, fruits, pasta',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Portrait created entirely from ${params.foodType || 'food items'}: cleverly arranged ingredients forming facial features, overhead shot, white background, food art photography style. ${userInput}`,
  },

  {
    id: 'ancient_ruins',
    name: '古代遗迹',
    description: '神秘的古代文明遗迹',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 58',
    requiresImage: false,
    parameters: {
      civilization: {
        label: '文明类型',
        placeholder: '例如：Mayan, Egyptian, Atlantis',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Ancient ${params.civilization || 'mysterious'} ruins: crumbling stone structures overgrown with vines, hieroglyphs on walls, shafts of light through openings, archaeological discovery atmosphere. ${userInput}`,
  },

  {
    id: 'liquid_metal',
    name: '液态金属',
    description: '流动的液态金属效果',
    category: TOOL_CATEGORIES['3D_DESIGN'],
    caseNumber: 'Case 57',
    requiresImage: false,
    parameters: {
      shape: {
        label: '形状',
        placeholder: '例如：sphere, human figure',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Liquid metal ${params.shape || 'form'}: chrome-like reflective surface, flowing and morphing, ripples and waves on surface, studio lighting creating reflections, T-1000 terminator style. ${userInput}`,
  },

  {
    id: 'graffiti_wall',
    name: '涂鸦墙艺术',
    description: '街头涂鸦艺术墙',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 56',
    requiresImage: false,
    parameters: {
      message: {
        label: '涂鸦内容',
        placeholder: '例如：Peace, Love, Dreams',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Street art graffiti: "${params.message || 'ART'}" in wildstyle letters, vibrant spray paint colors, urban brick wall, drips and splatters, tags and throw-ups in background, Banksy influence. ${userInput}`,
  },

  {
    id: 'underwater_city',
    name: '水下城市',
    description: '未来主义水下都市',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 55',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Futuristic underwater city: glass domes and tunnels, bioluminescent lighting, schools of fish swimming past, coral integrated into architecture, submarines as transport, Atlantis reimagined. ${userInput}`,
  },

  {
    id: 'kaleidoscope_pattern',
    name: '万花筒图案',
    description: '对称的万花筒艺术',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 54',
    requiresImage: false,
    parameters: {
      colors: {
        label: '配色方案',
        placeholder: '例如：rainbow, monochrome blue',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Kaleidoscope pattern in ${params.colors || 'vibrant colors'}: perfect symmetrical design, intricate geometric shapes, mandala-like composition, fractal elements, mesmerizing and hypnotic. ${userInput}`,
  },

  {
    id: 'time_lapse_sky',
    name: '延时天空',
    description: '长曝光的天空轨迹',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 53',
    requiresImage: false,
    parameters: {
      duration: {
        label: '时间跨度',
        placeholder: '例如：sunset to stars, full day',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Time-lapse photography showing ${params.duration || 'day to night'}: streaking clouds, star trails in circular patterns, changing colors of sky, silhouetted landscape, long exposure effect. ${userInput}`,
  },

  {
    id: 'balloon_art',
    name: '气球艺术',
    description: '创意气球造型艺术',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 52',
    requiresImage: false,
    parameters: {
      creation: {
        label: '造型',
        placeholder: '例如：dog, flower, dinosaur',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Balloon art sculpture of ${params.creation || 'animal'}: twisted and shaped colorful balloons, glossy latex texture, professional balloon modeling, white background, product photography. ${userInput}`,
  },

  {
    id: 'northern_lights',
    name: '北极光',
    description: '壮观的极光景象',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 51',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Aurora borealis dancing across night sky: vibrant green and purple ribbons of light, snow-covered landscape below, stars visible, pine trees silhouetted, long exposure photography, Iceland or Norway setting. ${userInput}`,
  },

  {
    id: 'mechanical_animal',
    name: '机械动物',
    description: '蒸汽朋克风格的机械生物',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 50',
    requiresImage: false,
    parameters: {
      animal: {
        label: '动物类型',
        placeholder: '例如：elephant, butterfly, wolf',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Mechanical ${params.animal || 'creature'}: exposed gears and pistons, brass and copper construction, steam vents, glowing eyes, biomechanical design, steampunk aesthetic, detailed engineering. ${userInput}`,
  },

  // 继续添加 Case 49-30
  {
    id: 'sand_castle',
    name: '沙雕城堡',
    description: '精美细致的沙雕艺术',
    category: TOOL_CATEGORIES['3D_DESIGN'],
    caseNumber: 'Case 49',
    requiresImage: false,
    parameters: {
      structure: {
        label: '建筑类型',
        placeholder: '例如：medieval castle, fantasy palace',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Elaborate sand sculpture of ${params.structure || 'castle'}: intricate details carved in sand, multiple towers and bridges, beach setting, golden hour lighting, waves in background. ${userInput}`,
  },

  {
    id: 'crystal_cave',
    name: '水晶洞穴',
    description: '神秘的地下水晶洞',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 48',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Underground crystal cave: giant crystals growing from walls and ceiling, ethereal lighting, reflections and refractions, underground lake, explorer with headlamp for scale, geological wonder. ${userInput}`,
  },

  {
    id: 'vintage_robot',
    name: '复古机器人',
    description: '50年代风格的复古机器人',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 47',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `1950s retro robot: tin toy aesthetic, dome head with antenna, boxy body, visible rivets, simple dial controls, wind-up key on back, vintage sci-fi poster style. ${userInput}`,
  },

  {
    id: 'butterfly_collection',
    name: '蝴蝶标本',
    description: '科学标本风格的蝴蝶收藏',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 46',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Victorian butterfly collection display: various exotic butterflies pinned in wooden frame, scientific labels with Latin names, vintage paper background, natural history museum style. ${userInput}`,
  },

  {
    id: 'cloud_formation',
    name: '云朵造型',
    description: '形状独特的云朵',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 45',
    requiresImage: false,
    parameters: {
      shape: {
        label: '云朵形状',
        placeholder: '例如：dragon, heart, face',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Dramatic cloud formation resembling ${params.shape || 'animal'}: fluffy cumulus clouds against blue sky, golden sunlight highlighting edges, photorealistic, awe-inspiring natural phenomenon. ${userInput}`,
  },

  {
    id: 'zen_garden',
    name: '枯山水',
    description: '日式枯山水庭园',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 44',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Japanese zen rock garden: carefully raked sand patterns, strategically placed rocks, minimalist design, morning light casting long shadows, meditation space, tranquil atmosphere. ${userInput}`,
  },

  {
    id: 'chocolate_sculpture',
    name: '巧克力雕塑',
    description: '精美的巧克力艺术品',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 43',
    requiresImage: false,
    parameters: {
      sculpture: {
        label: '雕塑内容',
        placeholder: '例如：rose, castle, portrait',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Chocolate sculpture of ${params.sculpture || 'artwork'}: dark, milk, and white chocolate, glossy finish, intricate details, professional patisserie presentation, elegant plating. ${userInput}`,
  },

  {
    id: 'fire_dancer',
    name: '火舞表演',
    description: '长曝光的火舞轨迹',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 42',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Fire dancing performance: long exposure showing light trails from burning poi, silhouetted performer, circular fire patterns, night beach setting, dramatic and mesmerizing. ${userInput}`,
  },

  {
    id: 'tree_house',
    name: '树屋设计',
    description: '梦幻的树屋建筑',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 41',
    requiresImage: false,
    parameters: {
      style: {
        label: '风格',
        placeholder: '例如：fairy tale, modern, rustic',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `${params.style || 'Magical'} treehouse: built around giant tree trunk, rope bridges, wooden platforms, lanterns hanging from branches, forest canopy setting, childhood dream realized. ${userInput}`,
  },

  {
    id: 'coral_reef',
    name: '珊瑚礁',
    description: '色彩缤纷的海底珊瑚世界',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 40',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Vibrant coral reef ecosystem: colorful corals, tropical fish swimming, sea anemones, rays of sunlight penetrating water, underwater photography, Great Barrier Reef quality. ${userInput}`,
  },

  // 最后添加 Case 39-1
  {
    id: 'geometric_animal',
    name: '几何动物',
    description: '低多边形风格的动物',
    category: TOOL_CATEGORIES['3D_DESIGN'],
    caseNumber: 'Case 39',
    requiresImage: false,
    parameters: {
      animal: {
        label: '动物',
        placeholder: '例如：wolf, eagle, lion',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Low poly geometric ${params.animal || 'animal'}: angular faceted surfaces, gradient colors on each polygon, dramatic lighting, modern digital art style, wallpaper quality. ${userInput}`,
  },

  {
    id: 'string_art',
    name: '线条艺术',
    description: '钉子和线创造的艺术',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 38',
    requiresImage: false,
    parameters: {
      pattern: {
        label: '图案',
        placeholder: '例如：heart, star, portrait',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `String art creating ${params.pattern || 'design'}: colored threads stretched between nails on wooden board, geometric patterns emerging from lines, dramatic shadows, craft art photography. ${userInput}`,
  },

  {
    id: 'aurora_city',
    name: '极光城市',
    description: '城市上空的北极光',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 37',
    requiresImage: false,
    parameters: {
      city: {
        label: '城市',
        placeholder: '例如：Reykjavik, Oslo, Helsinki',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Northern lights over ${params.city || 'Arctic city'}: green and purple aurora dancing above city lights, snow-covered rooftops, reflection in water, rare urban aurora phenomenon. ${userInput}`,
  },

  {
    id: 'book_sculpture',
    name: '书雕艺术',
    description: '书页雕刻的立体艺术',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 36',
    requiresImage: false,
    parameters: {
      scene: {
        label: '场景',
        placeholder: '例如：fairy tale, cityscape',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Book sculpture art: ${params.scene || 'scene'} carved from book pages, layered paper creating depth, intricate details, shadow box effect, literary art piece. ${userInput}`,
  },

  {
    id: 'lightning_strike',
    name: '闪电瞬间',
    description: '捕捉闪电击中的瞬间',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 35',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Lightning strike captured: multiple bolts branching across stormy sky, illuminating landscape below, long exposure, dramatic weather photography, electric purple and white. ${userInput}`,
  },

  {
    id: 'mirror_maze',
    name: '镜子迷宫',
    description: '无限反射的镜像空间',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 34',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Infinity mirror room: endless reflections creating tunnels of light, LED lights in multiple colors, person standing in center multiplied infinitely, Yayoi Kusama inspired. ${userInput}`,
  },

  {
    id: 'soap_bubble',
    name: '肥皂泡',
    description: '彩虹色的肥皂泡特写',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 33',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Macro photography of soap bubbles: iridescent rainbow colors swirling on surface, perfect spheres floating, black background, studio lighting highlighting colors, ethereal beauty. ${userInput}`,
  },

  {
    id: 'desert_oasis',
    name: '沙漠绿洲',
    description: '沙漠中的生命绿洲',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 32',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Desert oasis: palm trees around clear blue pool, sand dunes surrounding, camels resting in shade, mirages in distance, golden hour lighting, Arabian nights atmosphere. ${userInput}`,
  },

  {
    id: 'dna_helix',
    name: 'DNA螺旋',
    description: '科技感的DNA双螺旋结构',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 31',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `DNA double helix structure: glowing blue and green strands, molecular bonds visible, scientific visualization, rotating in space, futuristic medical technology aesthetic. ${userInput}`,
  },

  {
    id: 'autumn_reflection',
    name: '秋日倒影',
    description: '湖面上的秋色倒影',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 30',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Autumn lake reflection: trees with orange and red foliage perfectly mirrored in still water, morning mist, wooden dock extending into lake, peaceful and serene. ${userInput}`,
  },

  // 继续添加 Case 29-1
  {
    id: 'mosaic_portrait',
    name: '马赛克肖像',
    description: '小图片组成的马赛克肖像',
    category: TOOL_CATEGORIES.PORTRAIT_ART,
    caseNumber: 'Case 29',
    requiresImage: false,
    parameters: {
      madeOf: {
        label: '组成元素',
        placeholder: '例如：flowers, butterflies, gems',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Mosaic portrait made from thousands of tiny ${params.madeOf || 'images'}: when viewed close individual elements visible, from distance forms clear face, photomosaic art style. ${userInput}`,
  },

  {
    id: 'volcanic_eruption',
    name: '火山喷发',
    description: '壮观的火山喷发景象',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 28',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Volcanic eruption at night: lava fountains shooting into sky, rivers of molten lava, ash cloud illuminated from below, lightning in volcanic plume, dramatic natural power. ${userInput}`,
  },

  {
    id: 'clockwork_heart',
    name: '机械心脏',
    description: '齿轮组成的机械心脏',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 27',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Mechanical heart made of gears and clockwork: brass and copper components, visible mechanisms pumping, steam punk aesthetic, anatomically inspired design, intricate engineering. ${userInput}`,
  },

  {
    id: 'rainbow_prism',
    name: '棱镜彩虹',
    description: '光线通过棱镜的彩虹效果',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 26',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `White light passing through crystal prism: rainbow spectrum spreading across wall, physics demonstration, dark room with single light beam, scientific beauty, Pink Floyd inspired. ${userInput}`,
  },

  {
    id: 'ink_water',
    name: '水墨扩散',
    description: '墨水在水中的扩散艺术',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 25',
    requiresImage: false,
    parameters: {
      colors: {
        label: '墨水颜色',
        placeholder: '例如：black and red, blue and gold',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `${params.colors || 'Colorful'} ink diffusing in water: swirling patterns, organic flow, high-speed photography, white background, abstract art forming naturally. ${userInput}`,
  },

  {
    id: 'frozen_moment',
    name: '冰冻瞬间',
    description: '动作被冰冻的瞬间',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 24',
    requiresImage: false,
    parameters: {
      action: {
        label: '动作',
        placeholder: '例如：water balloon burst, jump',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Frozen moment of ${params.action || 'action'}: ultra high-speed photography, every detail captured mid-motion, dramatic lighting, time stopped effect. ${userInput}`,
  },

  {
    id: 'forest_spirit',
    name: '森林精灵',
    description: '神秘的森林精灵生物',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 23',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Mystical forest spirit: ethereal creature made of leaves and light, glowing eyes, ancient tree backdrop, fireflies surrounding, Studio Ghibli inspired fantasy. ${userInput}`,
  },

  {
    id: 'shattered_glass',
    name: '破碎玻璃',
    description: '玻璃破碎的瞬间',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 22',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Glass shattering in slow motion: thousands of fragments suspended in air, light refracting through pieces, impact point visible, high-speed photography, dramatic black background. ${userInput}`,
  },

  {
    id: 'cherry_blossom',
    name: '樱花飘落',
    description: '浪漫的樱花飘落场景',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 21',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Cherry blossom petals falling: pink sakura trees in full bloom, petals drifting on breeze, traditional Japanese temple in background, spring atmosphere, anime aesthetic. ${userInput}`,
  },

  {
    id: 'circuit_board_city',
    name: '电路板城市',
    description: '电路板构成的微型城市',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 20',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `City skyline made from circuit boards: electronic components as buildings, LED lights as windows, copper traces as roads, macro photography, cyberpunk miniature world. ${userInput}`,
  },

  {
    id: 'smoke_art',
    name: '烟雾艺术',
    description: '烟雾形成的艺术图案',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 19',
    requiresImage: false,
    parameters: {
      shape: {
        label: '形状',
        placeholder: '例如：dragon, dancer, face',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Smoke forming shape of ${params.shape || 'figure'}: incense smoke against black background, delicate wisps, ethereal and transient, fine art photography. ${userInput}`,
  },

  {
    id: 'abandoned_theme_park',
    name: '废弃游乐园',
    description: '被遗弃的游乐园场景',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 18',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Abandoned amusement park: rusted roller coaster overgrown with vines, broken carousel horses, peeling paint, post-apocalyptic atmosphere, nature reclaiming man-made structures. ${userInput}`,
  },

  {
    id: 'geometric_mandala',
    name: '几何曼陀罗',
    description: '精密的几何曼陀罗图案',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 17',
    requiresImage: false,
    parameters: {
      colors: {
        label: '配色',
        placeholder: '例如：gold and blue, rainbow',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Intricate geometric mandala: perfect symmetry, ${params.colors || 'vibrant'} colors, sacred geometry, fine details, meditation art, zentangle inspired patterns. ${userInput}`,
  },

  {
    id: 'rain_portrait',
    name: '雨中肖像',
    description: '雨滴玻璃后的人物肖像',
    category: TOOL_CATEGORIES.PORTRAIT_ART,
    caseNumber: 'Case 16',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Portrait through rain-covered glass: blurred figure behind water droplets, melancholic mood, city lights bokeh in background, emotional and atmospheric. ${userInput}`,
  },

  {
    id: 'crystal_forest',
    name: '水晶森林',
    description: '完全由水晶构成的森林',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 15',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Forest made entirely of crystals: crystalline trees, ground covered in crystal shards, light refracting creating rainbows, fantasy landscape, ethereal and magical. ${userInput}`,
  },

  {
    id: 'shadow_art',
    name: '影子艺术',
    description: '物体投射出意外的影子',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 14',
    requiresImage: false,
    parameters: {
      object: {
        label: '物体',
        placeholder: '例如：pile of trash, random objects',
        required: true,
      },
      shadow: {
        label: '影子形状',
        placeholder: '例如：couple kissing, city skyline',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Shadow art: ${params.object || 'ordinary objects'} arranged to cast shadow of ${params.shadow || 'unexpected shape'}, single light source, creative perspective, optical illusion. ${userInput}`,
  },

  {
    id: 'constellation_map',
    name: '星座图',
    description: '夜空中的星座连线',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 13',
    requiresImage: false,
    parameters: {
      constellation: {
        label: '星座',
        placeholder: '例如：Orion, Big Dipper, Zodiac',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Night sky showing ${params.constellation || 'constellation'}: stars connected with glowing lines, constellation illustration overlay, deep space background, astronomical chart style. ${userInput}`,
  },

  {
    id: 'melting_clock',
    name: '融化的时钟',
    description: '达利风格的超现实时钟',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 12',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Melting clocks in surreal landscape: Salvador Dali inspired, time distortion concept, desert setting, impossible physics, dreamlike quality, persistence of memory. ${userInput}`,
  },

  {
    id: 'bonsai_landscape',
    name: '盆景世界',
    description: '盆景中的微型景观',
    category: TOOL_CATEGORIES.NATURE_SCENE,
    caseNumber: 'Case 11',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Miniature world in bonsai pot: tiny bonsai tree with mini landscape, small figurines, zen garden elements, moss as grass, pebbles as boulders, tilt-shift effect. ${userInput}`,
  },

  {
    id: 'data_visualization',
    name: '数据可视化',
    description: '抽象的数据流动效果',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 10',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Abstract data visualization: flowing streams of light representing data, network nodes connected, holographic display, matrix-like digital rain, information age aesthetic. ${userInput}`,
  },

  {
    id: 'ice_fire_fusion',
    name: '冰火融合',
    description: '冰与火的对立融合',
    category: TOOL_CATEGORIES.TECH_EFFECT,
    caseNumber: 'Case 9',
    requiresImage: false,
    parameters: {
      subject: {
        label: '主体',
        placeholder: '例如：rose, phoenix, sword',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `${params.subject || 'Object'} split between ice and fire: half frozen with icicles, half burning with flames, meeting point creating steam, dramatic contrast, fantasy element. ${userInput}`,
  },

  {
    id: 'invisible_man',
    name: '隐形人',
    description: '只有衣服的隐形人效果',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 8',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Invisible person effect: floating clothes maintaining human shape, hat hovering above empty collar, gloves without hands, environment visible through gaps, surreal photography. ${userInput}`,
  },

  {
    id: 'storm_in_teacup',
    name: '茶杯风暴',
    description: '茶杯中的微型风暴',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 7',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Literal storm in a teacup: miniature hurricane swirling in tea, tiny lightning bolts, steam clouds, waves crashing against cup edges, surreal macro photography. ${userInput}`,
  },

  {
    id: 'book_world',
    name: '书中世界',
    description: '从书页中浮现的立体世界',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 6',
    requiresImage: false,
    parameters: {
      story: {
        label: '故事场景',
        placeholder: '例如：fairy tale castle, pirate ship',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Open book with ${params.story || '3D scene'} emerging from pages: paper craft style elements rising up, story coming to life, magical realism, creative photography. ${userInput}`,
  },

  {
    id: 'gravity_defying',
    name: '反重力',
    description: '违反重力的超现实场景',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 5',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Gravity-defying scene: water flowing upward, objects floating, person walking on ceiling, reversed physics, M.C. Escher inspired impossible architecture. ${userInput}`,
  },

  {
    id: 'paint_explosion',
    name: '颜料爆炸',
    description: '颜料爆炸的瞬间',
    category: TOOL_CATEGORIES.PHOTOGRAPHY,
    caseNumber: 'Case 4',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Paint explosion captured mid-burst: vibrant colors splashing outward, droplets frozen in air, high-speed photography, black background, abstract art in motion. ${userInput}`,
  },

  {
    id: 'dream_catcher',
    name: '捕梦网',
    description: '精美的印第安捕梦网',
    category: TOOL_CATEGORIES.ART_STYLE,
    caseNumber: 'Case 3',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Native American dreamcatcher: intricate web pattern, feathers and beads hanging, backlit by sunset, bokeh background, spiritual and mystical atmosphere. ${userInput}`,
  },

  {
    id: 'portal_gateway',
    name: '传送门',
    description: '通往另一世界的传送门',
    category: TOOL_CATEGORIES.SCENE_CREATION,
    caseNumber: 'Case 2',
    requiresImage: false,
    parameters: {
      world1: {
        label: '现实世界',
        placeholder: '例如：city street, forest',
        required: true,
      },
      world2: {
        label: '另一世界',
        placeholder: '例如：alien planet, underwater',
        required: true,
      },
    },
    promptTemplate: (userInput = '', params = {}) =>
      `Portal between ${params.world1 || 'normal world'} and ${params.world2 || 'fantasy realm'}: glowing circular gateway, two realities visible, energy crackling around edges, sci-fi concept. ${userInput}`,
  },

  {
    id: 'living_graffiti',
    name: '活体涂鸦',
    description: '从墙上走出的涂鸦角色',
    category: TOOL_CATEGORIES.CREATIVE_TRANSFORM,
    caseNumber: 'Case 1',
    requiresImage: false,
    promptTemplate: (userInput = '') =>
      `Street art character stepping out of wall: half graffiti on brick wall, half 3D realistic, breaking fourth wall effect, urban art coming to life, creative illusion. ${userInput}`,
  },
];

// 导出工具分类的辅助函数
export function getToolsByCategory(category: string): ToolConfig[] {
  return NANO_BANANA_TOOLS.filter(tool => tool.category === category);
}

// 导出搜索工具的函数
export function searchTools(keyword: string): ToolConfig[] {
  const lowerKeyword = keyword.toLowerCase();
  return NANO_BANANA_TOOLS.filter(tool => 
    tool.name.toLowerCase().includes(lowerKeyword) ||
    tool.description.toLowerCase().includes(lowerKeyword) ||
    tool.caseNumber.toLowerCase().includes(lowerKeyword)
  );
}

// 导出获取单个工具的函数
export function getToolById(id: string): ToolConfig | undefined {
  return NANO_BANANA_TOOLS.find(tool => tool.id === id);
}