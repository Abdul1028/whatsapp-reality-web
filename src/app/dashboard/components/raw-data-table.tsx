"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { DataFrameRow } from "@/components/upload-form"; // Assuming DataFrameRow is exported here
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RawDataTableProps {
  data: DataFrameRow[];
}

const ROWS_PER_PAGE = 20;

export function RawDataTable({ data }: RawDataTableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showFullTable, setShowFullTable] = useState(false);

  if (!data || data.length === 0) {
    return <p>No raw data available to display.</p>;
  }

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const paginatedData = showFullTable ? data : data.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };
  
  const toggleShowFullTable = () => {
    setShowFullTable(!showFullTable);
    setCurrentPage(0); // Reset to first page when toggling
  };

  // Dynamically get all user-specific columns (e.g., "User A", "User A_mlength")
  // For simplicity, we'll list common known columns first, then any others.
  // This dynamic column discovery might be too complex for a simple validation table initially.
  // Let's stick to predefined important columns first.

  const columnsToDisplay: Array<{ key: keyof DataFrameRow | string; label: string; isBoolean?: boolean; isMessage?: boolean }> = [
    { key: "date", label: "Timestamp" },
    { key: "user", label: "User" },
    { key: "message", label: "Message", isMessage: true },
    { key: "Message Length", label: "Msg Len" },
    { key: "Conv code", label: "Conv Code" },
    { key: "Conv change", label: "New Conv?", isBoolean: true },
    { key: "Is reply", label: "Is Reply?", isBoolean: true },
    { key: "Sender change", label: "Sender Change?", isBoolean: true },
    { key: "Reply Time", label: "Reply Time (min)" },
    { key: "Inter conv time", label: "Inter-Conv Time (min)" },
    { key: "hour", label: "Hour" },
    { key: "period", label: "Period" },
    // Add more specific columns if needed for validation
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <Button onClick={toggleShowFullTable} variant="outline" size="sm">
          {showFullTable ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
          {showFullTable ? "Show Paginated" : `Show All (${data.length} rows)`}
        </Button>
        {!showFullTable && (
          <div className="flex items-center gap-2">
            <Button onClick={handlePrevPage} disabled={currentPage === 0} variant="outline" size="sm">Previous</Button>
            <span>Page {currentPage + 1} of {totalPages}</span>
            <Button onClick={handleNextPage} disabled={currentPage >= totalPages - 1} variant="outline" size="sm">Next</Button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableCaption>Raw parsed message data. {showFullTable ? `Showing all ${data.length} rows.` : `Showing ${paginatedData.length} of ${data.length} rows.`}</TableCaption>
          <TableHeader>
            <TableRow>
              {columnsToDisplay.map(col => (
                <TableHead key={col.key as string} className="whitespace-nowrap">{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columnsToDisplay.map(col => (
                  <TableCell key={`${col.key as string}-${rowIndex}`} className="whitespace-nowrap">
                    {col.isBoolean ? (
                      <Checkbox checked={Boolean(row[col.key as keyof DataFrameRow])} disabled className="mx-auto" />
                    ) : col.isMessage ? (
                       <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block max-w-xs truncate cursor-help">{String(row[col.key as keyof DataFrameRow] || "")}</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" align="start" className="max-w-md bg-background border text-foreground shadow-lg rounded-md p-2 break-words whitespace-pre-wrap z-50">
                            <p>{String(row[col.key as keyof DataFrameRow] || "")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      String(row[col.key as keyof DataFrameRow] ?? "N/A")
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 