import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MonthPickerProps {
  value: string; // format: YYYY-MM
  onChange: (value: string) => void;
  className?: string;
}

const MONTHS_AR = [
  { value: 1, label: "يناير" },
  { value: 2, label: "فبراير" },
  { value: 3, label: "مارس" },
  { value: 4, label: "أبريل" },
  { value: 5, label: "مايو" },
  { value: 6, label: "يونيو" },
  { value: 7, label: "يوليو" },
  { value: 8, label: "أغسطس" },
  { value: 9, label: "سبتمبر" },
  { value: 10, label: "أكتوبر" },
  { value: 11, label: "نوفمبر" },
  { value: 12, label: "ديسمبر" },
];

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [yearStr, monthStr] = value.split("-");
  const currentYear = parseInt(yearStr) || new Date().getFullYear();
  const currentMonth = parseInt(monthStr) || new Date().getMonth() + 1;

  const [open, setOpen] = React.useState(false);
  const [displayedYear, setDisplayedYear] = React.useState(currentYear);
  const [prevCurrentYear, setPrevCurrentYear] = React.useState(currentYear);

  if (currentYear !== prevCurrentYear) {
    setPrevCurrentYear(currentYear);
    setDisplayedYear(currentYear);
  }

  const handleSelectMonth = (monthVal: number) => {
    const formattedMonth = String(monthVal).padStart(2, "0");
    onChange(`${displayedYear}-${formattedMonth}`);
    setOpen(false);
  };

  const handlePrevYear = () => {
    setDisplayedYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setDisplayedYear((prev) => prev + 1);
  };

  const handleSetCurrent = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    onChange(`${yyyy}-${mm}`);
    setDisplayedYear(yyyy);
    setOpen(false);
  };

  // Get current active month label
  const activeMonthLabel = MONTHS_AR.find((m) => m.value === currentMonth)?.label || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-48 justify-between text-right font-normal bg-background border border-border cursor-pointer select-none",
            className,
          )}
        >
          <span className="font-semibold text-foreground">
            {activeMonthLabel} {currentYear}
          </span>
          <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 text-right" align="end" dir="rtl">
        {/* Year Selector Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <Button variant="ghost" size="icon" onClick={handlePrevYear} className="size-7">
            <ChevronRight className="size-4" />
          </Button>
          <span className="font-bold text-sm text-foreground">{displayedYear}</span>
          <Button variant="ghost" size="icon" onClick={handleNextYear} className="size-7">
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        {/* Months Grid */}
        <div className="grid grid-cols-3 gap-2 py-3">
          {MONTHS_AR.map((m) => {
            const isSelected = currentMonth === m.value && currentYear === displayedYear;
            return (
              <Button
                key={m.value}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                onClick={() => handleSelectMonth(m.value)}
                className="w-full text-center text-xs font-semibold py-2.5 h-auto cursor-pointer"
              >
                {m.label}
              </Button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-border mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSetCurrent}
            className="text-[11px] font-bold text-primary hover:bg-primary/5 cursor-pointer h-7 px-2.5"
          >
            هذا الشهر
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-[11px] font-bold text-muted-foreground hover:bg-muted cursor-pointer h-7 px-2.5"
          >
            إغلاق
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
