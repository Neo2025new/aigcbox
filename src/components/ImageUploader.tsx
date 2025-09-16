'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ 
  images, 
  onImagesChange, 
  maxImages = 1 
}: ImageUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = [...images, ...acceptedFiles].slice(0, maxImages);
    onImagesChange(newImages);
  }, [images, maxImages, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: maxImages - images.length,
    disabled: images.length >= maxImages
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <ImageIcon className="w-6 h-6" />
        上传图片
        <span className="text-sm font-normal text-gray-500">
          ({images.length}/{maxImages})
        </span>
      </h2>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">释放以上传图片...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium mb-2">
              拖拽图片到这里，或点击选择
            </p>
            <p className="text-sm text-gray-500">
              支持 PNG, JPG, JPEG, GIF, WebP 格式
            </p>
          </>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(image)}
                alt={`上传的图片 ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                图片 {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}