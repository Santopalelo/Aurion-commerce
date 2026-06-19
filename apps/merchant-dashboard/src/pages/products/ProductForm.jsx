import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Save, Loader2, AlertCircle, Eye, EyeOff,
  Package, DollarSign, Truck, Search, Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ImageUploader from '../../components/shared/ImageUploader';
import TagInput from '../../components/shared/TagInput';
import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { formatPrice } from '../../utils/formatCurrency';

// ============================================
// VALIDATION
// ============================================
const productSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  compareAtPrice: z.coerce.number().min(0).optional().or(z.literal('')),
  costPerItem: z.coerce.number().min(0).optional().or(z.literal('')),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  inventoryQuantity: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  category: z.string().optional(),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  taxable: z.boolean().default(true),
  isPhysical: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  status: z.enum(['active', 'draft', 'archived']).default('draft'),
  weight: z.object({
    value: z.coerce.number().min(0).optional().or(z.literal('')),
    unit: z.enum(['kg', 'g', 'lb', 'oz']).default('kg'),
  }).optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});

// ============================================
// SECTION CARD
// ============================================
const Section = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-start gap-3 mb-5 pb-5 border-b border-gray-100">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
      )}
      <div>
        <h3 className="font-semibold text-dark">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// ============================================
// MAIN FORM
// ============================================
const ProductForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  // State for images
  const [newImages, setNewImages] = useState([]); // Files to upload
  const [imagesToDelete, setImagesToDelete] = useState([]); // PublicIds to delete
  const [tags, setTags] = useState([]);

  // Queries
  const { data: existingProduct, isLoading: isLoadingProduct } = useProduct(id);
  const { data: categoriesData } = useCategories({ limit: 100 });
  const categories = categoriesData?.data || [];

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Form
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      shortDescription: '',
      price: 0,
      compareAtPrice: '',
      costPerItem: '',
      sku: '',
      barcode: '',
      inventoryQuantity: 0,
      lowStockThreshold: 5,
      vendor: '',
      productType: '',
      category: '',
      trackInventory: true,
      allowBackorder: false,
      taxable: true,
      isPhysical: true,
      isFeatured: false,
      status: 'draft',
      weight: { value: '', unit: 'kg' },
      seoTitle: '',
      seoDescription: '',
    },
  });

  // Watch for sale preview
  const price = watch('price');
  const compareAtPrice = watch('compareAtPrice');
  const costPerItem = watch('costPerItem');
  const isOnSale = compareAtPrice && Number(compareAtPrice) > Number(price);
  const discountPercent = isOnSale
    ? Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100)
    : 0;
  const profit = price && costPerItem ? (Number(price) - Number(costPerItem)).toFixed(2) : null;
  const margin = price && costPerItem && Number(price) > 0
    ? (((Number(price) - Number(costPerItem)) / Number(price)) * 100).toFixed(1)
    : null;

  // ============================================
  // POPULATE FORM ON EDIT
  // ============================================
  useEffect(() => {
    if (existingProduct) {
      reset({
        title: existingProduct.title || '',
        description: existingProduct.description || '',
        shortDescription: existingProduct.shortDescription || '',
        price: existingProduct.price || 0,
        compareAtPrice: existingProduct.compareAtPrice || '',
        costPerItem: existingProduct.costPerItem || '',
        sku: existingProduct.sku || '',
        barcode: existingProduct.barcode || '',
        inventoryQuantity: existingProduct.inventoryQuantity || 0,
        lowStockThreshold: existingProduct.lowStockThreshold || 5,
        vendor: existingProduct.vendor || '',
        productType: existingProduct.productType || '',
        category: existingProduct.category?._id || existingProduct.category || '',
        trackInventory: existingProduct.trackInventory ?? true,
        allowBackorder: existingProduct.allowBackorder ?? false,
        taxable: existingProduct.taxable ?? true,
        isPhysical: existingProduct.isPhysical ?? true,
        isFeatured: existingProduct.isFeatured ?? false,
        status: existingProduct.status || 'draft',
        weight: existingProduct.weight || { value: '', unit: 'kg' },
        seoTitle: existingProduct.seo?.metaTitle || '',
        seoDescription: existingProduct.seo?.metaDescription || '',
      });

      setTags(existingProduct.tags || []);
    }
  }, [existingProduct, reset]);

  // ============================================
  // EXISTING IMAGES (filter out deleted)
  // ============================================
  const visibleExistingImages = (existingProduct?.images || []).filter(
    (img) => !imagesToDelete.includes(img.publicId)
  );

  // ============================================
  // SUBMIT
  // ============================================
  const onSubmit = async (formData) => {
    try {
      // Build clean data
      const submitData = {
        title: formData.title,
        description: formData.description || '',
        shortDescription: formData.shortDescription || '',
        price: formData.price,
        sku: formData.sku || '',
        barcode: formData.barcode || '',
        inventoryQuantity: formData.inventoryQuantity,
        lowStockThreshold: formData.lowStockThreshold,
        vendor: formData.vendor || '',
        productType: formData.productType || '',
        trackInventory: formData.trackInventory,
        allowBackorder: formData.allowBackorder,
        taxable: formData.taxable,
        isPhysical: formData.isPhysical,
        isFeatured: formData.isFeatured,
        status: formData.status,
        tags,
      };

      // Optional fields
      if (formData.compareAtPrice) submitData.compareAtPrice = Number(formData.compareAtPrice);
      if (formData.costPerItem) submitData.costPerItem = Number(formData.costPerItem);
      if (formData.category) submitData.category = formData.category;

      // Weight
      if (formData.weight?.value) {
        submitData.weight = {
          value: Number(formData.weight.value),
          unit: formData.weight.unit || 'kg',
        };
      }

      // SEO
      if (formData.seoTitle || formData.seoDescription) {
        submitData.seo = {
          metaTitle: formData.seoTitle || '',
          metaDescription: formData.seoDescription || '',
        };
      }

      if (isEdit) {
        await updateMutation.mutateAsync({
          id,
          data: submitData,
          imageFiles: newImages,
          imagesToDelete,
        });
      } else {
        await createMutation.mutateAsync({
          data: submitData,
          imageFiles: newImages,
        });
      }

      navigate('/products');
    } catch (error) {
      // Toast handled by hook
    }
  };

  // ============================================
  // RENDER
  // ============================================
  if (isEdit && isLoadingProduct) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 sticky top-0 z-20 bg-gray-soft py-3 -mt-6 -mx-6 px-6 border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-dark truncate">
              {isEdit ? existingProduct?.title || 'Edit product' : 'New product'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit ? 'Make changes to your product' : 'Add a new product to your store'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => navigate('/products')} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            <Save className="w-4 h-4" />
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (main content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Section icon={Package} title="Basic information" description="The essential details about your product">
            <Input
              label="Product title"
              placeholder="e.g. Classic White Sneaker"
              error={errors.title?.message}
              {...register('title')}
            />

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Short description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="A brief tagline shown in product cards..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                {...register('shortDescription')}
              />
              {errors.shortDescription && (
                <p className="text-xs text-danger mt-1">{errors.shortDescription.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Full description
              </label>
              <textarea
                rows={6}
                placeholder="Describe your product in detail..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                {...register('description')}
              />
            </div>
          </Section>

          {/* Media */}
          <Section icon={Package} title="Media" description="Upload up to 10 images. First image is the main one.">
            <ImageUploader
              existingImages={visibleExistingImages}
              newImages={newImages}
              onNewImagesChange={setNewImages}
              onExistingDelete={(publicId) =>
                setImagesToDelete([...imagesToDelete, publicId])
              }
              maxImages={10}
              maxSizeMB={5}
            />
          </Section>

          {/* Pricing */}
          <Section icon={DollarSign} title="Pricing" description="Set the product price and optional compare price">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Price"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.price?.message}
                {...register('price')}
              />
              <Input
                label="Compare at price"
                type="number"
                step="0.01"
                placeholder="0.00"
                helpText="Original price (for sale)"
                error={errors.compareAtPrice?.message}
                {...register('compareAtPrice')}
              />
              <Input
                label="Cost per item"
                type="number"
                step="0.01"
                placeholder="0.00"
                helpText="For profit calculation"
                error={errors.costPerItem?.message}
                {...register('costPerItem')}
              />
            </div>

            {/* Sale + Profit preview */}
            {(isOnSale || profit) && (
              <div className="bg-gray-50 rounded-lg p-3 flex flex-wrap gap-4 text-sm">
                {isOnSale && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Sale:</span>
                    <span className="font-semibold text-danger">
                      -{discountPercent}% off
                    </span>
                  </div>
                )}
                {profit && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Profit:</span>
                    <span className="font-semibold text-success">
                      {formatPrice(profit)}
                      {margin && ` (${margin}%)`}
                    </span>
                  </div>
                )}
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('taxable')}
              />
              <span className="text-sm text-gray-700">Charge tax on this product</span>
            </label>
          </Section>

          {/* Inventory */}
          <Section icon={Package} title="Inventory" description="Track stock and manage availability">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="SKU (Stock Keeping Unit)"
                placeholder="e.g. CWS-001"
                {...register('sku')}
              />
              <Input
                label="Barcode (ISBN, UPC, etc.)"
                placeholder="e.g. 123456789"
                {...register('barcode')}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('trackInventory')}
              />
              <span className="text-sm text-gray-700">Track inventory quantity</span>
            </label>

            {watch('trackInventory') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Quantity in stock"
                  type="number"
                  min="0"
                  {...register('inventoryQuantity')}
                />
                <Input
                  label="Low stock threshold"
                  type="number"
                  min="0"
                  helpText="Alert when stock drops below this"
                  {...register('lowStockThreshold')}
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('allowBackorder')}
              />
              <span className="text-sm text-gray-700">Allow customers to order when out of stock</span>
            </label>
          </Section>

          {/* Shipping */}
          <Section icon={Truck} title="Shipping" description="Physical product details">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('isPhysical')}
              />
              <span className="text-sm text-gray-700">This is a physical product</span>
            </label>

            {watch('isPhysical') && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="col-span-2">
                  <Input
                    label="Weight"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('weight.value')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Unit</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    {...register('weight.unit')}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                  </select>
                </div>
              </div>
            )}
          </Section>

          {/* SEO */}
          <Section icon={Search} title="Search engine optimization" description="How this product appears in search results">
            <Input
              label="Meta title"
              placeholder="Leave empty to use product title"
              helpText="60 characters recommended"
              {...register('seoTitle')}
            />

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Meta description
              </label>
              <textarea
                rows={2}
                placeholder="A short summary for search engines..."
                maxLength={160}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                {...register('seoDescription')}
              />
              <p className="text-xs text-gray-500 mt-1">160 characters recommended</p>
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN (sidebar) */}
        <div className="space-y-6">
          {/* Status */}
          <Section icon={Settings} title="Status">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Product status
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                {...register('status')}
              >
                <option value="draft">Draft (not visible)</option>
                <option value="active">Active (visible)</option>
                <option value="archived">Archived</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Drafts are saved but not shown on storefront
              </p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5"
                {...register('isFeatured')}
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Featured product</span>
                <p className="text-xs text-gray-500">Highlight on the storefront</p>
              </div>
            </label>
          </Section>

          {/* Organization */}
          <Section title="Organization">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Category
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                {...register('category')}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Vendor"
              placeholder="e.g. Aurion Brand"
              {...register('vendor')}
            />

            <Input
              label="Product type"
              placeholder="e.g. T-Shirt, Sneaker"
              {...register('productType')}
            />

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Tags
              </label>
              <TagInput
                tags={tags}
                onChange={setTags}
                placeholder="Type and press Enter"
              />
              <p className="text-xs text-gray-500 mt-1">
                Help customers find this product
              </p>
            </div>
          </Section>

          {/* Save reminder */}
          {isDirty && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                You have unsaved changes
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProductForm;