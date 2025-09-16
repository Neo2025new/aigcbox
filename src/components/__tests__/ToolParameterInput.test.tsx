import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ToolParameterInput from '../ToolParameterInput';
import { ToolConfig } from '@/lib/gemini';

describe('ToolParameterInput', () => {
  const mockOnParametersChange = jest.fn();

  const mockTool: ToolConfig = {
    id: 'test-tool',
    name: '测试工具',
    description: '这是一个测试工具',
    category: 'test',
    caseNumber: '1',
    requiresImage: false,
    promptTemplate: (custom, params) => `测试: ${custom} ${params?.param1 || ''}`,
    parameters: {
      param1: {
        label: '参数1',
        placeholder: '请输入参数1',
        required: false
      },
      param2: {
        label: '参数2',
        placeholder: '请输入参数2',
        required: false
      }
    }
  };

  beforeEach(() => {
    mockOnParametersChange.mockClear();
  });

  it('should display tool information when tool is selected', () => {
    render(
      <ToolParameterInput
        tool={mockTool}
        onParametersChange={mockOnParametersChange}
      />
    );

    expect(screen.getByText('测试工具')).toBeInTheDocument();
    expect(screen.getByText('这是一个测试工具')).toBeInTheDocument();
  });

  it('should show placeholder when no tool is selected', () => {
    render(
      <ToolParameterInput
        tool={null}
        onParametersChange={mockOnParametersChange}
      />
    );

    expect(screen.getByText(/请先选择一个工具/)).toBeInTheDocument();
  });

  it('should render parameter inputs', () => {
    render(
      <ToolParameterInput
        tool={mockTool}
        onParametersChange={mockOnParametersChange}
      />
    );

    expect(screen.getByLabelText('参数1')).toBeInTheDocument();
    expect(screen.getByLabelText('参数2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入参数1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入参数2')).toBeInTheDocument();
  });

  it('should call onParametersChange when input changes', () => {
    render(
      <ToolParameterInput
        tool={mockTool}
        onParametersChange={mockOnParametersChange}
      />
    );

    const input1 = screen.getByPlaceholderText('请输入参数1');
    fireEvent.change(input1, { target: { value: '测试值' } });

    expect(mockOnParametersChange).toHaveBeenCalledWith({
      param1: '测试值'
    });
  });

  it('should reset parameters when tool changes', () => {
    const { rerender } = render(
      <ToolParameterInput
        tool={mockTool}
        onParametersChange={mockOnParametersChange}
      />
    );

    const newTool = { ...mockTool, id: 'new-tool' };

    rerender(
      <ToolParameterInput
        tool={newTool}
        onParametersChange={mockOnParametersChange}
      />
    );

    expect(mockOnParametersChange).toHaveBeenCalledWith({});
  });
});