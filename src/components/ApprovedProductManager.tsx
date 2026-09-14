import React, { useState } from 'react';
import { ApprovedProduct, ApprovedProductFields } from '../types';
import {
  getApprovedProducts,
  saveApprovedProduct,
  deleteApprovedProduct
} from '../services/productStorage';
import { Plus, Edit2, Trash2, Camera, Check, X, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';
import { CreateProfileByScanModal } from './CreateProfileByScanModal';

interface ApprovedProductManagerProps {
  onSelectProduct: (product: ApprovedProduct) => void;
}

const EMPTY_FIELDS: ApprovedProductFields = {
  product_name: '',
  net_quantity: '',
  mrp: '',
  manufacturer: '',
  consumer_care: '',
  country_of_origin: 'India',
  date_info: 'Valid Month and Year',
  unit_sale_price: ''
};

export const ApprovedProductManager: React.FC<ApprovedProductManagerProps> = ({
  onSelectProduct
}) => {
  const [products, setProducts] = useState<ApprovedProduct[]>(getApprovedProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Packaged Commodity');
  const [formFields, setFormFields] = useState<ApprovedProductFields>(EMPTY_FIELDS);

  const refreshList = () => {
    setProducts(getApprovedProducts());
  };

  const handleOpenCreate = () => {
    setEditingProductId(null);
    setProductName('');
    setCategory('Packaged Commodity');
    setFormFields(EMPTY_FIELDS);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: ApprovedProduct) => {
    setEditingProductId(product.id);
    setProductName(product.name);
    setCategory(product.category || 'Packaged Commodity');
    setFormFields({ ...EMPTY_FIELDS, ...product.fields });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this approved product reference?')) {
      deleteApprovedProduct(id);
      refreshList();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const updatedProduct: ApprovedProduct = {
      id: editingProductId || `prod-${Date.now().toString(36)}`,
      name: productName.trim(),
      category: category.trim() || 'Packaged Commodity',
      createdAt: new Date().toISOString(),
      fields: formFields
    };

    saveApprovedProduct(updatedProduct);
    refreshList();
    setIsModalOpen(false);
  };

  const handleProfileCreatedFromScan = (newProduct: ApprovedProduct) => {
    refreshList();
    onSelectProduct(newProduct);
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            Approved Product Profiles
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Scan a product once to create a reference profile. Then inspect subsequent items against that parent image and specifications.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scan Product to Create Profile</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Profile</span>
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {product.category && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        {product.category}
                      </span>
                    )}
                    {product.referenceImageUrl && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                        Parent Reference
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(product)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                    title="Edit product reference"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(product.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                    title="Delete reference"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Key Expected Values */}
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-slate-500 font-medium">Net Qty:</span>
                  <span className="font-mono font-semibold text-slate-900 text-right">
                    {product.fields.net_quantity || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-slate-500 font-medium">MRP:</span>
                  <span className="font-mono font-semibold text-emerald-800 text-right">
                    {product.fields.mrp || 'Not specified'}
                  </span>
                </div>
                {product.fields.unit_sale_price && (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-slate-500 font-medium">Unit Price:</span>
                    <span className="font-mono text-slate-800 text-right text-[11px]">
                      {product.fields.unit_sale_price}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-slate-500 font-medium">Manufacturer:</span>
                  <span className="text-slate-800 text-right truncate max-w-[170px] text-[11px]">
                    {product.fields.manufacturer || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-slate-500 font-medium">Origin:</span>
                  <span className="text-slate-800 text-right text-[11px]">
                    {product.fields.country_of_origin || 'India'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Action: Inspect Now */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                Added {new Date(product.createdAt).toLocaleDateString()}
              </span>

              <button
                type="button"
                onClick={() => onSelectProduct(product)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Inspection</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create or Edit Product Reference */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-800" />
                <h3 className="text-base font-bold text-slate-950">
                  {editingProductId ? 'Edit Approved Product' : 'Create Approved Product Reference'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Reference Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Masala 500g"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product / Generic Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABC Masala"
                    value={formFields.product_name || ''}
                    onChange={(e) =>
                      setFormFields({ ...formFields, product_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Net Quantity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500 g or 1 L"
                    value={formFields.net_quantity || ''}
                    onChange={(e) =>
                      setFormFields({ ...formFields, net_quantity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Maximum Retail Price (MRP)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹120.00"
                    value={formFields.mrp || ''}
                    onChange={(e) => setFormFields({ ...formFields, mrp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit Sale Price (USP)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹0.24 / g"
                    value={formFields.unit_sale_price || ''}
                    onChange={(e) =>
                      setFormFields({ ...formFields, unit_sale_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Manufacturer / Packer Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC Foods Pvt. Ltd., Industrial Area"
                  value={formFields.manufacturer || ''}
                  onChange={(e) =>
                    setFormFields({ ...formFields, manufacturer: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Consumer Care Phone/Email
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1800-123-456"
                    value={formFields.consumer_care || ''}
                    onChange={(e) =>
                      setFormFields({ ...formFields, consumer_care: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={formFields.country_of_origin || ''}
                    onChange={(e) =>
                      setFormFields({ ...formFields, country_of_origin: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-md font-semibold hover:bg-slate-800"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Profile by Scanning */}
      <CreateProfileByScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onProfileCreated={handleProfileCreatedFromScan}
      />
    </div>
  );
};
