
import React, { useState, useEffect } from 'react';
import { categorizeItem } from '../services/geminiService';
import { GroceryItem, CategoryType } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';

interface AddBarProps {
  onAdd: (item: GroceryItem) => void;
  onUpdate: (id: string, updates: Partial<GroceryItem>) => void;
  userName: string;
  items: GroceryItem[];
}

export const AddBar: React.FC<AddBarProps> = ({ onAdd, onUpdate, userName, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when name changes
  useEffect(() => {
    if (error) setError(null);
  }, [name]);

  const resetForm = () => {
    setName('');
    setQty('');
    setUnit('');
    setNotes('');
    setError(null);
    setIsSubmitting(false);
    setIsOpen(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const itemText = name.trim();
    if (!itemText || isSubmitting) return;

    // Duplicate check (case-insensitive, only check active items)
    const exists = items.some(
      (item) => !item.isBought && item.name.toLowerCase() === itemText.toLowerCase()
    );

    if (exists) {
      setError('This item is already in your list');
      return;
    }

    setIsSubmitting(true);
    const qtyValue = qty.trim() || '1';
    const qtyUnit = unit || undefined;
    const itemNotes = notes.trim() || undefined;
    const tempId = Math.random().toString(36).substr(2, 9);

    const optimisticItem: GroceryItem & { isOptimistic?: boolean } = {
      id: tempId,
      name: itemText,
      qtyValue,
      qtyUnit,
      notes: itemNotes,
      category: 'Other',
      icon: '⏳',
      isBought: false,
      addedBy: userName,
      createdAt: Date.now(),
    };

    onAdd(optimisticItem);
    resetForm();

    try {
      const { category, icon } = await categorizeItem(itemText);
      onUpdate(tempId, {
        category: category as CategoryType,
        icon: icon
      });
    } catch (error) {
      onUpdate(tempId, { icon: '🛒' });
    }
  };

  const unitOptions = [
    { value: '', label: 'Unit' },
    { value: 'pcs', label: 'pcs' },
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'L', label: 'L' },
    { value: 'ml', label: 'ml' },
    { value: 'pack', label: 'pack' },
    { value: 'box', label: 'box' },
  ];

  return (
    <>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none px-8">
        <Button
          onClick={() => setIsOpen(true)}
          className="float-right pointer-events-auto w-16 h-16 rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.4)] z-40 group p-0"
          aria-label="Add new item"
        >
          <svg
            className="w-8 h-8 transition-transform group-hover:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={resetForm}
        title="Add New Item"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            autoFocus
            label="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Organic Milk"
            error={error || undefined}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="1"
            />
            <Select
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              options={unitOptions}
            />
          </div>

          <Textarea
            label="Notes (Optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Extra instructions..."
          />

          <div className="flex space-x-3 pt-6 mt-2 flex-none border-t border-slate-50">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              isLoading={isSubmitting}
              className="flex-1"
            >
              {error ? 'Duplicate' : 'Add to List'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
