import React from "react"
import { ArrowUpDown } from "lucide-react"
import type { QueryObserverResult, RefetchOptions } from "@tanstack/react-query"
import { endOfMonth, format, getDaysInMonth, intlFormat, subDays, subMonths, subYears } from "date-fns"

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
import type { Regional } from "@/types"
import { useSelectBranch } from "@/hooks/use-select-branch"
import { useSelectSubbranch } from "@/hooks/use-select-subbranch"
import { useSelectCluster } from "@/hooks/use-select-cluster"
import { useSelectKabupaten } from "@/hooks/use-select-kabupaten"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Params = {
    data?: Regional[];
    date?: Date;
    latestUpdatedData: number;
    isLoading?: boolean;
    title: string;
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<Regional[], Error>>
}

export const DataTable = ({ latestUpdatedData: daysBehind, refetch, title, data, isLoading, date }: Params) => {
    const { branch: selectedBranch } = useSelectBranch()
    const { subbranch: selectedSubbranch } = useSelectSubbranch()
    const { cluster: selectedCluster } = useSelectCluster()
    const { kabupaten: selectedKabupaten } = useSelectKabupaten()

    const selectedDate = date ? date : subDays(new Date(), daysBehind) // today - 2 days
    const lastDayOfSelectedMonth = endOfMonth(selectedDate);
    const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

    // Last days of months
    // const daysInCurrMonth = isEndOfMonth ? getDaysInMonth(compactDate) : getDaysInMonth(selectedDate)
    const daysInCurrMonth = getDaysInMonth(selectedDate)

    const currDate = parseInt(format(selectedDate, 'd'))

    const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;
    const endOfPrevMonth = isEndOfMonth ? endOfMonth(subMonths(selectedDate, 1)) : subMonths(selectedDate, 1);
    const endOfPrevYearSameMonth = isEndOfMonth ? endOfMonth(subYears(selectedDate, 1)) : subYears(selectedDate, 1);

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

    const filteredRevenues = data.map(regional => ({
        ...regional,
        branches: regional.branches.filter((branch) => !selectedBranch || branch.name === selectedBranch)
            .map((branch) => ({
                ...branch,
                subbranches: branch.subbranches
                    .filter((subbranch) => !selectedSubbranch || subbranch.name === selectedSubbranch)
                    .map((subbranch) => ({
                        ...subbranch,
                        clusters: subbranch.clusters
                            .filter((cluster) => !selectedCluster || cluster.name === selectedCluster)
                            .map((cluster) => ({
                                ...cluster,
                                kabupatens: cluster.kabupatens
                                    .filter((kabupaten) => !selectedKabupaten || kabupaten.name === selectedKabupaten)
                            }))
                    }))
            }))
    }))


    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
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
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">{intlFormat(endOfCurrMonth, { dateStyle: "medium" }, { locale: "id-ID" })}</TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">Gap To Target</TableHead>
                            {/* <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">YtD {selectedDate.getFullYear()}</TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">YtD {selectedDate.getFullYear() - 1}</TableHead> */}
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
                                    MoM
                                </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                <div className="flex items-center justify-center">
                                    Abs
                                </div>
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
                                Regional
                            </TableCell>
                        </TableRow>
                        {filteredRevenues.map((regional, regionIndex) => (
                            <React.Fragment key={regionIndex}>
                                <TableRow>
                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-start font-normal text-theme-xs dark:text-white dark:border-gray-800 ">
                                        {regional.name}
                                    </TableCell>
                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                        <span className='text-end'>{formatToBillion(regional.currMonthTarget)}</span>
                                    </TableCell>
                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                        <span className='text-end'>{formatToBillion(regional.currMonthRevenue)}</span>
                                    </TableCell>
                                    <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums", regional.currMonthRevenue - regional.currMonthTarget > 0 ? 'text-green-500' : 'text-rose-500')}>
                                        <span className='text-end'>{formatToBillion(regional.currMonthRevenue - regional.currMonthTarget)}</span>
                                    </TableCell>
                                    {/* <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                        <span>{formatToBillion(regional.currYtdRevenue)}</span>
                                    </TableCell>
                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                        <span>{formatToBillion(regional.prevYtdRevenue)}</span>
                                    </TableCell> */}
                                    {/* ACH FM */}
                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                        <span className={cn(getAchGrowthColor(regional.currMonthRevenue / regional.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage(regional.currMonthRevenue / regional.currMonthTarget)}
                                        </span>
                                    </TableCell>
                                    {/* ACH DDR */}
                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                        <span className={cn(getAchGrowthColor(((regional.currMonthRevenue / currDate) * daysInCurrMonth) / regional.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage(((regional.currMonthRevenue / currDate) * daysInCurrMonth) / regional.currMonthTarget)}
                                        </span>
                                    </TableCell>
                                    {/* MoM */}
                                    <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                        <span className={cn(getGrowthColor(((regional.currMonthRevenue / regional.prevMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((regional.currMonthRevenue / regional.prevMonthRevenue) - 1)}
                                        </span>
                                    </TableCell>
                                    <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                        <span className={cn(regional.currMonthRevenue - regional.prevMonthRevenue > 0 ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToBillion(regional.currMonthRevenue - regional.prevMonthRevenue)}
                                        </span>
                                    </TableCell>
                                    {/* YoY */}
                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                        <span className={cn(getGrowthColor(((regional.currMonthRevenue / regional.prevYearCurrMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage(((regional.currMonthRevenue / regional.prevYearCurrMonthRevenue) - 1))}
                                        </span>
                                    </TableCell>
                                    {/* YtD */}
                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                        <span className={cn(getGrowthColor(((regional.currYtdRevenue / regional.prevYtdRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((regional.currYtdRevenue / regional.prevYtdRevenue) - 1)}
                                        </span>
                                    </TableCell>
                                </TableRow>

                                {/* BRANCH */}
                                <TableRow>
                                    <TableCell colSpan={14} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        Branch
                                    </TableCell>
                                </TableRow>
                                {regional.branches.map((branch, branchIndex) => (
                                    <React.Fragment key={`branch-${branchIndex}`}>
                                        <TableRow>
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-start font-normal text-theme-xs dark:text-white dark:border-gray-800 ">
                                                {branch.name}
                                            </TableCell>
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span className='text-end'>{formatToBillion(branch.currMonthTarget)}</span>
                                            </TableCell>
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span className='text-end'>{formatToBillion(branch.currMonthRevenue)}</span>
                                            </TableCell>
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums", branch.currMonthRevenue - branch.currMonthTarget > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                <span className='text-end'>{formatToBillion(branch.currMonthRevenue - branch.currMonthTarget)}</span>
                                            </TableCell>
                                            {/* <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span>{formatToBillion(branch.currYtdRevenue)}</span>
                                            </TableCell>
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span>{formatToBillion(branch.prevYtdRevenue)}</span>
                                            </TableCell> */}
                                            {/* ACH FM */}
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span className={cn(getAchGrowthColor(branch.currMonthRevenue / branch.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage(branch.currMonthRevenue / branch.currMonthTarget)}
                                                </span>
                                            </TableCell>
                                            {/* ACH DDR */}
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span className={cn(getAchGrowthColor(((branch.currMonthRevenue / currDate) * daysInCurrMonth) / branch.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage(((branch.currMonthRevenue / currDate) * daysInCurrMonth) / branch.currMonthTarget)}
                                                </span>
                                            </TableCell>
                                            {/* MoM */}
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                                <span className={cn(getGrowthColor(((branch.currMonthRevenue / branch.prevMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((branch.currMonthRevenue / branch.prevMonthRevenue) - 1)}
                                                </span>
                                            </TableCell>
                                            <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                                <span className={cn(branch.currMonthRevenue - branch.prevMonthRevenue > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToBillion(branch.currMonthRevenue - branch.prevMonthRevenue)}
                                                </span>
                                            </TableCell>
                                            {/* YoY */}
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span className={cn(getGrowthColor(((branch.currMonthRevenue / branch.prevYearCurrMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage(((branch.currMonthRevenue / branch.prevYearCurrMonthRevenue) - 1))}
                                                </span>
                                            </TableCell>
                                            {/* YtD */}
                                            <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                <span className={cn(getGrowthColor(((branch.currYtdRevenue / branch.prevYtdRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((branch.currYtdRevenue / branch.prevYtdRevenue) - 1)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}

                                {/* SUBBRANCH */}
                                <TableRow>
                                    <TableCell colSpan={14} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        Subbranch
                                    </TableCell>
                                </TableRow>
                                {regional.branches.map((branch: any, branchIndex: number) =>
                                    branch.subbranches.map((subbranch: any, subbranchIndex: number) =>
                                        <React.Fragment key={`branch-${regionIndex}_${branchIndex}_${subbranchIndex}`}>
                                            <TableRow>
                                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-start font-normal text-theme-xs dark:text-white dark:border-gray-800 ">
                                                    {subbranch.name}
                                                </TableCell>
                                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                    <span className='text-end'>{formatToBillion(subbranch.currMonthTarget)}</span>
                                                </TableCell>
                                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                    <span className='text-end'>{formatToBillion(subbranch.currMonthRevenue)}</span>
                                                </TableCell>
                                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums", subbranch.currMonthRevenue - subbranch.currMonthTarget > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                    <span className='text-end'>{formatToBillion(subbranch.currMonthRevenue - subbranch.currMonthTarget)}</span>
                                                </TableCell>
                                                {/* <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                    <span>{formatToBillion(subbranch.currYtdRevenue)}</span>
                                                </TableCell>
                                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                    <span>{formatToBillion(subbranch.prevYtdRevenue)}</span>
                                                </TableCell> */}
                                                {/* ACH FM */}
                                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                    <span className={cn(getAchGrowthColor(subbranch.currMonthRevenue / subbranch.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage(subbranch.currMonthRevenue / subbranch.currMonthTarget)}
                                                    </span>
                                                </TableCell>
                                                {/* ACH DDR */}
                                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                    <span className={cn(getAchGrowthColor(((subbranch.currMonthRevenue / currDate) * daysInCurrMonth) / subbranch.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage(((subbranch.currMonthRevenue / currDate) * daysInCurrMonth) / subbranch.currMonthTarget)}
                                                    </span>
                                                </TableCell>
                                                {/* MoM */}
                                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                                    <span className={cn(getGrowthColor(((subbranch.currMonthRevenue / subbranch.prevMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((subbranch.currMonthRevenue / subbranch.prevMonthRevenue) - 1)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                                    <span className={cn(subbranch.currMonthRevenue - subbranch.prevMonthRevenue > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToBillion(subbranch.currMonthRevenue - subbranch.prevMonthRevenue)}
                                                    </span>
                                                </TableCell>
                                                {/* YoY */}
                                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                    <span className={cn(getGrowthColor(((subbranch.currMonthRevenue / subbranch.prevYearCurrMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage(((subbranch.currMonthRevenue / subbranch.prevYearCurrMonthRevenue) - 1))}
                                                    </span>
                                                </TableCell>
                                                {/* YtD */}
                                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                    <span className={cn(getGrowthColor(((subbranch.currYtdRevenue / subbranch.prevYtdRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((subbranch.currYtdRevenue / subbranch.prevYtdRevenue) - 1)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}

                                {/* CLUSTER */}
                                <TableRow>
                                    <TableCell colSpan={14} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        Cluster
                                    </TableCell>
                                </TableRow>
                                {regional.branches.map((branch: any, branchIndex: number) =>
                                    branch.subbranches.map((subbranch: any, subbranchIndex: number) =>
                                        subbranch.clusters.map((cluster: any, clusterIndex: number) => (
                                            <React.Fragment key={`branch-${regionIndex}_${branchIndex}_${subbranchIndex}_${clusterIndex}`}>
                                                <TableRow>
                                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-start font-normal text-theme-xs dark:text-white dark:border-gray-800 ">
                                                        {cluster.name}
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                        <span className='text-end'>{formatToBillion(cluster.currMonthTarget)}</span>
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                        <span className='text-end'>{formatToBillion(cluster.currMonthRevenue)}</span>
                                                    </TableCell>
                                                    <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums", cluster.currMonthRevenue - cluster.currMonthTarget > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                        <span className='text-end'>{formatToBillion(cluster.currMonthRevenue - cluster.currMonthTarget)}</span>
                                                    </TableCell>
                                                    {/* <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                        <span>{formatToBillion(cluster.currYtdRevenue)}</span>
                                                    </TableCell>
                                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                        <span>{formatToBillion(cluster.prevYtdRevenue)}</span>
                                                    </TableCell> */}
                                                    {/* ACH FM */}
                                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                        <span className={cn(getAchGrowthColor(cluster.currMonthRevenue / cluster.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage(cluster.currMonthRevenue / cluster.currMonthTarget)}
                                                        </span>
                                                    </TableCell>
                                                    {/* ACH DDR */}
                                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                        <span className={cn(getAchGrowthColor(((cluster.currMonthRevenue / currDate) * daysInCurrMonth) / cluster.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage(((cluster.currMonthRevenue / currDate) * daysInCurrMonth) / cluster.currMonthTarget)}
                                                        </span>
                                                    </TableCell>
                                                    {/* MoM */}
                                                    <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                                        <span className={cn(getGrowthColor(((cluster.currMonthRevenue / cluster.prevMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((cluster.currMonthRevenue / cluster.prevMonthRevenue) - 1)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                                        <span className={cn(cluster.currMonthRevenue - cluster.prevMonthRevenue > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToBillion(cluster.currMonthRevenue - cluster.prevMonthRevenue)}
                                                        </span>
                                                    </TableCell>
                                                    {/* YoY */}
                                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                        <span className={cn(getGrowthColor(((cluster.currMonthRevenue / cluster.prevYearCurrMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage(((cluster.currMonthRevenue / cluster.prevYearCurrMonthRevenue) - 1))}
                                                        </span>
                                                    </TableCell>
                                                    {/* YtD */}
                                                    <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                        <span className={cn(getGrowthColor(((cluster.currYtdRevenue / cluster.prevYtdRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((cluster.currYtdRevenue / cluster.prevYtdRevenue) - 1)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))))}

                                {/* KABUPATENS */}
                                <TableRow>
                                    <TableCell colSpan={14} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        Kabupaten
                                    </TableCell>
                                </TableRow>
                                {regional.branches.map((branch: any, branchIndex: number) =>
                                    branch.subbranches.map((subbranch: any, subbranchIndex: number) =>
                                        subbranch.clusters.map((cluster: any, clusterIndex: number) =>
                                            cluster.kabupatens.map((kabupaten: any, kabupatenIndex: number) => (
                                                <React.Fragment key={`branch-${regionIndex}_${branchIndex}_${subbranchIndex}_${clusterIndex}_${kabupatenIndex}`}>
                                                    <TableRow>
                                                        <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-start font-normal text-theme-xs dark:text-white dark:border-gray-800 ">
                                                            {kabupaten.name}
                                                        </TableCell>
                                                        <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                            <span className='text-end'>{formatToBillion(kabupaten.currMonthTarget)}</span>
                                                        </TableCell>
                                                        <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                            <span className='text-end'>{formatToBillion(kabupaten.currMonthRevenue)}</span>
                                                        </TableCell>
                                                        <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums", kabupaten.currMonthRevenue - kabupaten.currMonthTarget > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                            <span className='text-end'>{formatToBillion(kabupaten.currMonthRevenue - kabupaten.currMonthTarget)}</span>
                                                        </TableCell>
                                                        {/* <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                            <span>{formatToBillion(kabupaten.currYtdRevenue)}</span>
                                                        </TableCell>
                                                        <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                            <span>{formatToBillion(kabupaten.prevYtdRevenue)}</span>
                                                        </TableCell> */}
                                                        {/* ACH FM */}
                                                        <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                            <span className={cn(getAchGrowthColor(kabupaten.currMonthRevenue / kabupaten.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                                                {formatToPercentage(kabupaten.currMonthRevenue / kabupaten.currMonthTarget)}
                                                            </span>
                                                        </TableCell>
                                                        {/* ACH DDR */}
                                                        <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                            <span className={cn(getAchGrowthColor(((kabupaten.currMonthRevenue / currDate) * daysInCurrMonth) / kabupaten.currMonthTarget * 100) ? 'text-green-500' : 'text-rose-500')}>
                                                                {formatToPercentage(((kabupaten.currMonthRevenue / currDate) * daysInCurrMonth) / kabupaten.currMonthTarget)}
                                                            </span>
                                                        </TableCell>
                                                        {/* MoM */}
                                                        <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                                            <span className={cn(getGrowthColor(((kabupaten.currMonthRevenue / kabupaten.prevMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                                {formatToPercentage((kabupaten.currMonthRevenue / kabupaten.prevMonthRevenue) - 1)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs font-medium dark:border-gray-800")}>
                                                            <span className={cn(kabupaten.currMonthRevenue - kabupaten.prevMonthRevenue > 0 ? 'text-green-500' : 'text-rose-500')}>
                                                                {formatToBillion(kabupaten.currMonthRevenue - kabupaten.prevMonthRevenue)}
                                                            </span>
                                                        </TableCell>
                                                        {/* YoY */}
                                                        <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                            <span className={cn(getGrowthColor(((kabupaten.currMonthRevenue / kabupaten.prevYearCurrMonthRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                                {formatToPercentage(((kabupaten.currMonthRevenue / kabupaten.prevYearCurrMonthRevenue) - 1))}
                                                            </span>
                                                        </TableCell>
                                                        {/* YtD */}
                                                        <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-end text-theme-xs dark:text-white dark:border-gray-800 !tabular-nums">
                                                            <span className={cn(getGrowthColor(((kabupaten.currYtdRevenue / kabupaten.prevYtdRevenue) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                                {formatToPercentage((kabupaten.currYtdRevenue / kabupaten.prevYtdRevenue) - 1)}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                </React.Fragment>
                                            ))
                                        )))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function formatToBillion(val: number) {
    return val.toLocaleString('id-ID', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    })
}

function formatToPercentage(val: number) {
    return val.toLocaleString('id-ID', {
        style: 'percent',
        maximumFractionDigits: 2
    })
}

export const getGrowthColor = (value: number) => {
    if (value > 0) {
        return true
    }

    return false
};

export const getAchGrowthColor = (value: number) => {
    if (value >= 100) {
        return true
    }

    return false
};