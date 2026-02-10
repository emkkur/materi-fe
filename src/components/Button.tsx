import { type FC, type ReactNode, type HTMLAttributes } from 'react';

interface ButtonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  children: ReactNode;
}

const Button: FC<ButtonProps> = ({ 
  variant = 'primary', 
  disabled = false, 
  children, 
  className = '', 
  onClick, 
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center py-2 px-4 rounded cursor-pointer transition-colors select-none font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-gray-800 text-white",
    secondary: "bg-gray-700 text-white",
    danger: "bg-red-600 text-white",
    ghost: "bg-transparent text-gray-600"
  };

  const interactiveVariants = {
    primary: "hover:bg-black focus:ring-gray-800",
    secondary: "hover:bg-gray-800 focus:ring-gray-500",
    danger: "hover:bg-red-700 focus:ring-red-600",
    ghost: "hover:bg-gray-100 focus:ring-gray-200"
  };

  const disabledStyles = "opacity-50 cursor-not-allowed";

  const appliedVariant = `${variants[variant]} ${!disabled ? interactiveVariants[variant] : ''}`;
  const appliedDisabled = disabled ? disabledStyles : '';

  return (
    <div 
      role="button"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      className={`${baseStyles} ${appliedVariant} ${appliedDisabled} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Button;
