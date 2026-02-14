
export type CategoryType = 
  | 'Produce' 
  | 'Dairy' 
  | 'Bakery' 
  | 'Meat & Seafood' 
  | 'Frozen' 
  | 'Pantry' 
  | 'Household' 
  | 'Beverages' 
  | 'Snacks' 
  | 'Other';

export interface GroceryItem {
  id: string;
  name: string;
  qtyValue?: string;
  qtyUnit?: string;
  notes?: string;
  category: CategoryType;
  icon: string;
  isBought: boolean;
  addedBy: string;
  createdAt: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: 'Administrator' | 'Member';
  avatar?: string;
}

export interface FamilyGroup {
  id: string;
  code: string;
  name: string;
  members: FamilyMember[];
}

export interface AppState {
  user: { name: string; id: string; role: 'Administrator' | 'Member' } | null;
  group: FamilyGroup | null;
  items: GroceryItem[];
  isInitialized: boolean;
}
