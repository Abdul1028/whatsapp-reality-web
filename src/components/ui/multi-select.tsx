// TODO: Add Popover and Command components from shadcn/ui or community if not present.
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, ChevronDown, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onValueChange, placeholder = "Select...", className }) => {
  const [open, setOpen] = React.useState(false);
  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onValueChange(value.filter(v => v !== val));
    } else {
      onValueChange([...value, val]);
    }
  };

  const handleClear = () => onValueChange([]);
  const handleSelectAll = () => {
    if (value.length === options.length) {
      onValueChange([]);
    } else {
      onValueChange(options.map(opt => opt.value));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("min-w-[180px] justify-between", className)}>
          <span className="truncate flex-1 text-left">
            {selectedOptions.length > 0
              ? selectedOptions.map(opt => opt.label).join(", ")
              : <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={handleSelectAll} className="cursor-pointer">
                <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", value.length === options.length ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}> <CheckIcon className="h-4 w-4" /> </div>
                <span>(Select All)</span>
              </CommandItem>
              {options.map(opt => (
                <CommandItem key={opt.value} onSelect={() => toggleOption(opt.value)} className="cursor-pointer">
                  <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", value.includes(opt.value) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}> <CheckIcon className="h-4 w-4" /> </div>
                  <span>{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <div className="flex items-center justify-between px-2 py-1">
                {value.length > 0 && (
                  <Button variant="ghost" size="sm" className="px-2" onClick={handleClear}>
                    <X className="h-4 w-4 mr-1" />Clear
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="px-2 ml-auto" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}; 