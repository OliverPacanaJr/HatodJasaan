'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { FileUpload } from '@/components/ui/file-upload';
import { formatCurrency, cn } from '@/lib/utils';
import type { Business, MenuCategory, MenuItem } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BookOpenIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

export default function MenuManagement() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', category_id: '', is_featured: false, is_available: true });
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [itemLoading, setItemLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'item'; id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', profile.id).single();
    if (!biz) { setLoading(false); return; }
    setBusiness(biz);

    const [catsRes, itemsRes] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('business_id', biz.id).order('sort_order'),
      supabase.from('menu_items').select('*').eq('business_id', biz.id).order('sort_order'),
    ]);
    setCategories(catsRes.data || []);
    setItems(itemsRes.data || []);
    if ((catsRes.data || []).length > 0 && !activeCategory) {
      setActiveCategory(catsRes.data![0].id);
    }
    setLoading(false);
  }, [profile, supabase, activeCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveCategory = async () => {
    if (!business || !catName.trim()) return;
    setCatLoading(true);
    if (editingCategory) {
      const { error } = await supabase.from('menu_categories').update({ name: catName, description: catDesc || null }).eq('id', editingCategory.id);
      if (error) { toast.error('Failed to update category'); setCatLoading(false); return; }
      toast.success('Category updated');
    } else {
      const { error } = await supabase.from('menu_categories').insert({ business_id: business.id, name: catName, description: catDesc || null, sort_order: categories.length });
      if (error) { toast.error('Failed to create category'); setCatLoading(false); return; }
      toast.success('Category created');
    }
    setCatLoading(false);
    setCatModalOpen(false);
    setCatName(''); setCatDesc(''); setEditingCategory(null);
    fetchData();
  };

  const openEditCategory = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatModalOpen(true);
  };

  const saveItem = async () => {
    if (!business || !itemForm.name.trim() || !itemForm.price) return;
    setItemLoading(true);

    let image_url = editingItem?.image_url || null;
    if (itemImage) {
      const ext = itemImage.name.split('.').pop();
      const path = `${business.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('menu').upload(path, itemImage);
      if (upErr) { toast.error('Image upload failed'); setItemLoading(false); return; }
      const { data: urlData } = supabase.storage.from('menu').getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const payload = {
      business_id: business.id,
      name: itemForm.name,
      description: itemForm.description || null,
      price: parseFloat(itemForm.price),
      category_id: itemForm.category_id || null,
      is_featured: itemForm.is_featured,
      is_available: itemForm.is_available,
      image_url,
    };

    if (editingItem) {
      const { error } = await supabase.from('menu_items').update(payload).eq('id', editingItem.id);
      if (error) { toast.error('Failed to update item'); setItemLoading(false); return; }
      toast.success('Item updated');
    } else {
      const { error } = await supabase.from('menu_items').insert({ ...payload, sort_order: items.length });
      if (error) { toast.error('Failed to create item'); setItemLoading(false); return; }
      toast.success('Item added');
    }
    setItemLoading(false);
    setItemModalOpen(false);
    resetItemForm();
    fetchData();
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({ name: '', description: '', price: '', category_id: '', is_featured: false, is_available: true });
    setItemImage(null);
    setItemImagePreview(null);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category_id: item.category_id || '',
      is_featured: item.is_featured,
      is_available: item.is_available,
    });
    setItemImagePreview(item.image_url);
    setItemModalOpen(true);
  };

  const toggleAvailability = async (item: MenuItem) => {
    const { error } = await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    if (error) { toast.error('Failed to update'); return; }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === 'category' ? 'menu_categories' : 'menu_items';
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success(`${deleteTarget.type === 'category' ? 'Category' : 'Item'} deleted`);
    setDeleteTarget(null);
    fetchData();
  };

  const filteredItems = activeCategory ? items.filter(i => i.category_id === activeCategory) : items;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2"><Skeleton className="h-10 w-24 rounded-full" /><Skeleton className="h-10 w-24 rounded-full" /><Skeleton className="h-10 w-24 rounded-full" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i=><Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
      </div>
    );
  }

  if (!business) {
    return <EmptyState icon={<BookOpenIcon className="h-16 w-16" />} title="No business found" description="Register a business first to manage menus." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menu Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your menu categories and items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setCatName(''); setCatDesc(''); setEditingCategory(null); setCatModalOpen(true); }}>
            <TagIcon className="h-4 w-4" /> Add Category
          </Button>
          <Button size="sm" onClick={() => { resetItemForm(); setItemModalOpen(true); }}>
            <PlusIcon className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setActiveCategory(null)} className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors', !activeCategory ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>All</button>
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-1">
              <button onClick={() => setActiveCategory(cat.id)} className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors', activeCategory === cat.id ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{cat.name}</button>
              <button onClick={() => openEditCategory(cat)} className="p-1 text-slate-400 hover:text-slate-600"><PencilIcon className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })} className="p-1 text-slate-400 hover:text-red-500"><TrashIcon className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <EmptyState title="No menu items" description="Add your first menu item to get started." action={<Button size="sm" onClick={() => { resetItemForm(); setItemModalOpen(true); }}><PlusIcon className="h-4 w-4" /> Add Item</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} padding="none" className="overflow-hidden">
              {item.image_url ? (
                <div className="relative h-40 bg-slate-100">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  {item.is_featured && <Badge variant="warning" className="absolute top-2 left-2">Featured</Badge>}
                </div>
              ) : (
                <div className="h-40 bg-slate-100 flex items-center justify-center">
                  <BookOpenIcon className="h-12 w-12 text-slate-300" />
                  {item.is_featured && <Badge variant="warning" className="absolute top-2 left-2">Featured</Badge>}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    {item.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>}
                  </div>
                  <span className="text-lg font-bold text-brand-600">{formatCurrency(Number(item.price))}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => toggleAvailability(item)} className={cn('flex items-center gap-1.5 text-xs font-medium', item.is_available ? 'text-green-600' : 'text-slate-400')}>
                    {item.is_available ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => openEditItem(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><PencilIcon className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Category Modal */}
      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <Input label="Category Name" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Rice Meals" />
          <Textarea label="Description (optional)" value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Short description" />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory} loading={catLoading}>{editingCategory ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* Item Modal */}
      <Modal open={itemModalOpen} onClose={() => { setItemModalOpen(false); resetItemForm(); }} title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Item Name" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chicken Adobo" />
            <Input label="Price (PHP)" type="number" min="0" step="0.01" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
          </div>
          <Textarea label="Description (optional)" value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe this item" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Category</label>
              <select className="input-field" value={itemForm.category_id} onChange={e => setItemForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-3 justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={itemForm.is_available} onChange={e => setItemForm(f => ({ ...f, is_available: e.target.checked }))} className="rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                <span className="text-sm text-slate-700">Available for order</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={itemForm.is_featured} onChange={e => setItemForm(f => ({ ...f, is_featured: e.target.checked }))} className="rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                <span className="text-sm text-slate-700">Featured item</span>
              </label>
            </div>
          </div>
          <FileUpload
            label="Item Image"
            preview={itemImagePreview}
            onFileSelect={file => { setItemImage(file); setItemImagePreview(URL.createObjectURL(file)); }}
            onClear={() => { setItemImage(null); setItemImagePreview(null); }}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => { setItemModalOpen(false); resetItemForm(); }}>Cancel</Button>
            <Button onClick={saveItem} loading={itemLoading}>{editingItem ? 'Update' : 'Add Item'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
