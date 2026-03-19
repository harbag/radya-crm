"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type CalendarViewProps<T extends { id: string }> = {
  items: T[];
  getDate: (item: T) => string | null;
  renderItem: (item: T) => React.ReactNode;
  onItemClick?: (item: T) => void;
  entityName: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView<T extends { id: string }>({
  items,
  getDate,
  renderItem,
  onItemClick,
}: CalendarViewProps<T>) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  // Group items by date
  const itemsByDate = new Map<string, T[]>();
  items.forEach((item) => {
    const dateStr = getDate(item);
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      const key = d.getDate().toString();
      const existing = itemsByDate.get(key) || [];
      existing.push(item);
      itemsByDate.set(key, existing);
    }
  });

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Fill remaining to make complete rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-3">
        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">{monthName}</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentMonth(today.getMonth());
              setCurrentYear(today.getFullYear());
            }}
            className="h-8 text-xs"
          >
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-zinc-200">
        {DAYS.map((day, i) => (
          <div
            key={day}
            className="px-1 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:px-2 sm:py-2"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{DAYS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7 auto-rows-fr">
        {cells.map((day, i) => {
          const dayItems = day ? itemsByDate.get(day.toString()) || [] : [];
          return (
            <div
              key={i}
              className={cn(
                "border-b border-r border-zinc-100 p-0.5 min-h-[60px] sm:p-1 sm:min-h-[80px]",
                !day && "bg-zinc-50/50"
              )}
            >
              {day && (
                <>
                  <div
                    className={cn(
                      "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday(day)
                        ? "bg-indigo-500 text-white"
                        : "text-zinc-600"
                    )}
                  >
                    {day}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayItems.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => onItemClick?.(item)}
                      >
                        {renderItem(item)}
                      </div>
                    ))}
                    {dayItems.length > 2 && (
                      <span className="text-[10px] text-zinc-400 px-1">
                        +{dayItems.length - 2} more
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
