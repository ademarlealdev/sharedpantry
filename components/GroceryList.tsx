
import React, { useState, useMemo } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { GroceryItem, CategoryType } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { Card } from './ui/Card';
import { PantryLogo } from './ui/Logo';

interface ListProps {
  items: GroceryItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<GroceryItem>) => void;
  onClearBought: () => void;
}

const UNITS = [
  { value: '', label: 'Unit' },
  { value: 'pcs', label: 'pcs' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'L', label: 'L' },
  { value: 'ml', label: 'ml' },
  { value: 'pack', label: 'pack' },
  { value: 'box', label: 'box' },
];

export const GroceryList: React.FC<ListProps> = ({ items, onToggle, onRemove, onUpdate, onClearBought }) => {
  const { dataLoading, state } = useSyncStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);

  const activeItems = useMemo(() => items.filter(i => !i.isBought), [items]);
  const boughtItems = useMemo(() => items.filter(i => i.isBought), [items]);

  const categories: CategoryType[] = [
    'Produce', 'Dairy', 'Bakery', 'Meat & Seafood', 'Frozen', 'Pantry', 'Household', 'Beverages', 'Snacks', 'Other'
  ];

  const filteredActive = useMemo(() =>
    selectedCategory === 'All'
      ? activeItems
      : activeItems.filter(i => i.category === selectedCategory),
    [activeItems, selectedCategory]);

  // Scroll logic
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const navRef = React.useRef<HTMLDivElement>(null);
  const [isNavDragging, setIsNavDragging] = useState(false);
  const [navStartX, setNavStartX] = useState(0);
  const [navScrollLeft, setNavScrollLeft] = useState(0);

  const handleNavMouseDown = (e: React.MouseEvent) => {
    setIsNavDragging(true);
    setNavStartX(e.pageX - (navRef.current?.offsetLeft || 0));
    setNavScrollLeft(navRef.current?.scrollLeft || 0);
  };

  const handleNavMouseMove = (e: React.MouseEvent) => {
    if (!isNavDragging) return;
    e.preventDefault();
    const x = e.pageX - (navRef.current?.offsetLeft || 0);
    const walk = (x - navStartX) * 1.5; // multiplier for scroll speed
    if (navRef.current) navRef.current.scrollLeft = navScrollLeft - walk;
  };

  const stopNavDragging = () => setIsNavDragging(false);

  const prevItemsLength = React.useRef(items.length);
  const prevPantryId = React.useRef(state.activePantryId);

  React.useEffect(() => {
    // If pantry switched, scroll to top
    if (state.activePantryId !== prevPantryId.current) {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      prevPantryId.current = state.activePantryId;
      prevItemsLength.current = items.length;
      return;
    }

    // Only scroll to bottom if EXACTLY one item was added (manual add)
    // Avoid scrolling to bottom on initial fetch (large jump in length)
    if (items.length === prevItemsLength.current + 1) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    } else if (items.length !== prevItemsLength.current) {
      // If items changed but not by exactly 1 (e.g. initial load), 
      // or if items were removed, just stay at current or top
      if (prevItemsLength.current === 0 && items.length > 0) {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }
    }
    prevItemsLength.current = items.length;
  }, [items.length, state.activePantryId]);

  const handleUpdate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingItem) {
      onUpdate(editingItem.id, {
        qtyValue: editingItem.qtyValue,
        qtyUnit: editingItem.qtyUnit,
        notes: editingItem.notes
      });
      setEditingItem(null);
    }
  };

  const handleRemove = () => {
    if (editingItem) {
      onRemove(editingItem.id);
      setEditingItem(null);
    }
  };

  const isEmpty = items.length === 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden relative">
      <nav className="w-full border-b border-slate-50 flex-none bg-white z-20">
        <div
          ref={navRef}
          onMouseDown={handleNavMouseDown}
          onMouseMove={handleNavMouseMove}
          onMouseUp={stopNavDragging}
          onMouseLeave={stopNavDragging}
          className={`w-full overflow-x-auto touch-pan-x pb-2 hide-scrollbar transition-all ${isNavDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        >
          <div className="inline-flex px-6 py-4 gap-2 min-w-full">
            <CategoryPill
              id="cat-All"
              label="All"
              count={activeItems.length}
              isActive={selectedCategory === 'All'}
              onClick={() => {
                setSelectedCategory('All');
                document.getElementById('cat-All')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
            />
            {categories.map(cat => {
              const count = activeItems.filter(i => i.category === cat).length;
              return (
                <CategoryPill
                  key={cat}
                  id={`cat-${cat}`}
                  label={cat}
                  count={count}
                  isActive={selectedCategory === cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                />
              );
            })}
          </div>
        </div>
      </nav>

      <div
        ref={scrollRef}
        className={`flex-1 hide-scrollbar ${isEmpty ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}
      >
        <div className={`w-full px-6 space-y-6 pb-24 ${isEmpty ? 'flex-1 flex flex-col items-center justify-center' : 'py-8'}`}>
          {!isEmpty ? (
            <>
              {categories.map(cat => {
                const catItems = filteredActive.filter(i => i.category === cat);
                const isFilterActive = selectedCategory === cat;

                if (catItems.length === 0) {
                  if (isFilterActive) {
                    return (
                      <div key={cat} className="animate-in fade-in zoom-in-95 duration-500 py-24 flex flex-col items-center justify-center bg-slate-50/30 border-2 border-dashed border-slate-100 rounded-[3rem]">
                        <div className="text-6xl mb-4 opacity-10 grayscale">🏠</div>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] text-center max-w-[180px] leading-relaxed">
                          No {cat.toLowerCase()} items added to your list
                        </p>
                      </div>
                    );
                  }
                  return null;
                }

                return (
                  <div key={cat} className="animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{cat}</h3>
                      <div className="h-px flex-1 bg-slate-50 ml-4"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catItems.map(item => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onToggle={() => onToggle(item.id)}
                          onEdit={() => setEditingItem(item)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {selectedCategory === 'All' && boughtItems.length > 0 && (
                <div className="pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">History</h3>
                      <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-md font-black">
                        {boughtItems.length}
                      </span>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={onClearBought}
                      className="text-[10px] uppercase tracking-widest px-3 py-2 rounded-xl"
                    >
                      Clear History
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-50 grayscale-[0.3]">
                    {boughtItems.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onToggle={() => onToggle(item.id)}
                        onEdit={() => { }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : dataLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-20">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Fetching items...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center opacity-30 animate-in fade-in duration-700 -mt-20">
              <PantryLogo className="w-24 h-24 mb-8 soft-bounce" />
              <p className="text-slate-500 font-black text-center text-xs uppercase tracking-[0.2em] leading-loose">
                Your shared pantry is empty<br />Start adding items below
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={editingItem?.name}
      >
        {editingItem && (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex items-center space-x-5 mb-8">
              <div className="text-3xl w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-100/50">
                {editingItem.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 inline-block px-2 py-0.5 rounded-md mb-1">
                  {editingItem.category}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity"
                inputMode="decimal"
                value={editingItem.qtyValue || ''}
                onChange={(e) => setEditingItem({ ...editingItem, qtyValue: e.target.value })}
                placeholder="1"
              />
              <Select
                label="Unit"
                value={editingItem.qtyUnit || ''}
                onChange={(e) => setEditingItem({ ...editingItem, qtyUnit: e.target.value })}
                options={UNITS}
              />
            </div>

            <Textarea
              label="Notes"
              rows={2}
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              placeholder="Extra instructions..."
            />

            <div className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemove}
                className="w-full text-red-400 text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-500"
              >
                Delete Item
              </Button>
            </div>

            <div className="flex space-x-3 pt-6 mt-2 flex-none border-t border-slate-50">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingItem(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

const CategoryPill: React.FC<{ id?: string; label: string; count: number; isActive: boolean; onClick: () => void }> = ({ id, label, count, isActive, onClick }) => (
  <button
    id={id}
    onClick={onClick}
    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all duration-300 shrink-0 whitespace-nowrap ${isActive
      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
      : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 active:bg-slate-50'
      }`}
  >
    <span>{label}</span>
    {count > 0 && (
      <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    )}
  </button>
);

const ItemCard: React.FC<{ item: GroceryItem; onToggle: () => void; onEdit: () => void }> = ({ item, onToggle, onEdit }) => {
  const quantityString = item.qtyValue ? `${item.qtyValue}${item.qtyUnit ? ' ' + item.qtyUnit : ''}` : '';
  const isBought = item.isBought;
  const isCategorizing = item.icon === '⏳';

  return (
    <Card
      className={`group flex items-center p-4 transition-all duration-200 ${isBought
        ? 'bg-slate-50/50 border-transparent'
        : 'shadow-sm hover:shadow-md'
        } ${isCategorizing ? 'animate-pulse opacity-70' : ''}`}
      onClick={isBought ? undefined : onEdit}
      interactive={!isBought}
    >
      <div className={`w-12 h-12 flex-none flex items-center justify-center text-3xl bg-slate-50 rounded-2xl mr-4 transition-all ${isBought ? 'grayscale opacity-30 scale-90' : 'shadow-inner'} ${isCategorizing ? 'animate-bounce' : ''}`}>
        {item.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2 overflow-hidden">
          <h4 className={`text-base font-black truncate transition-all duration-300 ${isBought ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {item.name}
          </h4>
          {quantityString && !isCategorizing && (
            <span className={`text-xs font-black whitespace-nowrap px-2 py-0.5 rounded-lg ${isBought ? 'text-slate-300 bg-slate-50' : 'text-emerald-600 bg-emerald-50'}`}>
              {quantityString}
            </span>
          )}
        </div>

        {(isCategorizing || item.notes) && (
          <div className="flex items-center mt-0.5">
            {isCategorizing ? (
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest animate-pulse">Categorizing...</p>
            ) : (
              <p className="text-[10px] text-slate-300 truncate font-medium italic max-w-[200px]">{item.notes}</p>
            )}
          </div>
        )}
      </div>

      <button
        disabled={isCategorizing}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex-none w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 active:scale-90 ${isBought
          ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20'
          : 'border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30'
          } ${isCategorizing ? 'opacity-20 cursor-wait' : ''}`}
      >
        {isBought ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-400"></div>
        )}
      </button>
    </Card>
  );
};
