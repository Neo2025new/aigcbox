'use client';

import { TOOL_PRESETS } from '@/lib/gemini';
import { 
  Camera, 
  Palette, 
  Wand2, 
  Users, 
  Package, 
  Eye, 
  Grid3x3, 
  Sparkles,
  Image,
  Film,
  Home,
  ShoppingBag,
  Edit,
  BookOpen
} from 'lucide-react';

// 定义工具类型
interface Tool {
  name: string;
  description: string;
  promptTemplate: (userInput: string, params?: Record<string, string>) => string;
  requiresImage?: boolean;
  requiresMultipleImages?: boolean;
}

const iconMap: Record<string, any> = {
  photoToFigure: Package,
  sketchPose: Users,
  productDisplay: ShoppingBag,
  changeViewAngle: Eye,
  backgroundReplace: Palette,
  wireframeMesh: Grid3x3,
  groupPhoto: Users,
  emoticons: Sparkles,
  lineToRender: Home,
  photoRestore: Camera,
  characterStory: BookOpen,
  multiImageFusion: Image,
  fashionEcommerce: ShoppingBag,
  interiorDesign: Home,
  productMockup: Package,
  naturalEdit: Edit,
  filmNoir: Film,
};

interface ToolSelectorProps {
  selectedTool: string;
  onSelectTool: (tool: string) => void;
}

export default function ToolSelector({ selectedTool, onSelectTool }: ToolSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Wand2 className="w-6 h-6" />
        选择工具
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(TOOL_PRESETS).map(([key, toolData]) => {
          const tool = toolData as Tool;
          const Icon = iconMap[key] || Sparkles;
          const isSelected = selectedTool === key;
          
          return (
            <button
              key={key}
              onClick={() => onSelectTool(isSelected ? '' : key)}
              className={`
                tool-card p-4 text-left transition-all
                ${isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-blue-500' : 'text-gray-600'}`} />
              <h3 className="font-semibold text-sm text-gray-800">
                {tool.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {tool.description}
              </p>
              {tool.requiresMultipleImages && (
                <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  需要多图
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}