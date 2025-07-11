import React from "react"
import type { QueryObserverResult, RefetchOptions } from "@tanstack/react-query"
import { endOfMonth, format, intlFormat, subDays } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from "@/components/ui/skeleton"

import { cn, exportToExcel, formatToBillion, getAchGrowthColor, getGrowthColor } from "@/lib/utils"
import { Download } from "lucide-react"

type Params = {
    data?: Revenue[];
    date?: Date;
    latestUpdatedData: number;
    isLoading?: boolean;
    title: string;
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<Revenue[], Error>>
}

export function DataTable({ latestUpdatedData: daysBehind, refetch, title, data, isLoading, date }: Params) {
    const selectedDate = date ? date : subDays(new Date(), daysBehind) // today - 2 days
    const lastDayOfSelectedMonth = endOfMonth(selectedDate);
    const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

    const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;

    if (isLoading) {
        return (
            <div className="w-[1104px] overflow-x-auto remove-scrollbar">
                <div className="w-full">
                    <div className="flex flex-col space-y-3">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-[275px] w-[1104px] rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div>
                <p>Not Found</p>
                <Button onClick={() => refetch()}>Reload</Button>
            </div>
        )
    }

    const formattedData = data.map(item => ({
        territory: item.name,
        target: item.target_trx,
        rev: item.trx,
        gap: item.gap_to_target,
        achFm: item.ach_target_fm,
        drr: item.drr,
        mom: item.mom,
        abs: item.absolut,
        yoy: item.yoy,
        ytd: item.ytd,
        qoq: ''
    }))

    const handleDownload = async () => {
        exportToExcel(formattedData, format(selectedDate, 'd MMM'), `trx_new_sales_byu_${format(selectedDate, 'yyyyMM')}`)
    }

    return (
        <Card>
            <CardHeader className="flex items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <Button variant='outline' size='sm' className="cursor-pointer" onClick={handleDownload}>
                    <Download className="size-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>A list of territories and their revenues</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead rowSpan={2} className="font-medium border-r dark:border-gray-700 text-white text-center bg-rose-700">Territory</TableHead>
                            <TableHead colSpan={12} className="font-medium border bg-blue-500 text-gray-50 text-center dark:text-white dark:border-gray-800">{title}</TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">Target</TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">{intlFormat(endOfCurrMonth, { month: 'short', day: 'numeric' }, { locale: "id-ID" })}</TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                Gap
                            </TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                <div className="flex items-center justify-center">
                                    Ach FM
                                </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                <div className="flex items-center justify-center">
                                    Ach DRR
                                </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                <div className="flex items-center justify-center">
                                    MoM(%)
                                </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                Abs
                            </TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                <div className="flex items-center justify-center">
                                    YoY
                                </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                <div className="flex items-center justify-center">
                                    YtD
                                </div>
                            </TableHead>

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={14} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03]">
                                REGION
                            </TableCell>
                        </TableRow>

                        {data.map((item, index) => {
                            const isHeaderRow = ['REGIONAL', 'BRANCH', 'SUBBRANCH', 'CLUSTER', 'KABUPATEN'].includes(item.name?.toUpperCase()!);

                            return (
                                <TableRow key={`${item.name}-${index}`}>
                                    <TableCell
                                        colSpan={isHeaderRow ? 14 : 1}
                                        className={cn(
                                            "px-1 py-0.5 border-r last:border-r-0 text-start",
                                            isHeaderRow ? 'font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03]' : 'font-normal dark:text-white dark:border-gray-800'
                                        )}
                                    >
                                        {item.name}
                                    </TableCell>

                                    {!isHeaderRow && (
                                        <>
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span className='text-end'>{formatToBillion(item.target_trx)}</span>
                                            </TableCell>
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span className='text-end'>{formatToBillion(item.trx)}</span>
                                            </TableCell>
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end dark:text-white dark:border-gray-800 !tabular-nums", item.gap_to_target > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                <span>{formatToBillion(item.gap_to_target)}</span>
                                            </TableCell>
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums", getAchGrowthColor(item.ach_target_fm) ? 'text-green-500' : 'text-rose-500')}>
                                                {item.ach_target_fm}
                                            </TableCell>
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums", getAchGrowthColor(item.drr) ? 'text-green-500' : 'text-rose-500')}>
                                                {item.drr}
                                            </TableCell>
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800 tabular-nums", getGrowthColor(item.mom) ? 'text-green-500' : 'text-rose-500')}>
                                                {item.mom}
                                            </TableCell>
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end dark:text-white dark:border-gray-800 !tabular-nums", item.absolut > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                <span className='text-end'>{formatToBillion(item.absolut)}</span>
                                            </TableCell>
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums", getGrowthColor(item.yoy) ? 'text-green-500' : 'text-rose-500')}>
                                                {item.yoy}
                                            </TableCell>
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums", getGrowthColor(item.ytd) ? 'text-green-500' : 'text-rose-500')}>
                                                {item.ytd}
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            );
                        })}

                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function formatToPercentage(val: number) {
    return val.toLocaleString('id-ID', {
        style: 'percent',
        maximumFractionDigits: 2
    })
}

type Revenue = {
    name: string | null;
    target_trx: number;
    trx: number;
    ach_target_fm: string;
    drr: string;
    gap_to_target: number;
    mom: string;
    absolut: number;
    yoy: string;
    ytd: string;
}