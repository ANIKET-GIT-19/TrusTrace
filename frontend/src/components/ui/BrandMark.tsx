interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(22,26,24,0.09)] bg-white/80 text-[#161A18] shadow-[0_2px_8px_rgba(22,26,24,0.05)]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
          <rect x="3.5" y="14" width="2.6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8.2" y="11" width="2.6" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="12.9" y="12.5" width="2.6" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="17.6" y="8.5" width="2.6" height="11.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M4 11.5L9.5 7.5L13.5 9L20 4M20 4H16.5M20 4V7.5"
            stroke="#1F4D3A"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="text-[16px] font-semibold tracking-[-0.02em] text-[#161A18]">
          Tip Autopsy
        </span>
      )}
    </span>
  );
}
