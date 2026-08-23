import React from "react";

interface BrandLogoProps {
  className?: string;
  color?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "w-9 h-9 sm:w-10 sm:h-10",
  color = "#2E4F2D",
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="泉心生活 Logo"
    >
      {/* Outer Water Droplet Contour */}
      <path
        d="M 50 8 C 50 8, 81 48, 81 66 C 81 83.12, 67.12 93, 50 93 C 32.88 93, 19 83.12, 19 66 C 19 48, 50 8, 50 8 Z"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mountains */}
      <path
        d="M 29 66 L 46 46 L 59 59"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 42 51 L 43 56 L 40 57"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 55 58 L 62 52 L 70 63"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Waves */}
      <path
        d="M 20 67 C 30 72, 45 72, 58 66 C 68 62, 75 65, 80 67"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 22 75 C 32 80, 48 80, 60 73 C 69 69, 74 72, 78 74"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 27 83 C 37 87, 52 86, 62 80 C 67 77, 71 79, 74 81"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
