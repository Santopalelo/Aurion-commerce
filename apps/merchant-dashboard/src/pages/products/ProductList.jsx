import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Package, Search, Edit2, Trash2, Copy, MoreVertical,
  Eye, EyeOff, Archive, Loader2, ImageIcon, AlertCircle,
  CheckCircle2, Clock, ShoppingBag,
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import {
  useProducts,
  useDeleteProduct,
  useDuplicateProduct,
  useUpdateProductStatus,
} from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { formatPrice } from '../../utils/formatCurrency';

// ============================================
// STATUS BADGE
// ============================================
const StatusBadge = ({ status }) => {
  const config = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700', icon: Clock },
    archived: { label: 'Archived', className: 'bg-orange-100 text-orange-700', icon: Archive },
  };

  const { label, className, icon: Icon } = config[status] || config.draft;

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// ============================================
// STATS CARD
// ============================================
const StatCard = ({ label, value, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-dark">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

// ============================================
// PRODUCT CARD
// ============================================
const ProductCard = ({ product, onEdit, onDelete, onDuplicate, onStatusToggle }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const isOutOfStock = product.trackInventory && product.inventoryQuantity <= 0;
  const isLowStock =
    product.trackInventory &&
    product.inventoryQuantity > 0 &&
    product.inventoryQuantity <= (product.lowStockThreshold || 5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
      {/* Image */}
      <div
        className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer"
        onClick={() => onEdit(product)}
      >
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Badges on image */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && (
            <span className="px-2 py-0.5 bg-secondary text-white text-xs font-medium rounded-full">
              Featured
            </span>
          )}
          {product.compareAtPrice > product.price && (
            <span className="px-2 py-0.5 bg-danger text-white text-xs font-medium rounded-full">
              -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Status on image */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={product.status} />
        </div>

        {/* Stock warnings */}
        {isOutOfStock && (
          <div className="absolute bottom-2 left-2 right-2 bg-red-500/90 text-white text-xs font-medium px-2 py-1 rounded text-center backdrop-blur-sm">
            Out of stock
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="absolute bottom-2 left-2 right-2 bg-yellow-500/90 text-white text-xs font-medium px-2 py-1 rounded text-center backdrop-blur-sm">
            Low stock ({product.inventoryQuantity} left)
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="font-semibold text-dark truncate flex-1 cursor-pointer hover:text-primary-600"
            onClick={() => onEdit(product)}
          >
            {product.title}
          </h3>

          {/* Action menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50 animate-slide-up">
                  <button
                    onClick={() => {
                      onEdit(product);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate(product);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onStatusToggle(product);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {product.status === 'active' ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Publish
                      </>
                    )}
                  </button>
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        onDelete(product);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {product.sku && (
          <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-dark">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Inventory */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {product.trackInventory ? (
              <>{product.inventoryQuantity} in stock</>
            ) : (
              'Inventory not tracked'
            )}
          </span>
          {product.category && (
            <span className="text-primary-600 font-medium truncate ml-2">
              {product.category.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================
const ProductList = () => {
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  // Build filters
  const filters = {
    page,
    limit: 12,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  };

  // Queries
  const { data, isLoading, isFetching } = useProducts(filters);
  const deleteMutation = useDeleteProduct();
  const duplicateMutation = useDuplicateProduct();
  const statusMutation = useUpdateProductStatus();

  // Modals
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const products = data?.data || [];
  const meta = data?.meta || {};
  const stats = meta?.stats || { total: 0, active: 0, draft: 0, archived: 0, outOfStock: 0 };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm._id);
      setDeleteConfirm(null);
    } catch (error) {
      // Handled by hook
    }
  };

  const handleDuplicate = async (product) => {
    try {
      const duplicated = await duplicateMutation.mutateAsync(product._id);
      // Navigate to edit page for the new product (Step 2 will add this)
      // navigate(`/products/${duplicated._id}/edit`);
    } catch (error) {
      // Handled by hook
    }
  };

  const handleStatusToggle = async (product) => {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    try {
      await statusMutation.mutateAsync({ id: product._id, status: newStatus });
    } catch (error) {
      // Handled by hook
    }
  };

  const handleEdit = (product) => {
    navigate(`/products/${product._id}/edit`);
  };

  const handleCreate = () => {
    navigate('/products/new');
  };

  // Status filter tabs
  const tabs = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'active', label: 'Active', count: stats.active },
    { value: 'draft', label: 'Drafts', count: stats.draft },
    { value: 'archived', label: 'Archived', count: stats.archived },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your store's products and inventory
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Add product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total products" value={stats.total} icon={Package} color="primary" />
        <StatCard label="Active" value={stats.active} icon={CheckCircle2} color="success" />
        <StatCard label="Drafts" value={stats.draft} icon={Clock} color="gray" />
        <StatCard label="Out of stock" value={stats.outOfStock} icon={AlertCircle} color="danger" />
      </div>

      {/* Filters */}
      <div className="card !p-4 space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 -mx-4 px-4 -mt-4 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={clsx(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                statusFilter === tab.value
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-dark'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={clsx(
                    'ml-2 px-2 py-0.5 rounded-full text-xs font-semibold',
                    statusFilter === tab.value
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, SKU, or vendor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
          {isFetching && search && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="card flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={debouncedSearch ? Search : ShoppingBag}
            title={
              debouncedSearch
                ? 'No products found'
                : statusFilter !== 'all'
                ? `No ${statusFilter} products`
                : 'No products yet'
            }
            description={
              debouncedSearch
                ? `No products match "${debouncedSearch}". Try a different search.`
                : statusFilter !== 'all'
                ? `You don't have any ${statusFilter} products at the moment.`
                : 'Start building your catalog. Add your first product to begin selling.'
            }
            action={
              !debouncedSearch &&
              statusFilter === 'all' && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4" />
                  Add your first product
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          {/* Count */}
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-dark">{products.length}</span> of{' '}
            <span className="font-semibold text-dark">{meta.total}</span> products
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={handleEdit}
                onDelete={setDeleteConfirm}
                onDuplicate={handleDuplicate}
                onStatusToggle={handleStatusToggle}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Page <span className="font-semibold">{meta.page}</span> of{' '}
                <span className="font-semibold">{meta.totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete product?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Delete product
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{deleteConfirm?.title}</span>?
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This will permanently delete the product and all its images. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default ProductList;