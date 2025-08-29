import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: string, label: string) => {
    setSelectedValue(value);
    setSelectedLabel(label);
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-500'}>
          {selectedLabel || placeholder || 'Select an option'}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  return <div className="py-1">{children}</div>;
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  return (
    <div
      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
      onClick={() => {
        // This will be handled by the parent Select component
        const event = new CustomEvent('select-item', { detail: { value, label: children } });
        document.dispatchEvent(event);
      }}
    >
      {children}
    </div>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  return <span>{placeholder}</span>;
};
