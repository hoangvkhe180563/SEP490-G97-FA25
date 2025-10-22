export interface IMultiSearchSelectProps<T> {
  items: T[];
  selectedItems: number[]; // Currently selected items
  onSelect: (item: T) => void; // Callback when an item is selected
  onRemove: (id: number) => void; // Callback when an item is removed
  placeholder?: string;
  label?: string; // Label for the trigger button
  maxSelections?: number; // Maximum number of items that can be selected
}