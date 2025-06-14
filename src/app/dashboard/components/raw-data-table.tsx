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
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

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

  // Responsive: hide less important columns on small screens
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 500;
  const columnsToDisplay: Array<{ key: keyof DataFrameRow | string; label: string; isBoolean?: boolean; isMessage?: boolean; hideOnMobile?: boolean }> = [
    { key: "date", label: "Timestamp" },
    { key: "user", label: "User" },
    { key: "message", label: "Message", isMessage: true },
    { key: "Message Length", label: "Msg Len" },
    { key: "Conv code", label: "Conv Code" },
    { key: "Conv change", label: "New Conv?", isBoolean: true },
    { key: "Is reply", label: "Is Reply?", isBoolean: true },
    { key: "Sender change", label: "Sender Change?", isBoolean: true },
    { key: "Reply Time", label: "Reply Time (min)", hideOnMobile: true },
    { key: "Inter conv time", label: "Inter-Conv Time (min)", hideOnMobile: true },
    { key: "hour", label: "Hour", hideOnMobile: true },
    { key: "period", label: "Period", hideOnMobile: true },
  ];
  const visibleColumns = columnsToDisplay.filter(col => !(isMobile && col.hideOnMobile));

  return (
    <div className="w-full">
      {data.length > 2000 && (
        <div className="text-sm text-orange-600 mb-2">Large tables may be slow on mobile devices.</div>
      )}
      <div className="flex justify-between items-center mb-2">
        <Button onClick={toggleShowFullTable} variant="outline" size="sm">
          {showFullTable ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
          {showFullTable ? "Show Paginated" : `Show All (${data.length} rows)`}
        </Button>
        {!showFullTable && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button onClick={handlePrevPage} disabled={currentPage === 0} variant="outline" size="sm">Previous</Button>
            <Button onClick={handleNextPage} disabled={currentPage >= totalPages - 1} variant="outline" size="sm">Next</Button>
            <span className="block w-full md:w-auto text-xs md:text-sm text-center md:text-left mt-1 md:mt-0">Page {currentPage + 1} of {totalPages}</span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto border rounded-md">
        <Table className="min-w-full text-xs md:text-sm">
          <TableCaption>Raw parsed message data. {showFullTable ? `Showing all ${data.length} rows.` : `Showing ${paginatedData.length} of ${data.length} rows.`}</TableCaption>
          <TableHeader>
            <TableRow>
              {visibleColumns.map(col => (
                <TableHead key={col.key as string} className="whitespace-nowrap px-2 py-1 md:px-4 md:py-2">{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {showFullTable ? (
              <tr>
                <td colSpan={visibleColumns.length} style={{ padding: 0 }}>
                  <div style={{ height: 500, width: '100%' }}>
                    <AutoSizer disableHeight>
                      {({ width }) => (
                        <List
                          height={500}
                          width={width}
                          itemCount={data.length}
                          itemSize={48}
                          overscanCount={8}
                        >
                          {({ index, style }: { index: number; style: React.CSSProperties }) => {
                            const row = data[index];
                            return (
                              <TableRow key={index} style={style}>
                                {visibleColumns.map(col => (
                                  <TableCell key={`${col.key as string}-${index}`} className="whitespace-nowrap px-2 py-1 md:px-4 md:py-2 max-w-[120px] md:max-w-xs overflow-hidden text-ellipsis" aria-label={col.label}>
                                    {col.isBoolean ? (
                                      <Checkbox checked={Boolean(row[col.key as keyof DataFrameRow])} disabled className="mx-auto" />
                                    ) : col.isMessage ? (
                                      <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="block truncate cursor-help" style={{maxWidth: '100%'}}>{String(row[col.key as keyof DataFrameRow] || "")}</span>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" align="start" className="max-w-md bg-background border text-foreground shadow-lg rounded-md p-2 break-words whitespace-pre-wrap z-50">
                                            <p>{String(row[col.key as keyof DataFrameRow] || "")}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ) : (
                                      <span className="block truncate" style={{maxWidth: '100%'}}>{String(row[col.key as keyof DataFrameRow] ?? "N/A")}</span>
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
                          }}
                        </List>
                      )}
                    </AutoSizer>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {visibleColumns.map(col => (
                    <TableCell key={`${col.key as string}-${rowIndex}`} className="whitespace-nowrap px-2 py-1 md:px-4 md:py-2 max-w-[120px] md:max-w-xs overflow-hidden text-ellipsis" aria-label={col.label}>
                      {col.isBoolean ? (
                        <Checkbox checked={Boolean(row[col.key as keyof DataFrameRow])} disabled className="mx-auto" />
                      ) : col.isMessage ? (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate cursor-help" style={{maxWidth: '100%'}}>{String(row[col.key as keyof DataFrameRow] || "")}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start" className="max-w-md bg-background border text-foreground shadow-lg rounded-md p-2 break-words whitespace-pre-wrap z-50">
                              <p>{String(row[col.key as keyof DataFrameRow] || "")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="block truncate" style={{maxWidth: '100%'}}>{String(row[col.key as keyof DataFrameRow] ?? "N/A")}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 