"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DropdownOption = {
  /** Value committed via onChange. */
  value: string;
  /** What renders in the row + trigger. Defaults to `value`. */
  label?: React.ReactNode;
  disabled?: boolean;
};

export type DropdownProps = {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Classes for the trigger (e.g. width / height). */
  className?: string;
  /** Classes for the popover content. */
  contentClassName?: string;
  "aria-label"?: string;
};

/**
 * Reusable dark dropdown. Built on the styleguide-aligned Select primitives
 * (base-ui), so it matches every other dropdown in the product.
 */
export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled,
  className,
  contentClassName,
  "aria-label": ariaLabel,
}: DropdownProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onChange?.(v)}
      disabled={disabled}
    >
      <SelectTrigger className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label ?? o.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
