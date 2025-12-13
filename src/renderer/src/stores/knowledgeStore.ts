import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Knowledge } from '../types';

/**
 * 知识点状态接口
 */
interface KnowledgeState {
  // 状态
  knowledgeList: Knowledge[];
  currentKnowledge: Knowledge | null;
  isLoading: boolean;
  error: string | null;
  
  // 操作方法
  loadKnowledgeList: () => Promise<void>;
  loadKnowledge: (id: string) => Promise<void>;
  createKnowledge: (data: Partial<Knowledge>) => Promise<void>;
  updateKnowledge: (id: string, data: Partial<Knowledge>) => Promise<void>;
  deleteKnowledge: (id: string) => Promise<void>;
  searchKnowledge: (keyword: string) => Promise<void>;
  clearError: () => void;
  clearCurrent: () => void;
}

/**
 * 知识点状态 Store
 * 管理知识点数据和业务逻辑
 */
export const useKnowledgeStore = create<KnowledgeState>()(
  devtools(
    (set) => ({
      // 初始状态
      knowledgeList: [],
      currentKnowledge: null,
      isLoading: false,
      error: null,
      
      // 加载所有知识点
      loadKnowledgeList: async () => {
        set({ isLoading: true, error: null }, false, 'knowledge/loadKnowledgeList/pending');
        
        try {
          const response = await window.api.knowledge.findAll();
          set({ 
            knowledgeList: response.data, 
            isLoading: false 
          }, false, 'knowledge/loadKnowledgeList/fulfilled');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '加载知识点列表失败';
          set({ 
            isLoading: false, 
            error: errorMessage 
          }, false, 'knowledge/loadKnowledgeList/rejected');
          console.error('Failed to load knowledge list:', error);
        }
      },
      
      // 加载单个知识点
      loadKnowledge: async (id: string) => {
        set({ isLoading: true, error: null }, false, 'knowledge/loadKnowledge/pending');
        
        try {
          const response = await window.api.knowledge.findById(id);
          set({ 
            currentKnowledge: response.data, 
            isLoading: false 
          }, false, 'knowledge/loadKnowledge/fulfilled');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '加载知识点失败';
          set({ 
            isLoading: false, 
            error: errorMessage 
          }, false, 'knowledge/loadKnowledge/rejected');
          console.error('Failed to load knowledge:', error);
        }
      },
      
      // 创建知识点
      createKnowledge: async (data: Partial<Knowledge>) => {
        set({ isLoading: true, error: null }, false, 'knowledge/createKnowledge/pending');
        
        try {
          const response = await window.api.knowledge.create(data);
          const newKnowledge = response.data;
          
          set((state) => ({ 
            knowledgeList: [...state.knowledgeList, newKnowledge],
            currentKnowledge: newKnowledge,
            isLoading: false 
          }), false, 'knowledge/createKnowledge/fulfilled');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '创建知识点失败';
          set({ 
            isLoading: false, 
            error: errorMessage 
          }, false, 'knowledge/createKnowledge/rejected');
          console.error('Failed to create knowledge:', error);
          throw error; // 重新抛出错误，让UI组件可以处理
        }
      },
      
      // 更新知识点
      updateKnowledge: async (id: string, data: Partial<Knowledge>) => {
        set({ isLoading: true, error: null }, false, 'knowledge/updateKnowledge/pending');
        
        try {
          const response = await window.api.knowledge.update(id, data);
          const updatedKnowledge = response.data;
          
          set((state) => ({ 
            knowledgeList: state.knowledgeList.map(k => 
              k.id === id ? updatedKnowledge : k
            ),
            currentKnowledge: state.currentKnowledge?.id === id 
              ? updatedKnowledge 
              : state.currentKnowledge,
            isLoading: false 
          }), false, 'knowledge/updateKnowledge/fulfilled');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '更新知识点失败';
          set({ 
            isLoading: false, 
            error: errorMessage 
          }, false, 'knowledge/updateKnowledge/rejected');
          console.error('Failed to update knowledge:', error);
          throw error;
        }
      },
      
      // 删除知识点
      deleteKnowledge: async (id: string) => {
        set({ isLoading: true, error: null }, false, 'knowledge/deleteKnowledge/pending');
        
        try {
          await window.api.knowledge.delete(id);
          
          set((state) => ({ 
            knowledgeList: state.knowledgeList.filter(k => k.id !== id),
            currentKnowledge: state.currentKnowledge?.id === id 
              ? null 
              : state.currentKnowledge,
            isLoading: false 
          }), false, 'knowledge/deleteKnowledge/fulfilled');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '删除知识点失败';
          set({ 
            isLoading: false, 
            error: errorMessage 
          }, false, 'knowledge/deleteKnowledge/rejected');
          console.error('Failed to delete knowledge:', error);
          throw error;
        }
      },
      
      // 搜索知识点
      searchKnowledge: async (keyword: string) => {
        set({ isLoading: true, error: null }, false, 'knowledge/searchKnowledge/pending');
        
        try {
          const response = await window.api.knowledge.search(keyword);
          set({ 
            knowledgeList: response.data, 
            isLoading: false 
          }, false, 'knowledge/searchKnowledge/fulfilled');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '搜索知识点失败';
          set({ 
            isLoading: false, 
            error: errorMessage 
          }, false, 'knowledge/searchKnowledge/rejected');
          console.error('Failed to search knowledge:', error);
        }
      },
      
      // 清除错误
      clearError: () => 
        set({ error: null }, false, 'knowledge/clearError'),
      
      // 清除当前知识点
      clearCurrent: () => 
        set({ currentKnowledge: null }, false, 'knowledge/clearCurrent'),
    }),
    {
      name: 'KnowledgeStore',
      enabled: import.meta.env.DEV,
    }
  )
);

