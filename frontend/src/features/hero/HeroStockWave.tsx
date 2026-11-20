interface CandleSpec {
  x: number;
  bodyTop: number;
  bodyHeight: number;
  wickTop: number;
  wickBottom: number;
  up: boolean;
}

const HERO_CANDLES: CandleSpec[] = [
  { x: 32, bodyTop: 220, bodyHeight: 28, wickTop: 204, wickBottom: 262, up: true },
  { x: 64, bodyTop: 208, bodyHeight: 22, wickTop: 192, wickBottom: 244, up: false },
  { x: 96, bodyTop: 194, bodyHeight: 32, wickTop: 178, wickBottom: 238, up: true },
  { x: 128, bodyTop: 186, bodyHeight: 24, wickTop: 170, wickBottom: 224, up: true },
  { x: 160, bodyTop: 174, bodyHeight: 26, wickTop: 158, wickBottom: 214, up: true },
  { x: 192, bodyTop: 156, bodyHeight: 34, wickTop: 140, wickBottom: 202, up: true },
  { x: 224, bodyTop: 170, bodyHeight: 20, wickTop: 156, wickBottom: 206, up: false },
  { x: 256, bodyTop: 146, bodyHeight: 36, wickTop: 128, wickBottom: 196, up: true },
  { x: 288, bodyTop: 162, bodyHeight: 24, wickTop: 148, wickBottom: 200, up: false },
  { x: 320, bodyTop: 176, bodyHeight: 26, wickTop: 162, wickBottom: 214, up: false },
  { x: 352, bodyTop: 164, bodyHeight: 30, wickTop: 148, wickBottom: 206, up: true },
  { x: 384, bodyTop: 152, bodyHeight: 28, wickTop: 136, wickBottom: 194, up: true },
  { x: 416, bodyTop: 168, bodyHeight: 20, wickTop: 154, wickBottom: 200, up: false },
  { x: 448, bodyTop: 184, bodyHeight: 24, wickTop: 168, wickBottom: 222, up: false },
  { x: 480, bodyTop: 192, bodyHeight: 22, wickTop: 178, wickBottom: 228, up: false },
  { x: 512, bodyTop: 180, bodyHeight: 26, wickTop: 166, wickBottom: 218, up: true },
  { x: 544, bodyTop: 168, bodyHeight: 28, wickTop: 154, wickBottom: 208, up: true },
  { x: 576, bodyTop: 184, bodyHeight: 20, wickTop: 170, wickBottom: 218, up: false },
  { x: 608, bodyTop: 194, bodyHeight: 24, wickTop: 180, wickBottom: 230, up: false },
  { x: 640, bodyTop: 186, bodyHeight: 26, wickTop: 172, wickBottom: 224, up: true },
  { x: 672, bodyTop: 174, bodyHeight: 24, wickTop: 160, wickBottom: 210, up: true },
  { x: 704, bodyTop: 166, bodyHeight: 22, wickTop: 150, wickBottom: 202, up: true },
  { x: 736, bodyTop: 180, bodyHeight: 20, wickTop: 166, wickBottom: 214, up: false },
  { x: 768, bodyTop: 172, bodyHeight: 26, wickTop: 156, wickBottom: 212, up: true },
  { x: 800, bodyTop: 160, bodyHeight: 24, wickTop: 146, wickBottom: 198, up: true },
  { x: 832, bodyTop: 174, bodyHeight: 22, wickTop: 160, wickBottom: 210, up: false },
  { x: 864, bodyTop: 188, bodyHeight: 26, wickTop: 174, wickBottom: 228, up: false },
  { x: 896, bodyTop: 196, bodyHeight: 20, wickTop: 182, wickBottom: 230, up: false },
  { x: 928, bodyTop: 182, bodyHeight: 28, wickTop: 168, wickBottom: 224, up: true },
  { x: 960, bodyTop: 166, bodyHeight: 30, wickTop: 150, wickBottom: 210, up: true },
  { x: 992, bodyTop: 148, bodyHeight: 34, wickTop: 132, wickBottom: 196, up: true },
  { x: 1024, bodyTop: 158, bodyHeight: 24, wickTop: 144, wickBottom: 196, up: false },
  { x: 1056, bodyTop: 140, bodyHeight: 30, wickTop: 124, wickBottom: 184, up: true },
  { x: 1088, bodyTop: 126, bodyHeight: 28, wickTop: 110, wickBottom: 168, up: true },
  { x: 1120, bodyTop: 138, bodyHeight: 22, wickTop: 124, wickBottom: 174, up: false },
  { x: 1152, bodyTop: 122, bodyHeight: 32, wickTop: 106, wickBottom: 168, up: true },
  { x: 1184, bodyTop: 108, bodyHeight: 26, wickTop: 94, wickBottom: 150, up: true },
  { x: 1216, bodyTop: 120, bodyHeight: 24, wickTop: 104, wickBottom: 158, up: false },
  { x: 1248, bodyTop: 98, bodyHeight: 34, wickTop: 80, wickBottom: 146, up: true },
  { x: 1280, bodyTop: 82, bodyHeight: 30, wickTop: 64, wickBottom: 126, up: true },
  { x: 1312, bodyTop: 92, bodyHeight: 26, wickTop: 76, wickBottom: 130, up: false },
  { x: 1344, bodyTop: 70, bodyHeight: 32, wickTop: 52, wickBottom: 116, up: true },
  { x: 1376, bodyTop: 56, bodyHeight: 28, wickTop: 40, wickBottom: 98, up: true },
  { x: 1408, bodyTop: 44, bodyHeight: 26, wickTop: 28, wickBottom: 84, up: true },
];

