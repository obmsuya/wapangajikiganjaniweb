"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerDemo() {
  const [date, setDate] = React.useState(null)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export function DatePickerWithRange({ from, to, onUpdate }) {
  const [date, setDate] = React.useState({ from, to })

  // Update the parent component when dates change
  React.useEffect(() => {
    if (onUpdate && (date.from !== from || date.to !== to)) {
      onUpdate(date)
    }
  }, [date, from, to, onUpdate])

  // Handle preset selection
  const handleSelectPreset = (preset) => {
    const today = new Date()
    let newFrom, newTo
    
    switch(preset) {
      case 'thisMonth':
        newFrom = new Date(today.getFullYear(), today.getMonth(), 1)
        newTo = today
        break
      case 'lastMonth':
        newFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        newTo = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'last30Days':
        newFrom = new Date()
        newFrom.setDate(today.getDate() - 30)
        newTo = today
        break
      default:
        return
    }
    
    const newDate = { from: newFrom, to: newTo }
    setDate(newDate)
    if (onUpdate) {
      onUpdate(newDate)
    }
  }

  return (
    <div className="flex flex-col space-y-4 bg-white dark:bg-gray-950 p-2 rounded-md border border-gray-200 dark:border-gray-800">
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date.from}
        selected={date}
        onSelect={setDate}
        numberOfMonths={2}
        className="rounded-md bg-white dark:bg-gray-950"
      />
      <div className="flex items-center justify-between border-t pt-4 border-gray-200 dark:border-gray-800">
        <div className="text-sm text-gray-500">
          {date.from ? (
            date.to ? (
              <>
                <span className="font-medium">
                  {format(date.from, "LLL dd, y")}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {format(date.to, "LLL dd, y")}
                </span>
              </>
            ) : (
              <span className="font-medium">
                {format(date.from, "LLL dd, y")}
              </span>
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSelectPreset('thisMonth')}
          >
            This Month
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSelectPreset('lastMonth')}
          >
            Last Month
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSelectPreset('last30Days')}
          >
            Last 30 Days
          </Button>
        </div>
      </div>
    </div>
  )
}