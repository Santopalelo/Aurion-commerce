import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orderService } from '../services/order.service';
import { getErrorMessage } from '../services/api';

const ORDER_KEYS = {
  all: ['orders'],
  list: (filters) => [...ORDER_KEYS.all, 'list', filters],
  detail: (id) => [...ORDER_KEYS.all, 'detail', id],
  stats: (period) => [...ORDER_KEYS.all, 'stats', period],
};

// ============================================
// QUERIES
// ============================================

export const useOrders = (filters = {}) => {
  return useQuery({
    queryKey: ORDER_KEYS.list(filters),
    queryFn: () => orderService.getAll(filters),
    keepPreviousData: true,
  });
};

export const useOrder = (id) => {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => orderService.getById(id),
    enabled: !!id,
  });
};

export const useOrderStats = (period = '30d') => {
  return useQuery({
    queryKey: ORDER_KEYS.stats(period),
    queryFn: () => orderService.getStats(period),
  });
};

// ============================================
// MUTATIONS
// ============================================

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, note }) =>
      orderService.updateStatus(id, status, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.detail(variables.id),
      });
      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateFulfillment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => orderService.updateFulfillment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.detail(variables.id),
      });
      toast.success('Fulfillment updated');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useAddOrderNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }) => orderService.addNote(id, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.detail(variables.id),
      });
      toast.success('Note added');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason, restockItems }) =>
      orderService.cancel(id, reason, restockItems),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.detail(variables.id),
      });
      toast.success('Order cancelled');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};