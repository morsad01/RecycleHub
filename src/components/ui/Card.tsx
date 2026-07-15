import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-card ${hover ? 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
