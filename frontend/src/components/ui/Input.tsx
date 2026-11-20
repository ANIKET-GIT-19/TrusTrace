import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  hint?: string;
}

export function TextField({ label, id, hint, className = "", ...rest }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold tracking-[0.01em] text-[#161A18]">
        {label}
      </label>
      <input
        id={id}
        className={`h-11 w-full rounded-xl border border-[rgba(22,26,24,0.09)] bg-white px-3.5 text-[15px] text-[#161A18] placeholder:text-[#6E7771] transition-colors hover:border-[rgba(22,26,24,0.22)] focus:border-[#4A7C64] focus:shadow-[0_0_0_3px_rgba(74,124,100,0.16)] focus:outline-none disabled:bg-[#F3F0EA] disabled:opacity-55 ${className}`}
        {...rest}
      />
      {hint && <p className="m-0 text-[12px] text-[#6E7771]">{hint}</p>}
    </div>
  );
}

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  hint?: string;
}

export function TextAreaField({ label, id, hint, className = "", ...rest }: TextAreaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold tracking-[0.01em] text-[#161A18]">
        {label}
      </label>
      <textarea
        id={id}
        className={`min-h-[112px] w-full resize-y rounded-2xl border border-[rgba(22,26,24,0.09)] bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#161A18] placeholder:text-[#6E7771] transition-colors hover:border-[rgba(22,26,24,0.22)] focus:border-[#4A7C64] focus:shadow-[0_0_0_3px_rgba(74,124,100,0.16)] focus:outline-none disabled:bg-[#F3F0EA] disabled:opacity-55 ${className}`}
        {...rest}
      />
      {hint && <p className="m-0 text-[12px] text-[#6E7771]">{hint}</p>}
    </div>
  );
}
