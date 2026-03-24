import React, { useState, useRef, useEffect } from 'react';
import { Country } from '../types';

interface MultiSelectProps {
  options: Country[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  label: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedValues, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (code: string) => {
    let newValues: string[];
    
    if (code === 'WW') {
      newValues = selectedValues.includes('WW') ? [] : ['WW'];
    } else {
      const withoutWW = selectedValues.filter(v => v !== 'WW');
      if (withoutWW.includes(code)) {
        newValues = withoutWW.filter(v => v !== code);
      } else {
        newValues = [...withoutWW, code];
      }
    }
    onChange(newValues);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return 'Select Target Regions...';
    if (selectedValues.includes('WW')) return 'Worldwide';
    if (selectedValues.length === 1) {
      return options.find(o => o.code === selectedValues[0])?.name;
    }
    return `${selectedValues.length} Countries Selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label is usually handled by parent layout in this new design, but we keep a generic one just in case */}
      {/* <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label> */}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl bg-slate-900/50 border text-left focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all p-3.5 shadow-inner ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        <span className={`block truncate ${selectedValues.length === 0 ? 'text-slate-500' : 'text-white'}`}>
          {getDisplayText()}
        </span>
        <svg className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-700 shadow-2xl max-h-60 rounded-xl py-2 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm animate-fade-in">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.code);
            return (
              <div
                key={option.code}
                className={`cursor-pointer select-none relative py-2.5 pl-4 pr-9 transition-colors ${
                  isSelected 
                  ? 'bg-blue-600/20 text-blue-100' 
                  : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
                }`}
                onClick={() => toggleOption(option.code)}
              >
                <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                  {option.name}
                </span>
                {isSelected && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-400">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};