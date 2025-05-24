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

interface WordUsageData {
  total_words: number
  word_diversity: number
  words_per_message: number
  word_counts: Array<{
    word: string
    count: number
  }>
}

interface WordUsageTableProps {
  data: WordUsageData
}

export function WordUsageTable({ data }: WordUsageTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Word Usage Analysis</CardTitle>
        <CardDescription>
          Total Words: {data.total_words} | Word Diversity: {data.word_diversity} | Words per Message: {data.words_per_message.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.word_counts.map((word) => (
              <TableRow key={word.word}>
                <TableCell className="font-medium">{word.word}</TableCell>
                <TableCell className="text-right">{word.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 