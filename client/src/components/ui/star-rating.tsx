import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ 
  rating, 
  size = 'medium', 
  className = '',
  interactive = false,
  onChange
}: StarRatingProps) {
  const totalStars = 5;
  const sizeClass = 
    size === 'small' ? 'w-3 h-3' : 
    size === 'large' ? 'w-6 h-6' : 
    'w-4 h-4';
  
  const handleClick = (selectedRating: number) => {
    if (interactive && onChange) {
      onChange(selectedRating);
    }
  };
  
  return (
    <div className={`star-rating flex ${className}`}>
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type="button"
            className={`${interactive ? 'cursor-pointer' : ''} ${starValue <= rating ? 'text-secondary' : 'text-neutral-medium'}`}
            onClick={() => handleClick(starValue)}
            disabled={!interactive}
          >
            <Star className={`${sizeClass} ${starValue <= rating ? 'fill-current' : ''}`} />
          </button>
        );
      })}
    </div>
  );
}
