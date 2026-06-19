import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, FolderTree, Edit2, Trash2, Search, Loader2,
  Image as ImageIcon, X, Eye, EyeOff, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/useCategories';

// ============================================
// VALIDATION SCHEMA
// ============================================
const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  parent: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

// ============================================
// CATEGORY FORM (in modal)
// ============================================
const CategoryForm = ({ onClose, editingCategory, categories }) => {
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(
    editingCategory?.image?.url || null
  );
  const [imageFile, setImageFile] = useState(null);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: editingCategory?.name || '',
      description: editingCategory?.description || '',
      parent: editingCategory?.parent?._id || editingCategory?.parent || '',
      isActive: editingCategory?.isActive ?? true,
      isFeatured: editingCategory?.isFeatured ?? false,
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Available parents (excluding self and children when editing)
  const availableParents = categories.filter(
    (c) => !editingCategory || c._id !== editingCategory._id
  );

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5 MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data) => {
    try {
      // Convert empty parent to null
      const submitData = {
        ...data,
        parent: data.parent || null,
      };

      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory._id,
          data: submitData,
          imageFile,
        });
      } else {
        await createMutation.mutateAsync({
          data: submitData,
          imageFile,
        });
      }

      onClose();
    } catch (error) {
      // Toast handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-dark mb-2">
          Category Image
        </label>

        {imagePreview ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-primary-400 cursor-pointer flex flex-col items-center justify-center transition-colors"
          >
            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Click to upload image</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Name */}
      <Input
        label="Category name"
        placeholder="e.g. Sneakers"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-dark mb-1.5">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Describe this category..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-danger mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Parent Category */}
      <div>
        <label className="block text-sm font-medium text-dark mb-1.5">
          Parent category <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <select
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
          {...register('parent')}
        >
          <option value="">None (top-level category)</option>
          {availableParents.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.path ? cat.path.replace(/-/g, ' ') : cat.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Choose a parent to create a subcategory
        </p>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            {...register('isActive')}
          />
          <div>
            <p className="text-sm font-medium text-dark">Active</p>
            <p className="text-xs text-gray-500">Show on storefront</p>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            {...register('isFeatured')}
          />
          <div>
            <p className="text-sm font-medium text-dark">Featured</p>
            <p className="text-xs text-gray-500">Highlight category</p>
          </div>
        </label>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {editingCategory ? 'Update category' : 'Create category'}
        </Button>
      </div>
    </form>
  );
};

// ============================================
// MAIN PAGE
// ============================================
const CategoryList = () => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data, isLoading } = useCategories({ search });
  const deleteMutation = useDeleteCategory();

  const categories = data?.data || [];
  const totalCount = data?.meta?.total || 0;

  const openCreate = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm._id);
      setDeleteConfirm(null);
    } catch (error) {
      // Toast handled by hook
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Categories</h1>
          <p className="text-gray-600 mt-1">
            Organize your products into categories
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New category
        </Button>
      </div>

      {/* Search Bar */}
      <div className="card !p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="card flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderTree}
            title={search ? 'No categories found' : 'No categories yet'}
            description={
              search
                ? `No categories match "${search}". Try a different search.`
                : 'Categories help you organize products. Create your first one to get started.'
            }
            action={
              !search && (
                <Button onClick={openCreate}>
                  <Plus className="w-4 h-4" />
                  Create your first category
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          {/* Count */}
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-dark">{categories.length}</span> of{' '}
            <span className="font-semibold text-dark">{totalCount}</span> categories
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Image */}
                <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                  {category.image?.url ? (
                    <img
                      src={category.image.url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderTree className="w-12 h-12 text-gray-300" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {category.isFeatured && (
                      <span className="px-2 py-0.5 bg-secondary text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Featured
                      </span>
                    )}
                  </div>

                  {!category.isActive && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-900/70 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      Inactive
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-dark truncate">
                    {category.name}
                  </h3>
                  {category.parent && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Under: {category.parent.name}
                    </p>
                  )}
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => openEdit(category)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(category)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-danger hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCategory ? 'Edit category' : 'Create new category'}
        description={
          editingCategory
            ? 'Update category details and settings'
            : 'Add a new category to organize your products'
        }
        size="md"
      >
        <CategoryForm
          onClose={closeModal}
          editingCategory={editingCategory}
          categories={categories}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete category?"
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
              Delete category
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{deleteConfirm?.name}</span>?
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This action cannot be undone. The category image will also be deleted.
        </p>
      </Modal>
    </div>
  );
};

export default CategoryList;