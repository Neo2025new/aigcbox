'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateImageFile } from '@/lib/validation';

interface EnhancedImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

export default function EnhancedImageUploader({
  images,
  onImagesChange,
  maxFiles = 4,
  maxSize = 4 * 1024 * 1024, // 4MB
}: EnhancedImageUploaderProps) {
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');
    
    // 处理拒绝的文件
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => {
        const error = rejection.errors[0];
        if (error.code === 'file-too-large') {
          return `文件 "${rejection.file.name}" 太大 (${(rejection.file.size / 1024 / 1024).toFixed(2)}MB)`;
        }
        if (error.code === 'file-invalid-type') {
          return `文件 "${rejection.file.name}" 类型不支持`;
        }
        return error.message;
      });
      setError(errors.join(', '));
      return;
    }

    // 验证每个文件
    const validFiles: File[] = [];
    for (const file of acceptedFiles) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || '文件验证失败');
        return;
      }
      validFiles.push(file);
    }

    // 检查总数量
    const newImages = [...images, ...validFiles];
    if (newImages.length > maxFiles) {
      setError(`最多只能上传${maxFiles}张图片`);
      return;
    }

    onImagesChange(newImages);
  }, [images, onImagesChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize,
    maxFiles: maxFiles - images.length,
    disabled: images.length >= maxFiles,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setError('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${images.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          <Upload className="w-12 h-12 text-gray-400 mb-3" />
          
          {isDragActive ? (
            <p className="text-blue-600">放开以上传图片...</p>
          ) : (
            <>
              <p className="text-gray-600 mb-1">
                拖拽图片到这里，或点击选择
              </p>
              <p className="text-sm text-gray-500">
                支持 JPG, PNG, GIF, WebP • 最大 {maxSize / (1024 * 1024)}MB
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {images.length}/{maxFiles} 张图片
              </p>
            </>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">已上传图片：</p>
          <div className="grid grid-cols-2 gap-3">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group border rounded-lg overflow-hidden bg-gray-50"
              >
                <div className="aspect-video relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
                </div>
                
                {/* 图片信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{image.name}</span>
                    <span>{formatFileSize(image.size)}</span>
                  </div>
                </div>
                
                {/* 删除按钮 */}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
        <ImageIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">图片上传提示：</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>上传图片可用于编辑或作为参考</li>
            <li>支持多张图片同时处理</li>
            <li>建议使用清晰、高质量的图片</li>
            <li>图片会被自动优化以提高处理速度</li>
          </ul>
        </div>
      </div>
    </div>
  );
}