import { useState, forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface FloatingPasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
}

const FloatingPasswordInput = forwardRef<HTMLInputElement, FloatingPasswordInputProps>(
  ({ label, error, showPasswordToggle = true, className = '', id, value, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPw, setShowPw] = useState(false);
    
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
          type={showPw ? 'text' : 'password'}
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
            ${showPasswordToggle ? 'pr-12' : ''}
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
        
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
            aria-label={showPw ? 'Hide password' : 'Show password'}
            title={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5.477 20 1 12 1 12a20.76 20.76 0 0 1 5.06-5.94" />
                <path d="M10.73 5.08A11 11 0 0 1 12 4c6.523 0 11 8 11 8a20.76 20.76 0 0 1-4.17 4.92" />
                <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4.5-8 11-8 11 8 11 8-4.5 8-11 8-11-8-11-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
        
        {error && (
          <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

FloatingPasswordInput.displayName = 'FloatingPasswordInput';

export default FloatingPasswordInput;
