import React from 'react';

interface CameraFlashLogoProps {
  className?: string;
  size?: number | string;
}

export const CameraFlashLogo: React.FC<CameraFlashLogoProps> = ({
  className = 'w-6 h-6',
  size,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="currentColor"
      aria-label="Camera Flash Logo"
    >
      {/* Shutter Button (Top-Left) */}
      <path d="M 88 144 C 88 134 96 126 106 126 H 134 C 144 126 152 134 152 144 V 176 H 88 Z" />

      {/* Pentaprism Top Plate (Top-Center) */}
      <path d="M 194 176 L 212 136 C 215 130 221 126 228 126 H 304 C 311 126 317 130 320 136 L 338 176 Z" />

      {/* Flash Burst Star (Top-Right) */}
      <path d="M 268 76 L 314 42 L 314 78 L 350 52 L 344 94 L 408 74 L 378 114 L 428 142 L 374 148 L 362 174 L 324 152 L 322 132 L 288 142 L 308 108 Z" />

      {/* Main Camera Body (Black Rounded Box with Lens Gap) */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="
          M 76 182
          C 46 182 28 200 28 230
          V 422
          C 28 452 46 470 76 470
          H 436
          C 466 470 484 452 484 422
          V 230
          C 484 200 466 182 436 182
          H 76 Z

          M 400 244
          C 413.25 244 424 233.25 424 220
          C 424 206.75 413.25 196 400 196
          C 386.75 196 376 206.75 376 220
          C 376 233.25 386.75 244 400 244 Z

          M 256 228
          C 320 228 372 280 372 344
          C 372 408 320 460 256 460
          C 192 460 140 408 140 344
          C 140 280 192 228 256 228 Z
        "
      />

      {/* Outer White Ring of Lens */}
      <circle cx="256" cy="344" r="102" fill="white" />

      {/* Main Outer Black Lens Barrel */}
      <circle cx="256" cy="344" r="88" fill="currentColor" />

      {/* Inner White Ring Accent */}
      <circle cx="256" cy="344" r="68" fill="white" />

      {/* Center Black Lens Core */}
      <circle cx="256" cy="344" r="54" fill="currentColor" />
    </svg>
  );
};
