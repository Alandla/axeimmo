import React, { useState, useRef, useLayoutEffect } from 'react';

interface AutoResizingInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const AutoResizingInput = React.forwardRef<HTMLInputElement, AutoResizingInputProps>(({ 
  value, 
  onChange,
  className = ''
}, ref) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  
  const inputRef = (ref as React.RefObject<HTMLInputElement>) || localInputRef;

  useLayoutEffect(() => {
    if (spanRef.current && inputRef.current) {
      const width = spanRef.current.offsetWidth;
      inputRef.current.style.width = `${width}px`;
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
    >
      <span
        ref={spanRef}
        className="invisible inline-block text-sm sm:text-base px-0.5 py-[0.1rem] sm:py-1"
        style={{ whiteSpace: 'pre' }}
      >
        {value || '\u00A0'}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        className="absolute top-0 left-0 h-full text-sm sm:text-base px-0.5 py-[0.1rem] sm:py-1 hover:ring-1 focus:ring-2 ring-primary rounded transition-all duration-200 hover:z-10 focus:z-10"
      />
    </div>
  );
});

AutoResizingInput.displayName = 'AutoResizingInput';

export default AutoResizingInput;