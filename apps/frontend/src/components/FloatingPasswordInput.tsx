import { useState, forwardRef, InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
            peer w-full px-4 pt-5 pb-2 rounded-xl text-sm font-medium text-[#202124] 
            bg-[#F3F5F4] border transition-all duration-200 
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : isFocused 
                ? 'border-[#147D70] bg-white ring-2 ring-[#147D70]/15' 
                : 'border-[#E8EBE9] hover:border-[#BAC2BF]'
            }
            focus:outline-none
            ${showPasswordToggle ? 'pr-11' : ''}
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
        
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute inset-y-0 right-0 px-3.5 flex items-center text-[#858B89] hover:text-[#202124] transition-colors"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
        
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

FloatingPasswordInput.displayName = 'FloatingPasswordInput';

export default FloatingPasswordInput;
