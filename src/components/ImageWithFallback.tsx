import React, { useState } from "react";
import { ImageIcon } from "lucide-react";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  onClick?: () => void;
  draggable?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className,
  fallbackClassName,
  iconClassName,
  onClick,
  draggable,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={fallbackClassName} role="img" aria-label={alt}>
        <ImageIcon className={iconClassName} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      onClick={onClick}
      onContextMenu={(event) => event.preventDefault()}
      draggable={draggable ?? false}
      className={className}
      loading="lazy"
    />
  );
};