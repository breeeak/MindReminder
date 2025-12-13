import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppView, Theme } from '../types';

/**
 * 应用级状态接口
 */
interface AppState {
  // 状态
  isLoading: boolean;
  currentView: AppView;
  theme: Theme;
  
  // 操作方法
  setLoading: (isLoading: boolean) => void;
  setCurrentView: (view: AppView) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * 应用级状态 Store
 * 管理全局 UI 状态（加载状态、当前视图、主题等）
 */
export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // 初始状态
      isLoading: false,
      currentView: 'calendar' as AppView,
      theme: 'light' as Theme,
      
      // 操作方法
      setLoading: (isLoading: boolean) => 
        set({ isLoading }, false, 'app/setLoading'),
      
      setCurrentView: (view: AppView) => 
        set({ currentView: view }, false, 'app/setCurrentView'),
      
      setTheme: (theme: Theme) => 
        set({ theme }, false, 'app/setTheme'),
      
      toggleTheme: () => 
        set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        }), false, 'app/toggleTheme'),
    }),
    {
      name: 'AppStore',
      enabled: import.meta.env.DEV, // 仅在开发环境启用 DevTools
    }
  )
);

