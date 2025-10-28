import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/common/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/common/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/common/components/ui/command';
import { Checkbox } from '@/common/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import type { IDocumentItem } from '../interfaces/IDocumentItem';
import type { IMultiSearchSelectProps } from '../interfaces/IMultiSearchSelectProps'
import type { ICourseItem } from '../interfaces/ICourseItem';

const MultipleFilesCommand: React.FC<IMultiSearchSelectProps<IDocumentItem | ICourseItem>> = ({
  items,
  selectedItems,
  onSelect,
  onRemove,
  placeholder = 'Chọn mục...',
  label = 'Chọn mục...',
  maxSelections,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = useCallback((id: number) => {
    return selectedItems.some((itemId) => itemId === id);
  }, [selectedItems]);

  const handleToggle = (item: IDocumentItem | ICourseItem) => {
    if (isSelected(item.id)) {
      onRemove(item.id);
    } else {
      if (!maxSelections || selectedItems.length < maxSelections) {
        onSelect(item);
      }
    }
    setSearchValue('');
  };

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {label}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            disabled={maxSelections !== undefined && (selectedItems.length >= maxSelections)}
            ref={inputRef}
            placeholder={placeholder}
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
          />
          <CommandEmpty>Không có dữ liệu.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {items.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => handleToggle(item)}
                className="cursor-pointer flex items-center justify-between"
                value={item.name.toString()}
                disabled={maxSelections !== undefined && (selectedItems.length >= maxSelections)}
              >
                <div className="flex-1 truncate">
                  {`${item.name} (Môn ${item.subject} - Lớp ${item.grade})`}
                </div>
                <Checkbox
                  checked={isSelected(item.id)}
                  onCheckedChange={() => handleToggle(item)}
                  className="ml-2"
                />
              </CommandItem>
            ))}
            {maxSelections && selectedItems.length >= maxSelections && (
              <div className="p-2 text-center text-sm text-gray-500">
                Đã chọn tối đa {maxSelections} mục.
              </div>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultipleFilesCommand;