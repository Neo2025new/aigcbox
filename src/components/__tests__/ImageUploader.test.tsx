import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploader from '../ImageUploader';

describe('ImageUploader', () => {
  const mockOnImagesChange = jest.fn();

  beforeEach(() => {
    mockOnImagesChange.mockClear();
    // Mock URL.createObjectURL 和 revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('should render upload area', () => {
    render(
      <ImageUploader
        images={[]}
        onImagesChange={mockOnImagesChange}
        maxImages={4}
      />
    );

    expect(screen.getByText(/拖拽图片到这里/)).toBeInTheDocument();
    expect(screen.getByText(/支持 PNG, JPG, JPEG, GIF, WebP 格式/)).toBeInTheDocument();
  });

  it('should display image count', () => {
    render(
      <ImageUploader
        images={[]}
        onImagesChange={mockOnImagesChange}
        maxImages={4}
      />
    );

    expect(screen.getByText('(0/4)')).toBeInTheDocument();
  });

  it('should show uploaded images', () => {
    const mockFiles = [
      new File([''], 'image1.png', { type: 'image/png' }),
      new File([''], 'image2.jpg', { type: 'image/jpeg' })
    ];

    render(
      <ImageUploader
        images={mockFiles}
        onImagesChange={mockOnImagesChange}
        maxImages={4}
      />
    );

    expect(screen.getByAltText('上传的图片 1')).toBeInTheDocument();
    expect(screen.getByAltText('上传的图片 2')).toBeInTheDocument();
    expect(screen.getByText('(2/4)')).toBeInTheDocument();
  });

  it('should cleanup URLs on unmount', () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });

    const { unmount } = render(
      <ImageUploader
        images={[mockFile]}
        onImagesChange={mockOnImagesChange}
      />
    );

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('should disable upload when max images reached', () => {
    const mockFiles = [
      new File([''], 'image1.png', { type: 'image/png' }),
      new File([''], 'image2.jpg', { type: 'image/jpeg' })
    ];

    const { container } = render(
      <ImageUploader
        images={mockFiles}
        onImagesChange={mockOnImagesChange}
        maxImages={2}
      />
    );

    const uploadArea = container.querySelector('[class*="cursor-not-allowed"]');
    expect(uploadArea).toBeInTheDocument();
  });
});