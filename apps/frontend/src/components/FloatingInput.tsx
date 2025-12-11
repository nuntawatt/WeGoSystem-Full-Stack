import { useState, forwardRef, InputHTMLAttributes } from 'react';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, className = '', id, value, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    const hasValue = value !== undefined && value !== null && value !== '';
    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=" "
          className={`
            peer w-full px-4 pt-5 pb-2 rounded-lg text-slate-900 dark:text-white 
            bg-slate-50 dark:bg-slate-900 border-2 
            ${error 
              ? 'border-red-400 dark:border-red-500' 
              : isFocused 
                ? 'border-teal-500 dark:border-teal-400' 
                : 'border-slate-200 dark:border-slate-700'
            }
            transition-all duration-200 
            focus:border-teal-500 dark:focus:border-teal-400 
            focus:ring-0 focus:outline-none
            ${className}
          `}
          {...props}
        />
        <label
          htmlFor={id}
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none
            ${isFloating
              ? '-top-2.5 text-xs px-1 bg-white dark:bg-slate-800 rounded'
              : 'top-1/2 -translate-y-1/2 text-base'
            }
            ${error
              ? 'text-red-500 dark:text-red-400'
              : isFocused
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }
          `}
        >
          {label}
        </label>
        {error && (
          <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

export default FloatingInput;
