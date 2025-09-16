'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  Loader2,
  Download,
  X,
  Search,
  Send,
  History,
  Layers,
  ChevronDown,
  Eye,
  Edit3,
  RefreshCw,
  Settings,
  Wand2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ALL_TOOLS, ToolConfig } from '@/lib/gemini';
import { cn } from '@/lib/utils';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  selected?: boolean;
}

interface HistoryItem {
  prompt: string;
  images: string[];
  timestamp: Date;
}

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<ToolConfig | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [toolParams, setToolParams] = useState<Record<string, string>>({});
  const [finalPrompt, setFinalPrompt] = useState('');
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editPrompt, setEditPrompt] = useState('');
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [todayGallery, setTodayGallery] = useState<GeneratedImage[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 获取分类
  const categories = ['all', ...Array.from(new Set(ALL_TOOLS.map(t => t.category)))];
  
  // 筛选工具
  const filteredTools = ALL_TOOLS.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 更新最终提示词
  useEffect(() => {
    if (selectedTool) {
      const prompt = selectedTool.promptTemplate(customPrompt, toolParams);
      setFinalPrompt(prompt);
    } else {
      setFinalPrompt(customPrompt);
    }
  }, [selectedTool, customPrompt, toolParams]);

  const onDrop = (acceptedFiles: File[]) => {
    const newImages = [...uploadedImages, ...acceptedFiles].slice(0, 4);
    setUploadedImages(newImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 4 - uploadedImages.length,
    disabled: uploadedImages.length >= 4
  });

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSelectTool = (tool: ToolConfig) => {
    setSelectedTool(tool);
    setError('');
    setToolParams({});
    setCustomPrompt(''); // 清空自定义提示词
    setUploadedImages([]); // 清空已上传的图片
    setFinalPrompt(''); // 清空最终提示词
  };

  const handleGenerate = async () => {
    if (!selectedTool && !customPrompt) {
      setError('请选择一个工具或输入提示词');
      return;
    }

    if (selectedTool?.requiresImage && uploadedImages.length === 0) {
      setError('此工具需要上传至少一张图片');
      return;
    }

    if (selectedTool?.requiresMultipleImages && uploadedImages.length < 2) {
      setError('此工具需要上传至少两张图片');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('prompt', finalPrompt);
      formData.append('numberOfImages', '1');
      
      uploadedImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }

      setResults(data);
      
      // 添加到历史记录
      const newHistoryItem: HistoryItem = {
        prompt: finalPrompt,
        images: data.images || [],
        timestamp: new Date()
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
      
      // 添加到今日创作库
      if (data.images && data.images.length > 0) {
        const newGalleryItems = data.images.map((img: string, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          url: img,
          prompt: finalPrompt,
          timestamp: new Date(),
          selected: false
        }));
        setTodayGallery(prev => [...newGalleryItems, ...prev]);
      }
      
    } catch (error) {
      console.error('生成失败:', error);
      setError(error instanceof Error ? error.message : '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;
    
    setIsGenerating(true);
    setError('');

    try {
      const formData = new FormData();
      
      // 基于已生成的图片进行变体创作
      if (editingImageIndex !== null && results?.images?.[editingImageIndex]) {
        const baseImageUrl = results.images[editingImageIndex];
        formData.append('prompt', `Based on this generated image, create a variation: ${editPrompt}`);
        formData.append('baseImageUrl', baseImageUrl);
        
        // 将生成的图片转换为 Blob 并添加到 formData
        const response = await fetch(baseImageUrl);
        const blob = await response.blob();
        formData.append('images', blob, 'generated-base.png');
      }
      
      formData.append('numberOfImages', '1');

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '编辑失败');
      }

      // 替换该图片
      if (editingImageIndex !== null && data.images && data.images.length > 0) {
        const newImages = [...(results?.images || [])];
        newImages[editingImageIndex] = data.images[0];
        setResults({
          ...results,
          images: newImages
        });
      }
      
      // 添加到今日创作库
      if (data.images && data.images.length > 0) {
        const newGalleryItems = data.images.map((img: string, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          url: img,
          prompt: editPrompt,
          timestamp: new Date(),
          selected: false
        }));
        setTodayGallery(prev => [...newGalleryItems, ...prev]);
      }
      
      setEditPrompt('');
      setEditingImageIndex(null);
    } catch (error) {
      console.error('编辑失败:', error);
      setError(error instanceof Error ? error.message : '编辑失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `gemini-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Simple gradient background */}
      <div className="gradient-bg" />
      
      {/* Main Container */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Ultra Modern Header */}
        <header className="glass-dark border-b border-gray-400/20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-teal-600 flex items-center justify-center shadow-lg shadow-gray-400/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">AIGCBox</h1>
            </div>
            
            {/* Gallery Button */}
            <button
              onClick={() => setShowGallery(!showGallery)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-gray-300 hover:text-gray-200 transition-all hover:scale-105"
            >
              <Layers className="w-4 h-4" />
              创作库
              {todayGallery.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-400/20 text-gray-200 rounded-full">
                  {todayGallery.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Tools */}
          <div className={cn(
            "glass-dark border-r border-gray-400/20 flex flex-col transition-all duration-300",
            sidebarCollapsed ? "w-16" : "w-96"
          )}>
            {/* Search Bar */}
            {!sidebarCollapsed && (
              <div className="p-4 border-b space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400/60" />
                  <input
                    placeholder="搜索工具..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-black/20 border border-gray-400/30 rounded-lg text-cyan-100 placeholder-gray-400/40 focus:outline-none focus:border-gray-300/50 transition-colors"
                  />
                </div>
                
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs transition-all",
                        selectedCategory === cat 
                          ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/30" 
                          : "glass text-gray-300 hover:text-gray-200 hover:bg-gray-400/10"
                      )}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'all' ? '全部' : cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tools Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => handleSelectTool(tool)}
                    className={cn(
                      "tool-card p-3 cursor-pointer glass rounded-lg border border-gray-400/20 hover:border-gray-300/50 transition-all",
                      selectedTool?.id === tool.id && "ring-2 ring-gray-300 bg-gray-400/10"
                    )}
                  >
                    {!sidebarCollapsed ? (
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-md",
                          tool.requiresImage 
                            ? "bg-gradient-to-br from-blue-500/20 to-gray-400/20" 
                            : "bg-gradient-to-br from-gray-500/20 to-green-500/20"
                        )}>
                          {tool.requiresImage ? (
                            <ImageIcon className="w-4 h-4 text-gray-300" />
                          ) : (
                            <Wand2 className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-cyan-100">{tool.name}</h4>
                          <p className="text-xs text-gray-300/60 line-clamp-2">{tool.description}</p>
                          {tool.requiresMultipleImages && (
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-gray-400/20 text-gray-200 rounded-full">
                              多图
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        {tool.requiresImage ? (
                          <ImageIcon className="w-4 h-4 text-gray-300" />
                        ) : (
                          <Wand2 className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Collapse Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 border-t hover:bg-accent transition-colors"
            >
              <ChevronDown className={cn(
                "w-5 h-5 mx-auto transition-transform",
                sidebarCollapsed ? "rotate-90" : "-rotate-90"
              )} />
            </button>
          </div>

          {/* Center - Configuration */}
          <div className="flex-1 flex flex-col bg-muted/30">
            <div className="flex-1 overflow-y-auto">
              <div id="config-section" className="p-8 max-w-2xl mx-auto space-y-6">
                {/* Upload Area */}
                <div className="glass-dark rounded-xl p-6 border border-gray-400/20">
                  <label className="flex items-center gap-2 mb-4 text-cyan-100 font-medium">
                    <Upload className="w-4 h-4 text-gray-300" />
                    上传图片（可选）
                  </label>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                      isDragActive 
                        ? "border-gray-300 bg-gray-300/5" 
                        : "border-gray-400/30 hover:border-gray-300/50 hover:bg-gray-400/5"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400/60" />
                    <p className="text-sm text-gray-200">
                      {isDragActive ? "放开以上传" : "拖拽或点击上传"}
                    </p>
                    <p className="text-xs text-gray-400/60 mt-1">
                      支持 JPG, PNG, GIF, WebP • 最多4张
                    </p>
                  </div>
                  
                  {/* Image Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`upload-${idx}`}
                            className="w-full aspect-square object-cover rounded-md"
                          />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tool Parameters */}
                {selectedTool && (
                  <div className="glass-dark rounded-xl p-6 border border-gray-400/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="w-4 h-4 text-gray-300" />
                      <span className="font-medium text-cyan-100">工具参数配置</span>
                    </div>
                    
                    {selectedTool.parameters ? (
                      <div className="space-y-4">
                        {Object.entries(selectedTool.parameters).map(([key, param]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-cyan-100 mb-1">
                              {param.label} {param.required && <span className="text-red-400">*</span>}
                            </label>
                            <input
                              placeholder={param.placeholder}
                              value={toolParams[key] || ''}
                              onChange={(e) => setToolParams({
                                ...toolParams,
                                [key]: e.target.value
                              })}
                              className="w-full px-3 py-2 bg-black/30 border border-gray-400/30 rounded-lg text-cyan-100 placeholder-gray-400/40 focus:outline-none focus:border-gray-300/50 transition-colors"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">此工具无需额外参数配置</p>
                    )}
                  </div>
                )}

                {/* Custom Prompt */}
                <div className="glass-dark rounded-xl p-6 border border-gray-400/20">
                  <label className="block mb-2 text-cyan-100 font-medium">自定义提示词（可选）</label>
                  <textarea
                    placeholder={selectedTool ? "添加额外的描述..." : "描述你想要生成的图像..."}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[100px] resize-none w-full px-3 py-2 bg-black/30 border border-gray-400/30 rounded-lg text-cyan-100 placeholder-gray-400/40 focus:outline-none focus:border-gray-300/50 transition-colors"
                  />
                </div>

                {/* Final Prompt Preview */}
                {(selectedTool || customPrompt) && (
                  <div className="glass-dark rounded-xl p-6 border border-gray-400/20">
                    <button
                      onClick={() => setShowPromptPreview(!showPromptPreview)}
                      className="flex items-center gap-2 text-sm font-medium mb-3 text-cyan-100"
                    >
                      <Eye className="w-4 h-4 text-gray-300" />
                      最终提示词预览
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        showPromptPreview ? "rotate-180" : ""
                      )} />
                    </button>
                    
                    {showPromptPreview && (
                      <div className="p-3 rounded-md bg-black/30 border border-gray-400/20">
                        <p className="text-sm break-words text-gray-200">
                          {finalPrompt || "请输入提示词或选择工具..."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-gray-400/30 disabled:opacity-50 disabled:scale-100 disabled:hover:shadow-none"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="inline-block w-4 h-4 mr-2" />
                      开始生成
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* History */}
                <div className="glass-dark rounded-xl p-6 border border-gray-400/20">
                  <h3 className="font-medium mb-4 flex items-center gap-2 text-cyan-100">
                    <History className="w-4 h-4 text-gray-300" />
                    历史记录
                  </h3>
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-400/60">暂无历史记录</p>
                  ) : (
                    <div className="space-y-2">
                      {history.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setCustomPrompt(item.prompt)}
                          className="p-3 rounded-md bg-black/20 cursor-pointer hover:bg-gray-400/10 transition-colors"
                        >
                          <p className="text-sm line-clamp-2 text-gray-200">{item.prompt}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400/60">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                            {item.images.length > 0 && (
                              <span className="px-2 py-0.5 text-xs bg-gray-400/20 text-gray-200 rounded-full">
                                {item.images.length} 图
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right - Results */}
          <div className="flex-1 flex flex-col bg-black/10">
            <div className="flex-1 overflow-y-auto p-6" ref={resultsRef}>
              {!results ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400/30" />
                    <p className="text-gray-400/60">等待生成...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.images && results.images.map((image: string, idx: number) => (
                    <div key={idx} className="glass-dark rounded-xl overflow-hidden border border-gray-400/20 flex flex-col max-h-[calc(100vh-200px)]">
                      {/* Image Display */}
                      <div className="p-4 bg-black/30 flex-shrink overflow-hidden">
                        <img
                          src={image}
                          alt={`Generated ${idx + 1}`}
                          className="w-full rounded-md object-contain max-h-[60vh]"
                        />
                      </div>
                      
                      {/* Action Bar */}
                      <div className="p-4 border-t border-gray-400/20">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            {/* Edit Button */}
                            <button
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                editingImageIndex === idx 
                                  ? "bg-gray-400 text-white" 
                                  : "glass text-gray-300 hover:text-gray-200 hover:bg-gray-400/10"
                              )}
                              onClick={() => {
                                setEditingImageIndex(editingImageIndex === idx ? null : idx);
                                setEditPrompt('');
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            
                            {/* Regenerate Button */}
                            <button
                              className="p-2 rounded-lg glass text-gray-300 hover:text-gray-200 hover:bg-gray-400/10 disabled:opacity-50 transition-all"
                              onClick={async () => {
                                setIsGenerating(true);
                                try {
                                  const formData = new FormData();
                                  formData.append('prompt', finalPrompt);
                                  formData.append('numberOfImages', '1');
                                  uploadedImages.forEach((image) => {
                                    formData.append('images', image);
                                  });
                                  
                                  const response = await fetch('/api/generate', {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  
                                  const data = await response.json();
                                  if (response.ok && data.images && data.images.length > 0) {
                                    const newImages = [...(results?.images || [])];
                                    newImages[idx] = data.images[0];
                                    setResults({
                                      ...results,
                                      images: newImages
                                    });
                                  }
                                } catch (error) {
                                  console.error('重新生成失败:', error);
                                } finally {
                                  setIsGenerating(false);
                                }
                              }}
                              disabled={isGenerating}
                            >
                              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                            </button>
                          </div>
                          
                          {/* Download Button */}
                          <button
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-gray-400/30"
                            onClick={() => downloadImage(image)}
                          >
                            <Download className="w-4 h-4" />
                            下载
                          </button>
                        </div>
                        
                        {/* Edit Input */}
                        {editingImageIndex === idx && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex gap-2">
                              <input
                                placeholder="描述你想要的变化..."
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                                autoFocus
                                className="flex-1 px-3 py-2 bg-black/30 border border-gray-400/30 rounded-lg text-cyan-100 placeholder-gray-400/40 focus:outline-none focus:border-gray-300/50 transition-colors"
                              />
                              <button
                                className="px-3 py-2 rounded-lg bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-gray-400/30 disabled:opacity-50 disabled:scale-100 disabled:hover:shadow-none"
                                onClick={handleEdit}
                                disabled={!editPrompt.trim() || isGenerating}
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-400/60 mt-2">
                              基于此图片创建变体
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowGallery(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-6xl max-h-[80vh] overflow-y-auto glass-dark rounded-xl p-8 border border-gray-400/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">今日创作库</h2>
              
              {todayGallery.length === 0 ? (
                <p className="text-gray-400/60 text-center py-12">暂无创作</p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {todayGallery.map((img) => (
                    <div
                      key={img.id}
                      className="relative group cursor-pointer rounded-md overflow-hidden"
                    >
                      <img
                        src={img.url}
                        alt={img.prompt}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="absolute bottom-2 right-2 p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all"
                          onClick={() => downloadImage(img.url)}
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}