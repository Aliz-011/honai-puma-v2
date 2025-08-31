import React from "react"


import { endOfMonth, format, getDaysInMonth, intlFormat, subDays, subMonths, subYears } from "date-fns"

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
import type { RegionEntity } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function formatToPercentage(number: number) {
    return (number).toLocaleString('id-ID', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: 'percent'
    })
}

function formatToBillion(number: number) {
    return (number).toLocaleString("id-ID", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    })
}

const getGrowthColor = (value: number) => {
    if (value > 0) {
        return true
    }

    return false
};

const getAchGrowthColor = (value: number) => {
    if (value >= 100) {
        return true
    }

    return false
};

export const DataTable = ({ isLoading, data, title, date }: {
    isLoading?: boolean;
    data?: RegionEntity[];
    title: string;
    date?: Date
}) => {

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
            </div>
        )
    }

    const selectedDate = date ? date : subDays(new Date(), 2)
    const closingDate = endOfMonth(selectedDate)
    const isEndOfMonth = selectedDate.getDate() === closingDate.getDate();
    const endOfCurrMonth = isEndOfMonth ? closingDate : selectedDate
    const isCurrMonth = format(selectedDate, 'MM') === format(new Date(), 'MM')
    const multidimDay = isCurrMonth ? format(selectedDate, 'yyyy-MM-dd') : format(closingDate, 'yyyy-MM-dd')

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>A list of territories and their revenues</TableCaption>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                            <TableCell rowSpan={3} className="whitespace-nowrap font-medium border-r dark:border-gray-700 text-white text-center bg-rose-600">
                                &nbsp;
                            </TableCell>
                            <TableCell rowSpan={3} className="whitespace-nowrap font-medium border-r dark:border-gray-700 text-white text-center bg-rose-600">
                                Territory
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={4} className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                REVENUE
                            </TableCell>
                            <TableCell colSpan={3} className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM DAILY REVENUE
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                FM M-3
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                FM M-2
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                FM M-1
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MTD
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM <br />
                                <span className="text-[10px]">(MTD vs M-1)</span>
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM-1 <br />
                                <span className="text-[10px]">(M-1 vs M-2)</span>
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM-2 <br />
                                <span className="text-[10px]">(M-2 vs M-3)</span>
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 text-theme-sm dark:text-white dark:border-gray-800 dark:bg-white/[0.03]">
                                REGION
                            </TableCell>
                        </TableRow>
                        {data.map((item, index) => (
                            <React.Fragment key={index}>
                                <TableRow>
                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                        &nbsp;
                                    </TableCell>
                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                        {item.name}
                                    </TableCell>
                                    {/* M-3 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className="tabular-nums">
                                            {formatToBillion(Number(item.revM3))}
                                        </span>
                                    </TableCell>
                                    {/* M-2 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className="tabular-nums">
                                            {formatToBillion(Number(item.revM2))}
                                        </span>
                                    </TableCell>
                                    {/* M-1 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className="tabular-nums">
                                            {formatToBillion(Number(item.revM1))}
                                        </span>
                                    </TableCell>
                                    {/* MTD */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className="tabular-nums">
                                            {formatToBillion(Number(item.revMtd))}
                                        </span>
                                    </TableCell>
                                    {/* MOM */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className={cn(getGrowthColor((Number(item.drMtd) / Number(item.drM1) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((Number(item.drMtd) / Number(item.drM1) - 1))}
                                        </span>
                                    </TableCell>
                                    {/* MOM1 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className={cn(getGrowthColor((Number(item.drM1) / Number(item.drM2) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((Number(item.drM1) / Number(item.drM2) - 1))}
                                        </span>
                                    </TableCell>
                                    {/* MOM2 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                        <span className={cn(getGrowthColor((Number(item.drM2) / Number(item.drM3) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((Number(item.drM2) / Number(item.drM3) - 1))}
                                        </span>
                                    </TableCell>
                                </TableRow>

                                {/* BRANCH */}
                                <TableRow>
                                    <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        BRANCH
                                    </TableCell>
                                </TableRow>
                                {item.branches.map((branch, branchIndex) => (
                                    <React.Fragment key={`branch-${branchIndex}-${index}`}>
                                        <TableRow>
                                            <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                {branch.name}
                                            </TableCell>
                                            {/* M-3 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(Number(branch.revM3))}
                                                </span>
                                            </TableCell>
                                            {/* M-2 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(Number(branch.revM2))}
                                                </span>
                                            </TableCell>
                                            {/* M-1 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(Number(branch.revM1))}
                                                </span>
                                            </TableCell>
                                            {/* MTD */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(Number(branch.revMtd))}
                                                </span>
                                            </TableCell>
                                            {/* MOM */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className={cn(getGrowthColor((Number(branch.drMtd) / Number(branch.drM1) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((Number(branch.drMtd) / Number(branch.drM1) - 1))}
                                                </span>
                                            </TableCell>
                                            {/* MOM1 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className={cn(getGrowthColor((Number(branch.drM1) / Number(branch.drM2) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((Number(branch.drM1) / Number(branch.drM2) - 1))}
                                                </span>
                                            </TableCell>
                                            {/* MOM2 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                                <span className={cn(getGrowthColor((Number(branch.drM2) / Number(branch.drM3) - 1)) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((Number(branch.drM2) / Number(branch.drM3) - 1))}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}

                                {/* WOK */}
                                <TableRow>
                                    <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        WOK
                                    </TableCell>
                                </TableRow>
                                {item.branches.map((branch, branchIndex) =>
                                    branch.woks.map((wok, wokIndex) => (
                                        <React.Fragment key={`wok-${wokIndex}-${branchIndex}-${index}`}>
                                            <TableRow>
                                                <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                    {branch.name}
                                                </TableCell>
                                                <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                    {wok.name}
                                                </TableCell>
                                                {/* M-3 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(Number(wok.revM3))}
                                                    </span>
                                                </TableCell>
                                                {/* M-2 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(Number(wok.revM2))}
                                                    </span>
                                                </TableCell>
                                                {/* M-1 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(Number(wok.revM1))}
                                                    </span>
                                                </TableCell>
                                                {/* MTD */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(Number(wok.revMtd))}
                                                    </span>
                                                </TableCell>
                                                {/* MOM */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className={cn(getGrowthColor((Number(wok.drMtd) / Number(wok.drM1)) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((Number(wok.drMtd) / Number(wok.drM1) - 1))}
                                                    </span>
                                                </TableCell>
                                                {/* MOM1 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className={cn(getGrowthColor((Number(wok.drM1) / Number(wok.drM2)) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((Number(wok.drM1) / Number(wok.drM2) - 1))}
                                                    </span>
                                                </TableCell>
                                                {/* MOM2 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                                    <span className={cn(getGrowthColor((Number(wok.drM2) / Number(wok.drM3)) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((Number(wok.drM2) / Number(wok.drM3) - 1))}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))
                                )}

                                {/* STO */}
                                <TableRow>
                                    <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        STO
                                    </TableCell>
                                </TableRow>
                                {item.branches.map((branch, branchIndex) =>
                                    branch.woks.map((wok, wokIndex) =>
                                        wok.stos.map((sto, stoIndex) => (
                                            <React.Fragment key={`sto-${stoIndex}-${wokIndex}-${branchIndex}-${index}`}>
                                                <TableRow>
                                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                        {wok.name}
                                                    </TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                        {sto.name}
                                                    </TableCell>
                                                    {/* M-3 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(Number(sto.revM3))}
                                                        </span>
                                                    </TableCell>
                                                    {/* M-2 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(Number(sto.revM2))}
                                                        </span>
                                                    </TableCell>
                                                    {/* M-1 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(Number(sto.revM1))}
                                                        </span>
                                                    </TableCell>
                                                    {/* MTD */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(Number(sto.revMtd))}
                                                        </span>
                                                    </TableCell>
                                                    {/* MOM */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className={cn(getGrowthColor((Number(sto.drMtd) / Number(sto.drM1)) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((Number(sto.drMtd) / Number(sto.drM1) - 1))}
                                                        </span>
                                                    </TableCell>
                                                    {/* MOM1 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className={cn(getGrowthColor((Number(sto.drM1) / Number(sto.drM2)) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((Number(sto.drM1) / Number(sto.drM2) - 1))}
                                                        </span>
                                                    </TableCell>
                                                    {/* MOM2 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                                        <span className={cn(getGrowthColor((Number(sto.drM2) / Number(sto.drM3)) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((Number(sto.drM2) / Number(sto.drM3) - 1))}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        )))
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export const DataTableARPU = ({ isLoading, data, title, date }: {
    isLoading?: boolean;
    data?: RegionEntity[];
    title: string;
    date?: Date
}) => {

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
            </div>
        )
    }

    const selectedDate = date ? date : subDays(new Date(), 2)
    const closingDate = endOfMonth(selectedDate)
    const isEndOfMonth = selectedDate.getDate() === closingDate.getDate();
    const endOfCurrMonth = isEndOfMonth ? closingDate : selectedDate
    const isCurrMonth = format(selectedDate, 'MM') === format(new Date(), 'MM')
    const multidimDay = isCurrMonth ? format(selectedDate, 'yyyy-MM-dd') : format(closingDate, 'yyyy-MM-dd')

    const today = parseInt(format(selectedDate, 'd'));
    const daysInCurrMonth = getDaysInMonth(selectedDate)
    const daysInPrevMonth = getDaysInMonth(subMonths(selectedDate, 1))
    const daysInPrevMonth2 = getDaysInMonth(subMonths(selectedDate, 2))
    const daysInPrevMonth3 = getDaysInMonth(subMonths(selectedDate, 3))

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>A list of territories and their revenues</TableCaption>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                            <TableHead rowSpan={3} className="whitespace-nowrap font-medium border-r dark:border-gray-700 text-white text-center bg-rose-600">
                                &nbsp;
                            </TableHead>
                            <TableHead rowSpan={3} className="whitespace-nowrap font-medium border-r dark:border-gray-700 text-white text-center bg-rose-600">
                                Territory
                            </TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead colSpan={4} className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                ARPU
                            </TableHead>
                            <TableHead colSpan={3} className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM DAILY ARPU
                            </TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                FM M-3
                            </TableHead>
                            <TableHead className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                FM M-2
                            </TableHead>
                            <TableHead className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                FM M-1
                            </TableHead>
                            <TableHead className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MTD
                            </TableHead>
                            <TableHead className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM <br />
                                <span className="text-[10px]">(MTD vs M-1)</span>
                            </TableHead>
                            <TableHead className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM-1 <br />
                                <span className="text-[10px]">(M-1 vs M-2)</span>
                            </TableHead>
                            <TableHead className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM-2 <br />
                                <span className="text-[10px]">(M-2 vs M-3)</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 text-theme-sm dark:text-white dark:border-gray-800 dark:bg-white/[0.03]">
                                REGION
                            </TableCell>
                        </TableRow>
                        {data.map((item, index) => (
                            <React.Fragment key={index}>
                                <TableRow>
                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                        &nbsp;
                                    </TableCell>
                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                        {item.name}
                                    </TableCell>
                                    {/* M-3 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        {formatToBillion(Number(item.arpuM3))}
                                    </TableCell>
                                    {/* M-2 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        {formatToBillion(Number(item.arpuM2))}
                                    </TableCell>
                                    {/* M-1 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        {formatToBillion(Number(item.arpuM1))}
                                    </TableCell>
                                    {/* MTD */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        {formatToBillion(Number(item.arpu))}
                                    </TableCell>
                                    {/* MOM */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className={cn(getGrowthColor((item.revMtd / item.subs / today) / (item.revM1 / item.subsM1 / daysInPrevMonth) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((item.revMtd / item.subs / today) / (item.revM1 / item.subsM1 / daysInPrevMonth) - 1)}
                                        </span>
                                    </TableCell>
                                    {/* MOM1 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className={cn(getGrowthColor((item.revM1 / item.subsM1 / daysInPrevMonth) / (item.revM2 / item.subsM2 / daysInPrevMonth2) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((item.revM1 / item.subsM1 / daysInPrevMonth) / (item.revM2 / item.subsM2 / daysInPrevMonth2) - 1)}
                                        </span>
                                    </TableCell>
                                    {/* MOM2 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                        <span className={cn(getGrowthColor((item.revM2 / item.subsM2 / daysInPrevMonth2) / (item.revM3 / item.subsM3 / daysInPrevMonth3) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((item.revM2 / item.subsM2 / daysInPrevMonth2) / (item.revM3 / item.subsM3 / daysInPrevMonth3) - 1)}
                                        </span>
                                    </TableCell>
                                </TableRow>

                                {/* BRANCH */}
                                <TableRow>
                                    <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        BRANCH
                                    </TableCell>
                                </TableRow>
                                {item.branches.map((branch, branchIndex) => (
                                    <React.Fragment key={`branch-${branchIndex}-${index}`}>
                                        <TableRow>
                                            <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                {branch.name}
                                            </TableCell>
                                            {/* M-3 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(Number(branch.arpuM3))}
                                                </span>
                                            </TableCell>
                                            {/* M-2 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(Number(branch.arpuM2))}
                                                </span>
                                            </TableCell>
                                            {/* M-1 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(Number(branch.arpuM1))}
                                                </span>
                                            </TableCell>
                                            {/* MTD */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(Number(branch.arpu))}
                                                </span>
                                            </TableCell>
                                            {/* MOM */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className={cn(getGrowthColor((branch.revMtd / branch.subs / today) / (branch.revM1 / branch.subsM1 / daysInPrevMonth) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((branch.revMtd / branch.subs / today) / (branch.revM1 / branch.subsM1 / daysInPrevMonth) - 1)}
                                                </span>
                                            </TableCell>
                                            {/* MOM1 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className={cn(getGrowthColor((branch.revM1 / branch.subsM1 / daysInPrevMonth) / (branch.revM2 / branch.subsM2 / daysInPrevMonth2) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((branch.revM1 / branch.subsM1 / daysInPrevMonth) / (branch.revM2 / branch.subsM2 / daysInPrevMonth2) - 1)}
                                                </span>
                                            </TableCell>
                                            {/* MOM2 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                                <span className={cn(getGrowthColor((branch.revM2 / branch.subsM2 / daysInPrevMonth2) / (branch.revM3 / branch.subsM3 / daysInPrevMonth3) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((branch.revM2 / branch.subsM2 / daysInPrevMonth2) / (branch.revM3 / branch.subsM3 / daysInPrevMonth3) - 1)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}

                                {/* WOK */}
                                <TableRow>
                                    <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        WOK
                                    </TableCell>
                                </TableRow>
                                {item.branches.map((branch, branchIndex) =>
                                    branch.woks.map((wok, wokIndex) => (
                                        <React.Fragment key={`wok-${wokIndex}-${branchIndex}-${index}`}>
                                            <TableRow>
                                                <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                    {branch.name}
                                                </TableCell>
                                                <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                    {wok.name}
                                                </TableCell>
                                                {/* M-3 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(Number(wok.arpuM3))}
                                                    </span>
                                                </TableCell>
                                                {/* M-2 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(Number(wok.arpuM2))}
                                                    </span>
                                                </TableCell>
                                                {/* M-1 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(Number(wok.arpuM1))}
                                                    </span>
                                                </TableCell>
                                                {/* MTD */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(Number(wok.arpu))}
                                                    </span>
                                                </TableCell>
                                                {/* MOM */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className={cn(getGrowthColor((wok.revMtd / wok.subs / today) / (wok.revM1 / wok.subsM1 / daysInPrevMonth) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((wok.revMtd / wok.subs / today) / (wok.revM1 / wok.subsM1 / daysInPrevMonth) - 1)}
                                                    </span>
                                                </TableCell>
                                                {/* MOM1 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className={cn(getGrowthColor((wok.revM1 / wok.subsM1 / daysInPrevMonth) / (wok.revM2 / wok.subsM2 / daysInPrevMonth2) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((wok.revM1 / wok.subsM1 / daysInPrevMonth) / (wok.revM2 / wok.subsM2 / daysInPrevMonth2) - 1)}
                                                    </span>
                                                </TableCell>
                                                {/* MOM2 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                                    <span className={cn(getGrowthColor((wok.revM2 / wok.subsM2 / daysInPrevMonth2) / (wok.revM3 / wok.subsM3 / daysInPrevMonth3) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((wok.revM2 / wok.subsM2 / daysInPrevMonth2) / (wok.revM3 / wok.subsM3 / daysInPrevMonth3) - 1)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))
                                )}

                                {/* STO */}
                                <TableRow>
                                    <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        STO
                                    </TableCell>
                                </TableRow>
                                {item.branches.map((branch, branchIndex) =>
                                    branch.woks.map((wok, wokIndex) =>
                                        wok.stos.map((sto, stoIndex) => (
                                            <React.Fragment key={`sto-${stoIndex}-${wokIndex}-${branchIndex}-${index}`}>
                                                <TableRow>
                                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                        {wok.name}
                                                    </TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                        {sto.name}
                                                    </TableCell>
                                                    {/* M-3 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(Number(sto.arpuM3))}
                                                        </span>
                                                    </TableCell>
                                                    {/* M-2 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(Number(sto.arpuM2))}
                                                        </span>
                                                    </TableCell>
                                                    {/* M-1 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(Number(sto.arpuM1))}
                                                        </span>
                                                    </TableCell>
                                                    {/* MTD */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(Number(sto.arpu))}
                                                        </span>
                                                    </TableCell>
                                                    {/* MOM */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className={cn(getGrowthColor((sto.revMtd / sto.subs / today) / (sto.revM1 / sto.subsM1 / daysInPrevMonth) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((sto.revMtd / sto.subs / today) / (sto.revM1 / sto.subsM1 / daysInPrevMonth) - 1)}
                                                        </span>
                                                    </TableCell>
                                                    {/* MOM1 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className={cn(getGrowthColor((sto.revM1 / sto.subsM1 / daysInPrevMonth) / (sto.revM2 / sto.subsM2 / daysInPrevMonth2) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((sto.revM1 / sto.subsM1 / daysInPrevMonth) / (sto.revM2 / sto.subsM2 / daysInPrevMonth2) - 1)}
                                                        </span>
                                                    </TableCell>
                                                    {/* MOM2 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                                        <span className={cn(getGrowthColor((sto.revM2 / sto.subsM2 / daysInPrevMonth2) / (sto.revM3 / sto.subsM3 / daysInPrevMonth3) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((sto.revM2 / sto.subsM2 / daysInPrevMonth2) / (sto.revM3 / sto.subsM3 / daysInPrevMonth3) - 1)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        )))
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export const DataTableRGB = ({ isLoading, data, title, date }: {
    isLoading?: boolean;
    data?: RegionRGB[];
    title: string;
    date?: Date
}) => {

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
            </div>
        )
    }

    const selectedDate = date ? date : subDays(new Date(), 2)
    const closingDate = endOfMonth(selectedDate)
    const isEndOfMonth = selectedDate.getDate() === closingDate.getDate();
    const endOfCurrMonth = isEndOfMonth ? closingDate : selectedDate
    const isCurrMonth = format(selectedDate, 'MM') === format(new Date(), 'MM')
    const multidimDay = isCurrMonth ? format(selectedDate, 'yyyy-MM-dd') : format(closingDate, 'yyyy-MM-dd')

    const today = parseInt(format(selectedDate, 'd'));
    const daysInCurrMonth = getDaysInMonth(selectedDate)
    const daysInPrevMonth = getDaysInMonth(subMonths(selectedDate, 1))
    const daysInPrevMonth2 = getDaysInMonth(subMonths(selectedDate, 2))
    const daysInPrevMonth3 = getDaysInMonth(subMonths(selectedDate, 3))

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>A list of territories and their revenues</TableCaption>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                            <TableCell rowSpan={3} className="whitespace-nowrap font-medium border-r dark:border-gray-700 text-white text-center bg-rose-600">
                                &nbsp;
                            </TableCell>
                            <TableCell rowSpan={3} className="whitespace-nowrap font-medium border-r dark:border-gray-700 text-white text-center bg-rose-600">
                                Territory
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={4} className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                {title}
                            </TableCell>
                            <TableCell colSpan={3} className="whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM DAILY {title}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                FM M-3
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                FM M-2
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                FM M-1
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MTD
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM <br />
                                <span className="text-[10px]">(MTD vs M-1)</span>
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM-1 <br />
                                <span className="text-[10px]">(M-1 vs M-2)</span>
                            </TableCell>
                            <TableCell className="py-0 text-sm whitespace-nowrap font-medium text-white bg-zinc-700 border-r last:border-r-0 dark:border-r-gray-700 text-center">
                                MOM-2 <br />
                                <span className="text-[10px]">(M-2 vs M-3)</span>
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 text-theme-sm dark:text-white dark:border-gray-800 dark:bg-white/[0.03]">
                                REGION
                            </TableCell>
                        </TableRow>
                        {data.map((item, index) => (
                            <React.Fragment key={index}>
                                <TableRow>
                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                        &nbsp;
                                    </TableCell>
                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                        {item.name}
                                    </TableCell>
                                    {/* M-3 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className="tabular-nums">
                                            {formatToBillion(item.rgbM3)}
                                        </span>
                                    </TableCell>
                                    {/* M-2 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className="tabular-nums">
                                            {formatToBillion(item.rgbM2)}
                                        </span>
                                    </TableCell>
                                    {/* M-1 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className="tabular-nums">
                                            {formatToBillion(item.rgbM1)}
                                        </span>
                                    </TableCell>
                                    {/* MTD */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className="tabular-nums">
                                            {formatToBillion(item.rgbMtd)}
                                        </span>
                                    </TableCell>
                                    {/* MOM */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className={cn(getGrowthColor((item.rgbMtd / today) / (item.rgbM1 / daysInPrevMonth) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((item.rgbMtd / today) / (item.rgbM1 / daysInPrevMonth) - 1)}
                                        </span>
                                    </TableCell>
                                    {/* MOM1 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                        <span className={cn(getGrowthColor((item.rgbM1 / daysInPrevMonth) / (item.rgbM2 / daysInPrevMonth2) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((item.rgbM1 / daysInPrevMonth) / (item.rgbM2 / daysInPrevMonth2) - 1)}
                                        </span>
                                    </TableCell>
                                    {/* MOM2 */}
                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                        <span className={cn(getGrowthColor((item.rgbM2 / daysInPrevMonth2) / (item.rgbM3 / daysInPrevMonth3) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                            {formatToPercentage((item.rgbM2 / daysInPrevMonth2) / (item.rgbM3 / daysInPrevMonth3) - 1)}
                                        </span>
                                    </TableCell>
                                </TableRow>

                                {/* BRANCH */}
                                <TableRow>
                                    <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        BRANCH
                                    </TableCell>
                                </TableRow>
                                {item.branches.map((branch, branchIndex) => (
                                    <React.Fragment key={`branch-${branchIndex}-${index}`}>
                                        <TableRow>
                                            <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                {branch.name}
                                            </TableCell>
                                            {/* M-3 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(branch.rgbM3)}
                                                </span>
                                            </TableCell>
                                            {/* M-2 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(branch.rgbM2)}
                                                </span>
                                            </TableCell>
                                            {/* M-1 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(branch.rgbM1)}
                                                </span>
                                            </TableCell>
                                            {/* MTD */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className="tabular-nums">
                                                    {formatToBillion(branch.rgbMtd)}
                                                </span>
                                            </TableCell>
                                            {/* MOM */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className={cn(getGrowthColor((branch.rgbMtd / today) / (branch.rgbM1 / daysInPrevMonth) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((branch.rgbMtd / today) / (branch.rgbM1 / daysInPrevMonth) - 1)}
                                                </span>
                                            </TableCell>
                                            {/* MOM1 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                <span className={cn(getGrowthColor((branch.rgbM1 / daysInPrevMonth) / (branch.rgbM2 / daysInPrevMonth2) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((branch.rgbM1 / daysInPrevMonth) / (branch.rgbM2 / daysInPrevMonth2) - 1)}
                                                </span>
                                            </TableCell>
                                            {/* MOM2 */}
                                            <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                                <span className={cn(getGrowthColor((branch.rgbM2 / daysInPrevMonth2) / (branch.rgbM3 / daysInPrevMonth3) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                    {formatToPercentage((branch.rgbM2 / daysInPrevMonth2) / (branch.rgbM3 / daysInPrevMonth3) - 1)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}

                                {/* WOK */}
                                <TableRow>
                                    <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        WOK
                                    </TableCell>
                                </TableRow>
                                {item.branches.map((branch, branchIndex) =>
                                    branch.woks.map((wok, wokIndex) => (
                                        <React.Fragment key={`wok-${wokIndex}-${branchIndex}-${index}`}>
                                            <TableRow>
                                                <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                    {branch.name}
                                                </TableCell>
                                                <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                    {wok.name}
                                                </TableCell>
                                                {/* M-3 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(wok.rgbM3)}
                                                    </span>
                                                </TableCell>
                                                {/* M-2 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(wok.rgbM2)}
                                                    </span>
                                                </TableCell>
                                                {/* M-1 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(wok.rgbM1)}
                                                    </span>
                                                </TableCell>
                                                {/* MTD */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className="tabular-nums">
                                                        {formatToBillion(wok.rgbMtd)}
                                                    </span>
                                                </TableCell>
                                                {/* MOM */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className={cn(getGrowthColor((wok.rgbMtd / today) / (wok.rgbM1 / daysInPrevMonth) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((wok.rgbMtd / today) / (wok.rgbM1 / daysInPrevMonth) - 1)}
                                                    </span>
                                                </TableCell>
                                                {/* MOM1 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                    <span className={cn(getGrowthColor((wok.rgbM1 / daysInPrevMonth) / (wok.rgbM2 / daysInPrevMonth2) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((wok.rgbM1 / daysInPrevMonth) / (wok.rgbM2 / daysInPrevMonth2) - 1)}
                                                    </span>
                                                </TableCell>
                                                {/* MOM2 */}
                                                <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                                    <span className={cn(getGrowthColor((wok.rgbM2 / daysInPrevMonth2) / (wok.rgbM3 / daysInPrevMonth3) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                        {formatToPercentage((wok.rgbM2 / daysInPrevMonth2) / (wok.rgbM3 / daysInPrevMonth3) - 1)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))
                                )}

                                {/* STO */}
                                <TableRow>
                                    <TableCell colSpan={13} className="px-1 py-0.5 border-r last:border-r-0 text-start font-semibold bg-gray-200 dark:text-white dark:border-gray-800 dark:bg-white/[0.03] text-theme-sm">
                                        STO
                                    </TableCell>
                                </TableRow>
                                {item.branches.map((branch, branchIndex) =>
                                    branch.woks.map((wok, wokIndex) =>
                                        wok.stos.map((sto, stoIndex) => (
                                            <React.Fragment key={`sto-${stoIndex}-${wokIndex}-${branchIndex}-${index}`}>
                                                <TableRow>
                                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                        {wok.name}
                                                    </TableCell>
                                                    <TableCell className="border-r last:border-r-0 text-start font-normal dark:text-white dark:border-gray-800 ">
                                                        {sto.name}
                                                    </TableCell>
                                                    {/* M-3 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(sto.rgbM3)}
                                                        </span>
                                                    </TableCell>
                                                    {/* M-2 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(sto.rgbM2)}
                                                        </span>
                                                    </TableCell>
                                                    {/* M-1 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(sto.rgbM1)}
                                                        </span>
                                                    </TableCell>
                                                    {/* MTD */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className="tabular-nums">
                                                            {formatToBillion(sto.rgbMtd)}
                                                        </span>
                                                    </TableCell>
                                                    {/* MOM */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className={cn(getGrowthColor((sto.rgbMtd / today) / (sto.rgbM1 / daysInPrevMonth) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((sto.rgbMtd / today) / (sto.rgbM1 / daysInPrevMonth) - 1)}
                                                        </span>
                                                    </TableCell>
                                                    {/* MOM1 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800 ">
                                                        <span className={cn(getGrowthColor((sto.rgbM1 / daysInPrevMonth) / (sto.rgbM2 / daysInPrevMonth2) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((sto.rgbM1 / daysInPrevMonth) / (sto.rgbM2 / daysInPrevMonth2) - 1)}
                                                        </span>
                                                    </TableCell>
                                                    {/* MOM2 */}
                                                    <TableCell className="border-r last:border-r-0 text-center font-normal dark:text-white dark:border-gray-800">
                                                        <span className={cn(getGrowthColor((sto.rgbM2 / daysInPrevMonth2) / (sto.rgbM3 / daysInPrevMonth3) - 1) ? 'text-green-500' : 'text-rose-500')}>
                                                            {formatToPercentage((sto.rgbM2 / daysInPrevMonth2) / (sto.rgbM3 / daysInPrevMonth3) - 1)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        )))
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

interface RevenueBaseRGB {
    name: string;
    rgbMtd: number;
    rgbM1: number;
    rgbM2: number;
    rgbM3: number;
}

// STO (Store) level entity
interface StoRGB extends RevenueBaseRGB {
    // No additional nested structures at the STO level
}

// WOK level RGB
interface WokRGB extends RevenueBaseRGB {
    stos: StoRGB[];
}

// Branch level RGB
interface BranchRGB extends RevenueBaseRGB {
    woks: WokRGB[];
}

// Region level RGB (top level)
interface RegionRGB extends RevenueBaseRGB {
    branches: BranchRGB[];
}