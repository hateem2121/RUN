import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@shared/schema';

/**
 * Consolidated Category Operations Hook
 * Combines data operations, UI state, and basic interactions in a single hook
 * Replaces the complex multi-hook architecture for simplified usage
 */
export default function useCategoryOperationsConsolidated() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Unified UI State
  const [uiState, setUIState] = useState({
    searchTerm: '',
    filterStatus: 'all' as 'all' | 'active' | 'inactive',
    viewMode: 'list' as 'list' | 'grid' | 'tree',
    selectedCategories: {} as Record<number, boolean>,
    expandedCategories: {} as Record<number, boolean>,
    showAdvancedMode: false,
    showDeletedCategories: false,
    // Dialog states
    showCreateDialog: false,
    showEditDialog: false,
    showDeleteDialog: false,
    showRestoreDialog: false,
    showHardDeleteDialog: false,
    editingCategory: null as Category | null,
    deletingCategory: null as Category | null,
    restoringCategory: null as Category | null,
    hardDeletingCategory: null as Category | null,
  });

  // Data queries with enhanced debugging
  const categoriesQuery = useQuery({
    queryKey: ['/api/categories'],
    staleTime: 0, // FORCE FRESH DATA FOR DEBUGGING
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: 'always',
    select: (data) => {
      const categories = data as Category[] | undefined;
      console.log('📋 [QUERY SELECT] Categories data processed:', categories?.length || 0, 'items');
      return data;
    }
  });

  const productsQuery = useQuery({
    queryKey: ['/api/products'],
  });

  const deletedCategoriesQuery = useQuery({
    queryKey: ['/api/categories/deleted'],
    enabled: uiState.showDeletedCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Computed values
  const categories = (categoriesQuery.data as Category[]) || [];
  const products = ((productsQuery.data as any)?.data || []) as any[];
  
  const filteredCategories = (categories as Category[]).filter((category: Category) => {
    // Search filter
    if (uiState.searchTerm && !category.name.toLowerCase().includes(uiState.searchTerm.toLowerCase())) {
      return false;
    }
    // Status filter
    if (uiState.filterStatus === 'active' && !category.isActive) return false;
    if (uiState.filterStatus === 'inactive' && category.isActive) return false;
    return true;
  });

  const selectedCount = Object.values(uiState.selectedCategories).filter(Boolean).length;

  // UI state updates
  const updateUIState = useCallback((updates: Partial<typeof uiState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper functions
  const getProductCount = useCallback((categoryId: number) => {
    return products.filter((product: any) => product.categoryId === categoryId).length;
  }, [products]);

  const clearSelection = useCallback(() => {
    updateUIState({ selectedCategories: {} });
  }, [updateUIState]);

  const selectAll = useCallback(() => {
    const allSelected = filteredCategories.reduce((acc: any, cat: Category) => ({
      ...acc,
      [cat.id]: true
    }), {});
    updateUIState({ selectedCategories: allSelected });
  }, [filteredCategories, updateUIState]);

  const toggleSelection = useCallback((id: number) => {
    updateUIState({
      selectedCategories: {
        ...uiState.selectedCategories,
        [id]: !uiState.selectedCategories[id]
      }
    });
  }, [uiState.selectedCategories, updateUIState]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('🚀 [CREATE] Submitting category creation:', data);
      return apiRequest('/api/categories', { method: 'POST', body: JSON.stringify(data) });
    },
    onMutate: async (newCategory) => {
      console.log('🔄 [OPTIMISTIC] Starting optimistic update...');
      
      // Cancel outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['/api/categories'] });
      
      // Snapshot previous value for rollback
      const previousCategories = queryClient.getQueryData(['/api/categories']);
      
      // Optimistically update with temporary category
      queryClient.setQueryData(['/api/categories'], (old: any[] = []) => [
        ...old, 
        { 
          ...newCategory, 
          id: Date.now(), // Temporary ID 
          __optimistic: true,
          createdAt: new Date().toISOString(),
          isActive: true
        }
      ]);
      
      console.log('✅ [OPTIMISTIC] Added temporary category to UI');
      return { previousCategories };
    },
    onError: (error: any, _newCategory, context) => {
      console.error('❌ [CREATE ERROR] Category creation failed:', error);
      
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(['/api/categories'], context.previousCategories);
        console.log('🔄 [OPTIMISTIC] Rolled back optimistic update');
      }
      
      // Show user-friendly error message
      const errorMessage = error?.error?.message || error?.message || 'Failed to create category';
      const errorDetails = error?.error?.details || '';
      
      toast({
        title: 'Creation Failed',
        description: errorDetails.includes('already exists') || errorDetails.includes('duplicate')
          ? `A category with this slug already exists. Please use a different name or slug.`
          : errorDetails || errorMessage,
        variant: 'destructive',
      });
    },
    onSuccess: async (result) => {
      console.log('🎯 [CREATE SUCCESS] Category created successfully:', result);
      
      // Replace optimistic update with real server data
      queryClient.setQueryData(['/api/categories'], (old: any[] = []) => {
        const filtered = old.filter(c => !c.__optimistic);
        return [...filtered, result];
      });
      
      console.log('✅ [OPTIMISTIC] Replaced temporary with real category');
      
      toast({
        title: 'Category Created',
        description: 'Your new category has been created successfully.',
      });
    },
    onSettled: async () => {
      console.log('🔄 [CACHE] Final invalidation and refetch...');
      
      try {
        // Get current cache state
        const beforeCache = queryClient.getQueryData(['/api/categories']) as Category[] | undefined;
        console.log('📋 [CACHE] Before invalidation, categories count:', beforeCache?.length || 0);
        
        // Ensure cache is fresh regardless of success/error
        await queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
        console.log('🔄 [CACHE] invalidateQueries completed');
        
        await queryClient.refetchQueries({ queryKey: ['/api/categories'], type: 'active' });
        console.log('🔄 [CACHE] refetchQueries completed');
        
        // Check cache state after refetch
        const afterCache = queryClient.getQueryData(['/api/categories']) as Category[] | undefined;
        console.log('📋 [CACHE] After refetch, categories count:', afterCache?.length || 0);
        console.log('📋 [CACHE] New categories data:', afterCache?.slice(-2)); // Show last 2 items
        
        // Wait for refetch to complete before closing dialog
        const currentQuery = queryClient.getQueryState(['/api/categories']);
        if (currentQuery && 'fetchStatus' in currentQuery && currentQuery.fetchStatus === 'fetching') {
          console.log('⏳ [CACHE] Waiting for refetch to complete...');
          await queryClient.getQueryData(['/api/categories']);
        }
        
        console.log('✅ [CACHE] Final cache refresh completed');
        
        // Only close dialog after everything is done
        updateUIState({ showCreateDialog: false, editingCategory: null });
        
      } catch (error) {
        console.error('❌ [CACHE] Cache invalidation failed:', error);
        // Still close dialog even if cache fails
        updateUIState({ showCreateDialog: false, editingCategory: null });
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      // Force refetch by invalidating and refetching immediately
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/categories'] });
      updateUIState({ showEditDialog: false, editingCategory: null });
      
      toast({
        title: 'Category Updated',
        description: 'Category has been updated successfully.',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.error?.message || error?.message || 'Failed to update category';
      const errorDetails = error?.error?.details || '';
      
      toast({
        title: 'Update Failed',
        description: errorDetails || errorMessage,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Force refetch by invalidating and refetching immediately
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      
      toast({
        title: 'Category Deleted',
        description: 'Category has been deleted successfully.',
      });
      queryClient.refetchQueries({ queryKey: ['/api/categories'] });
      updateUIState({ showDeleteDialog: false, deletingCategory: null });
      clearSelection();
    },
    onError: (error: any) => {
      const errorMessage = error?.error?.message || error?.message || 'Failed to delete category';
      const errorDetails = error?.error?.details || '';
      
      toast({
        title: 'Delete Failed',
        description: errorDetails || errorMessage,
        variant: 'destructive',
      });
    },
  });

  const bulkActivateMutation = useMutation({
    mutationFn: (ids: number[]) => Promise.all(
      ids.map(id => apiRequest(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: true }) }))
    ),
    onSuccess: () => {
      // Force refetch by invalidating and refetching immediately
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/categories'] });
      clearSelection();
    },
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: (ids: number[]) => Promise.all(
      ids.map(id => apiRequest(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: false }) }))
    ),
    onSuccess: () => {
      // Force refetch by invalidating and refetching immediately
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/categories'] });
      clearSelection();
    },
  });

  // Reorder categories mutation for drag-and-drop
  const reorderMutation = useMutation({
    mutationFn: (reorderData: Array<{id: number, sortOrder: number, parentId?: number | null}>) => {
      console.log('Reorder mutation called with:', reorderData);
      return apiRequest('/api/categories/reorder', { method: 'PATCH', body: JSON.stringify({ categories: reorderData }) });
    },
    onSuccess: (result) => {
      console.log('Reorder successful:', result);
      // Invalidate both admin and public caches for immediate updates
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error) => {
      console.error('Failed to reorder categories:', error);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/categories/${id}/restore`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories/deleted'] });
      queryClient.refetchQueries({ queryKey: ['/api/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/categories/deleted'] });
      
      toast({
        title: 'Category Restored',
        description: 'Category has been restored successfully.',
      });
      updateUIState({ showRestoreDialog: false, restoringCategory: null });
      clearSelection();
    },
    onError: (error: any) => {
      const errorMessage = error?.error?.message || error?.message || 'Failed to restore category';
      
      toast({
        title: 'Restore Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/categories/${id}/hard-delete`, { method: 'DELETE' }),
    onSuccess: () => {
      // Invalidate both active and deleted category caches
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories/deleted'] });
      queryClient.refetchQueries({ queryKey: ['/api/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/categories/deleted'] });
      
      toast({
        title: 'Category Permanently Deleted',
        description: 'Category has been permanently removed.',
      });
      updateUIState({ showHardDeleteDialog: false, hardDeletingCategory: null });
      clearSelection();
    },
    onError: (error: any) => {
      const errorMessage = error?.error?.message || error?.message || 'Failed to permanently delete category';
      
      toast({
        title: 'Delete Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Action handlers
  const openCreateDialog = useCallback(() => {
    updateUIState({ showCreateDialog: true, editingCategory: null });
  }, [updateUIState]);

  const openEditDialog = useCallback((category: Category) => {
    updateUIState({ showEditDialog: true, editingCategory: category });
  }, [updateUIState]);

  const openDeleteDialog = useCallback((category: Category) => {
    updateUIState({ showDeleteDialog: true, deletingCategory: category });
  }, [updateUIState]);

  const openRestoreDialog = useCallback((category: Category) => {
    updateUIState({ showRestoreDialog: true, restoringCategory: category });
  }, [updateUIState]);

  const openHardDeleteDialog = useCallback((category: Category) => {
    updateUIState({ showHardDeleteDialog: true, hardDeletingCategory: category });
  }, [updateUIState]);

  const closeDialogs = useCallback(() => {
    updateUIState({
      showCreateDialog: false,
      showEditDialog: false,
      showDeleteDialog: false,
      showRestoreDialog: false,
      showHardDeleteDialog: false,
      editingCategory: null,
      deletingCategory: null,
      restoringCategory: null,
      hardDeletingCategory: null,
    });
  }, [updateUIState]);

  const handleBulkAction = useCallback(async (action: 'activate' | 'deactivate' | 'delete') => {
    const selectedIds = Object.keys(uiState.selectedCategories)
      .filter(id => uiState.selectedCategories[Number(id)])
      .map(Number);
    
    if (selectedIds.length === 0) return;
    
    switch (action) {
      case 'activate':
        bulkActivateMutation.mutate(selectedIds);
        break;
      case 'deactivate':
        bulkDeactivateMutation.mutate(selectedIds);
        break;
      case 'delete':
        if (confirm(`Delete ${selectedIds.length} categories? This cannot be undone.`)) {
          for (const id of selectedIds) {
            deleteMutation.mutate(id);
          }
        }
        break;
    }
  }, [uiState.selectedCategories, bulkActivateMutation, bulkDeactivateMutation, deleteMutation]);

  // Retry handler for deleted categories query
  const retryDeletedCategories = useCallback(() => {
    deletedCategoriesQuery.refetch();
  }, [deletedCategoriesQuery]);

  return {
    // Data
    categories,
    filteredCategories,
    deletedCategories: (deletedCategoriesQuery.data as Category[]) || [],
    isLoading: categoriesQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    isLoadingDeleted: deletedCategoriesQuery.isLoading,
    error: categoriesQuery.error,
    deletedCategoriesError: deletedCategoriesQuery.error,
    retryDeletedCategories,
    
    // UI State
    uiState,
    updateUIState,
    selectedCount,
    
    // Helper functions
    getProductCount,
    
    // Selection
    toggleSelection,
    clearSelection,
    selectAll,
    
    // Dialog actions
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openRestoreDialog,
    openHardDeleteDialog,
    closeDialogs,
    
    // CRUD operations
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    restoreCategory: restoreMutation.mutateAsync,
    hardDeleteCategory: hardDeleteMutation.mutateAsync,
    reorderCategories: reorderMutation.mutate,
    handleBulkAction,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isHardDeleting: hardDeleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}