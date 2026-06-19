import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productService } from '../services/product.service';
import { getErrorMessage } from '../services/api';

const PRODUCT_KEYS = {
  all: ['products'],
  list: (filters) => [...PRODUCT_KEYS.all, 'list', filters],
  detail: (id) => [...PRODUCT_KEYS.all, 'detail', id],
};

// ============================================
// QUERIES
// ============================================

export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: () => productService.getAll(filters),
    keepPreviousData: true, // Smooth pagination
  });
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
};

// ============================================
// MUTATIONS
// ============================================

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, imageFiles }) => productService.create(data, imageFiles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, imageFiles, imagesToDelete }) =>
      productService.update(id, data, imageFiles, imagesToDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDuplicateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => productService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success('Product duplicated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => productService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      toast.success('Product status updated');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};