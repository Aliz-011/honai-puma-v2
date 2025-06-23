import { Fragment } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableCaption
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";

import { cn, getAchGrowthColor, getGrowthColor } from "@/lib/utils";
import { RevenueC3mrResponseData } from "@/types";

export const DataTable = ({ data }: { data: RevenueC3mrResponseData[] }) => {
    return (
        <div className="w-full space-y-2 overflow-x-hidden">
            {/* <h2 className="font-semibold text-xl">Alpro Profiling</h2> */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead rowSpan={2} className="font-medium border-r dark:border-gray-700 text-white text-center bg-rose-700 w-[100px] max-w-[100px]">Territory</TableHead>
                            <TableHead colSpan={5} className="text-center border w-20 whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700">Rev All</TableHead>
                            <TableHead colSpan={5} className="text-center border w-20 whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700">Rev Existing</TableHead>
                            <TableHead colSpan={5} className="text-center border w-20 whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700">Rev New Sales</TableHead>
                            <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700">Loss Revenue</TableHead>
                            <TableHead colSpan={3} className="text-center border w-20 whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700">LoS 0-6</TableHead>
                            <TableHead colSpan={3} className="text-center border w-20 whitespace-nowrap font-medium text-white bg-zinc-950 border-r last:border-r-0 dark:border-r-gray-700">LoS {'>'} 6</TableHead>
                        </TableRow>
                        <TableRow>
                            {[...Array(3)].map((_, index) => (
                                <Fragment key={index}>
                                    <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-blue-500 border-r last:border-r-0 dark:bg-gray-700 dark:text-gray-200 dark:border-r-gray-700">Target</TableHead>
                                    <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-muted-foreground border-r last:border-r-0 dark:bg-gray-700 dark:text-gray-200 dark:border-r-gray-700">Paid</TableHead>
                                    <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-muted-foreground border-r last:border-r-0 dark:bg-gray-700 dark:text-gray-200 dark:border-r-gray-700">Unpaid</TableHead>
                                    <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-muted-foreground border-r last:border-r-0 dark:bg-gray-700 dark:text-gray-200 dark:border-r-gray-700">Ach</TableHead>
                                    <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-muted-foreground border-r last:border-r-0 dark:bg-gray-700 dark:text-gray-200 dark:border-r-gray-700">Gap</TableHead>
                                </Fragment>
                            ))}
                            <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-muted-foreground border-r last:border-r-0 dark:bg-gray-700 dark:text-gray-200 dark:border-r-gray-700">Rev</TableHead>
                            {[...Array(2)].map((_, index) => (
                                <Fragment key={index}>
                                    <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-muted-foreground border-r last:border-r-0 dark:bg-gray-700 dark:text-gray-200 dark:border-r-gray-700">Subs</TableHead>
                                    <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-muted-foreground border-r last:border-r-0 dark:bg-gray-700 dark:text-gray-200 dark:border-r-gray-700">Paid</TableHead>
                                    <TableHead className="text-center border w-20 whitespace-nowrap font-medium text-white bg-muted-foreground border-r last:border-r-0 dark:bg-gray-700 dark:text-gray-200 dark:border-r-gray-700">Ach</TableHead>
                                </Fragment>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? data.map((item, index) =>
                            <TableRow key={index} className={index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}>
                                <TableCell className="px-3 py-0.5 border-r last:border-r-0 text-start dark:text-white">{item.name}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.target_rev_all}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.bill_amount_all}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.bill_amount_all_unpaid}</TableCell>
                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums", getAchGrowthColor(item.ach_fm_rev_all) ? 'text-green-500' : 'text-rose-500')}>{item.ach_fm_rev_all}</TableCell>
                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums", item.gap_to_target_rev_all > 0 ? 'text-green-500' : 'text-rose-500')}>{item.gap_to_target_rev_all}</TableCell>

                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.target_rev_existing}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.bill_amount_existing}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.bill_amount_existing_unpaid}</TableCell>
                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums", getAchGrowthColor(item.ach_fm_rev_existing) ? 'text-green-500' : 'text-rose-500')}>{item.ach_fm_rev_existing}</TableCell>
                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums", item.gap_to_target_rev_existing > 0 ? 'text-green-500' : 'text-rose-500')}>{item.gap_to_target_rev_existing}</TableCell>

                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.target_rev_ns}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.bill_amount_ns}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.bill_amount_ns_unpaid}</TableCell>
                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums", getAchGrowthColor(item.ach_fm_rev_ns) ? 'text-green-500' : 'text-rose-500')}>{item.ach_fm_rev_ns}</TableCell>
                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums", item.gap_to_target_rev_ns > 0 ? 'text-green-500' : 'text-rose-500')}>{item.gap_to_target_rev_ns}</TableCell>

                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.revenue_loss}</TableCell>

                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.subs_0_6.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.subs_paid_0_6.toLocaleString('id-ID')}</TableCell>
                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums", getAchGrowthColor(item.ach_subs_0_6) ? 'text-green-500' : 'text-rose-500')}>{item.ach_subs_0_6}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.subs_gt_6.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums">{item.subs_paid_gt_6.toLocaleString('id-ID')}</TableCell>
                                <TableCell className={cn("px-1 py-0.5 border-r last:border-r-0 text-center dark:text-white !tabular-nums", getAchGrowthColor(item.ach_subs_paid_gt_6) ? 'text-green-500' : 'text-rose-500')}>{item.ach_subs_paid_gt_6}</TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center dark:text-white">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}