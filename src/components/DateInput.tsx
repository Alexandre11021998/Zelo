import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value: string; // Format: YYYY-MM-DD (ISO format for storage)
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

// Converts display format DD/MM/AAAA to ISO YYYY-MM-DD
const displayToIso = (display: string): string => {
  const cleaned = display.replace(/\D/g, '');
  if (cleaned.length !== 8) return '';
  
  const day = cleaned.slice(0, 2);
  const month = cleaned.slice(2, 4);
  const year = cleaned.slice(4, 8);
  
  return `${year}-${month}-${day}`;
};

// Converts ISO YYYY-MM-DD to display format DD/MM/AAAA
const isoToDisplay = (iso: string): string => {
  if (!iso) return '';
  
  const parts = iso.split('-');
  if (parts.length !== 3) return '';
  
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

// Apply mask to input value
const applyMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  
  if (numbers.length <= 2) {
    return numbers;
  }
  if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
};

// Validate if date is real
const isValidDate = (display: string): boolean => {
  const cleaned = display.replace(/\D/g, '');
  if (cleaned.length !== 8) return false;
  
  const day = parseInt(cleaned.slice(0, 2), 10);
  const month = parseInt(cleaned.slice(2, 4), 10);
  const year = parseInt(cleaned.slice(4, 8), 10);
  
  // Basic range checks
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  
  // Check days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;
  
  return true;
};

// Get validation error message
const getValidationError = (display: string): string | null => {
  const cleaned = display.replace(/\D/g, '');
  
  if (cleaned.length === 0) return null;
  
  // Partial validation while typing
  if (cleaned.length >= 2) {
    const day = parseInt(cleaned.slice(0, 2), 10);
    if (day < 1 || day > 31) return 'Dia inválido';
  }
  
  if (cleaned.length >= 4) {
    const month = parseInt(cleaned.slice(2, 4), 10);
    if (month < 1 || month > 12) return 'Mês inválido';
  }
  
  if (cleaned.length === 8) {
    const day = parseInt(cleaned.slice(0, 2), 10);
    const month = parseInt(cleaned.slice(2, 4), 10);
    const year = parseInt(cleaned.slice(4, 8), 10);
    
    if (year < 1900) return 'Ano muito antigo';
    if (year > new Date().getFullYear()) return 'Ano futuro inválido';
    
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return `Este mês tem apenas ${daysInMonth} dias`;
  }
  
  return null;
};

export function DateInput({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  disabled = false,
  className,
  id,
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display value when external value changes
  useEffect(() => {
    const newDisplay = isoToDisplay(value);
    if (newDisplay !== displayValue && !isFocused) {
      setDisplayValue(newDisplay);
    }
  }, [value, isFocused]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const masked = applyMask(rawValue);
    setDisplayValue(masked);
    
    // Validate while typing
    const validationError = getValidationError(masked);
    setError(validationError);
    
    // Only emit valid complete dates
    if (masked.replace(/\D/g, '').length === 8 && isValidDate(masked)) {
      onChange(displayToIso(masked));
    } else if (masked.length === 0) {
      onChange('');
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Final validation on blur
    if (displayValue && !isValidDate(displayValue)) {
      setError('Data inválida');
    }
  }, [displayValue]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const isComplete = displayValue.replace(/\D/g, '').length === 8;
  const isValid = isComplete && isValidDate(displayValue);

  return (
    <div className="space-y-1">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'bg-background',
          error && 'border-destructive focus-visible:ring-destructive',
          isComplete && isValid && 'border-green-500 focus-visible:ring-green-500',
          className
        )}
        maxLength={10}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

export { displayToIso, isoToDisplay, isValidDate };
