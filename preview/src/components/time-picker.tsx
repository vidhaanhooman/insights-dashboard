"use client";

export function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-[52px] items-center rounded-md border border-border-strong bg-surface-2/40 px-3">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </div>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 w-full bg-transparent font-mono text-sm text-text outline-none"
        />
      </div>
    </div>
  );
}
