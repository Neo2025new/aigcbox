'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// 应用状态类型定义
interface AppState {
  selectedTool: ToolConfig | null;
  uploadedImages: File[];
  customPrompt: string;
  toolParameters: Record<string, string>;
  isGenerating: boolean;
  results: any;
  error: string;
  searchQuery: string;
  selectedCategory: string;
  activeTab: string;
  finalPrompt: string;
  editPrompt: string;
  isEditMode: boolean;
  lastGeneratedImage: string;
}

// 操作类型
type AppAction = 
  | { type: 'SET_SELECTED_TOOL'; payload: ToolConfig | null }
  | { type: 'SET_UPLOADED_IMAGES'; payload: File[] }
  | { type: 'SET_CUSTOM_PROMPT'; payload: string }
  | { type: 'SET_TOOL_PARAMETERS'; payload: Record<string, string> }
  | { type: 'SET_IS_GENERATING'; payload: boolean }
  | { type: 'SET_RESULTS'; payload: any }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_FINAL_PROMPT'; payload: string }
  | { type: 'SET_EDIT_PROMPT'; payload: string }
  | { type: 'SET_IS_EDIT_MODE'; payload: boolean }
  | { type: 'SET_LAST_GENERATED_IMAGE'; payload: string }
  | { type: 'RESET_STATE' };

// 初始状态
const initialState: AppState = {
  selectedTool: null,
  uploadedImages: [],
  customPrompt: '',
  toolParameters: {},
  isGenerating: false,
  results: null,
  error: '',
  searchQuery: '',
  selectedCategory: 'all',
  activeTab: 'tools',
  finalPrompt: '',
  editPrompt: '',
  isEditMode: false,
  lastGeneratedImage: '',
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SELECTED_TOOL':
      return { ...state, selectedTool: action.payload };
    case 'SET_UPLOADED_IMAGES':
      return { ...state, uploadedImages: action.payload };
    case 'SET_CUSTOM_PROMPT':
      return { ...state, customPrompt: action.payload };
    case 'SET_TOOL_PARAMETERS':
      return { ...state, toolParameters: action.payload };
    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_FINAL_PROMPT':
      return { ...state, finalPrompt: action.payload };
    case 'SET_EDIT_PROMPT':
      return { ...state, editPrompt: action.payload };
    case 'SET_IS_EDIT_MODE':
      return { ...state, isEditMode: action.payload };
    case 'SET_LAST_GENERATED_IMAGE':
      return { ...state, lastGeneratedImage: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Provider 组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

// 导入工具配置类型
import type { ToolConfig } from '@/lib/gemini';