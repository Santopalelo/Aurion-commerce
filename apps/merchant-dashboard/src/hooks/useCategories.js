import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { categoryService } from '../services/category.service';
import { getErrorMessage } from '../services/api';

/**
 * React Query hooks for categories
 * Handles caching, loading states, and cache invalidation
 */

const CATEGORY_KEYS = {
  all: ['categories'],
  list: (filters) => [...CATEGORY_KEYS.all, 'list', filters],
  detail: (id) => [...CATEGORY_KEYS.all, 'detail', id],
};

// ============================================
// QUERY: Get all categories
// ============================================
export const useCategories = (filters = {}) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.list(filters),
    queryFn: () => categoryService.getAll(filters),
  });
};

// ============================================
// QUERY: Get single category
// ============================================
export const useCategory = (id) => {
  return useQuery({
    queryKey: CATEGORY_KEYS.detail(id),
    queryFn: () => categoryService.getById(id),
    enabled: !!id,
  });
};

// ============================================
// MUTATION: Create category
// ============================================
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, imageFile }) =>
      categoryService.create(data, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// ============================================
// MUTATION: Update category
// ============================================
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, imageFile }) =>
      categoryService.update(id, data, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// ============================================
// MUTATION: Delete category
// ============================================
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};