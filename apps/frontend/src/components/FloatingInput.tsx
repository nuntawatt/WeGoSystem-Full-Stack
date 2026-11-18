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
            peer w-full px-4 pt-5 pb-2 rounded-xl text-sm font-medium text-[#202124] 
            bg-[#F3F5F4] border transition-all duration-200 
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : isFocused 
                ? 'border-[#147D70] bg-white ring-2 ring-[#147D70]/15' 
                : 'border-[#E8EBE9] hover:border-[#BAC2BF]'
            }
            focus:outline-none
            ${className}
          `}
          {...props}
        />
        <label
          htmlFor={id}
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none font-semibold
            ${isFloating
              ? 'top-1.5 text-[10px] text-[#147D70]'
              : 'top-1/2 -translate-y-1/2 text-xs text-[#858B89]'
            }
            ${error ? 'text-red-500' : ''}
          `}
        >
          {label}
        </label>
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

export default FloatingInput;
