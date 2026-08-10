import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium ${className}`}
    >
      {initials || <User size={size * 0.5} />}
    </div>
  );
}