/**
 * Ambient rising candlesticks + double-layered sage-emerald stock wave curve
 * matching ui-ux/hero.jpeg. Uses GPU-composited vertical drift and pauses
 * cleanly under prefers-reduced-motion.
 */
export function HeroStockBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[210px] z-0 h-[320px] overflow-hidden sm:top-[225px] sm:h-[360px]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="animate-hero-wave h-full w-full"
      >
        <defs>
          <linearGradient id="heroBgWaveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B8E6A" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#FAF8F4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="heroSecondaryStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#63A98A" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#3B8E6A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3B8E6A" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Faint translucent candlesticks ascending left to right */}
        <g opacity="0.42">
          {HERO_CANDLES.map((c) => {
            const fill = c.up ? "#63A98A" : "#A7B8B0";
            return (
              <g key={c.x}>
                <line
                  x1={c.x}
                  y1={c.wickTop}
                  x2={c.x}
                  y2={c.wickBottom}
                  stroke={fill}
                  strokeWidth="1.5"
                  strokeOpacity="0.55"
                />
                <rect
                  x={c.x - 4.5}
                  y={c.bodyTop}
                  width="9"
                  height={c.bodyHeight}
                  rx="2"
                  fill={fill}
                  fillOpacity={c.up ? "0.46" : "0.34"}
                />
              </g>
            );
          })}
        </g>

        {/* Soft secondary stock curve rising into upper-right */}
        <path
          d="M0 278 C120 218, 220 184, 330 206 C450 230, 560 198, 690 212 C830 226, 940 210, 1080 140 C1200 80, 1320 132, 1440 42"
          fill="none"
          stroke="url(#heroSecondaryStroke)"
          strokeWidth="2"
        />
        <path
          d="M0 278 C120 218, 220 184, 330 206 C450 230, 560 198, 690 212 C830 226, 940 210, 1080 140 C1200 80, 1320 132, 1440 42 L1440 320 L0 320 Z"
          fill="url(#heroBgWaveFill)"
        />
      </svg>
    </div>
  );
}

/**
 * Defines the objectBoundingBox SVG clipPath that sculpts the top edge of
 * the 5-card finfluencer strip along the glowing emerald stock wave curve,
 * matching ui-ux/hero.jpeg.
 */
export function HeroWaveClipDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <clipPath id="hero-wave-strip-clip" clipPathUnits="objectBoundingBox">
          <path d="M 0,0.43 C 0.09,0.23 0.16,0.16 0.24,0.20 C 0.32,0.24 0.39,0.26 0.45,0.17 C 0.50,0.09 0.56,0.06 0.62,0.17 C 0.67,0.27 0.72,0.28 0.77,0.19 C 0.82,0.10 0.87,0.26 0.93,0.15 C 0.97,0.09 0.99,0.04 1,0.02 L 1,1 L 0,1 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/**
 * Glowing emerald stock line overlaid right along the clipped top edge of the
 * 5-card finfluencer showcase.
 */
export function HeroWaveBorderOverlay() {
  return (
    <svg
      viewBox="0 0 1440 360"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroGlowLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B8E6A" />
          <stop offset="50%" stopColor="#3EC98A" />
          <stop offset="100%" stopColor="#34B87D" />
        </linearGradient>
        <filter id="heroLineGlow" x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Soft top inner sheen below the line */}
      <path
        d="M 0,154.8 C 129.6,82.8 230.4,57.6 345.6,72 C 460.8,86.4 561.6,93.6 648,61.2 C 720,32.4 806.4,21.6 892.8,61.2 C 964.8,97.2 1036.8,100.8 1108.8,68.4 C 1180.8,36 1252.8,93.6 1339.2,54 C 1396.8,32.4 1425.6,14.4 1440,7.2"
        fill="none"
        stroke="url(#heroGlowLine)"
        strokeWidth="4.5"
        strokeLinecap="round"
        filter="url(#heroLineGlow)"
        opacity="0.72"
      />
      <path
        d="M 0,154.8 C 129.6,82.8 230.4,57.6 345.6,72 C 460.8,86.4 561.6,93.6 648,61.2 C 720,32.4 806.4,21.6 892.8,61.2 C 964.8,97.2 1036.8,100.8 1108.8,68.4 C 1180.8,36 1252.8,93.6 1339.2,54 C 1396.8,32.4 1425.6,14.4 1440,7.2"
        fill="none"
        stroke="#47D194"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
