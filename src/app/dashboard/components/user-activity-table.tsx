"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserStat } from "@/lib/analysis-engine";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserActivityTableProps {
  userStats: UserStat[];
  totalOverallMessages: number;
}

export function UserActivityTable({ userStats, totalOverallMessages }: UserActivityTableProps) {
  if (!userStats || userStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          <CardDescription>
            No user activity data available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">User</TableHead>
            <TableHead className="text-right">Messages</TableHead>
            <TableHead className="text-right">% of Total</TableHead>
            <TableHead className="text-right">Words</TableHead>
            <TableHead className="text-right">Longest Msg (words)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userStats.map((stat) => {
            const messagePercentage = totalOverallMessages > 0 
              ? ((stat.message_count / totalOverallMessages) * 100).toFixed(1) 
              : "0.0";
            return (
              <TableRow key={stat.user}>
                <TableCell className="font-medium truncate max-w-[200px]">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="cursor-default">{stat.user}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{stat.user}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">{stat.message_count.toLocaleString()}</TableCell>
                <TableCell className="text-right">{messagePercentage}%</TableCell>
                <TableCell className="text-right">{stat.word_count.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {stat.biggest_message && stat.biggest_message.length > 0 ? (
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="cursor-help">{stat.biggest_message.length.toLocaleString()}</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs break-words">
                                <p className="text-xs text-muted-foreground">Longest Message:</p>
                                <p>{stat.biggest_message.text}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
} 