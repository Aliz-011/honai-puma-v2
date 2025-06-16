'use client'

import { format, subDays } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { Filters } from "./filter"
import { DataTable, DataTableODP } from "./data-table"

import { useSelectDate } from "@/hooks/use-select-date"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSelectBranch } from "@/hooks/use-select-branch"
import { useSelectWok } from "@/hooks/use-select-wok"
import { client } from "@/lib/client"
import { ProgressCard, GoliveCard } from "./progress-card"

const Page = () => {
    const { date: selectedDate } = useSelectDate()
    const { branch } = useSelectBranch()
    const { wok } = useSelectWok()
    const [fetchDataClicked, setFetchDataClicked] = useState(false);

    const { data, isLoading, isError, error, refetch, isSuccess } = useQuery({
        queryKey: ['demands-deployment', selectedDate, branch, wok],
        queryFn: async ({ queryKey }) => {

            const [_key, dateQuery, branchQuery, wokQuery] = queryKey;

            const dateString = dateQuery instanceof Date
                ? dateQuery.toISOString()
                : (typeof dateQuery === 'string' ? dateQuery : undefined);

            const response = await client.api['demands-deployment'].$get({
                query: {
                    date: dateString,
                    branch: branchQuery as string,
                    wok: wokQuery as string
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data')
            }
            const { data } = await response.json()
            return data
        },
        enabled: false,
        refetchOnWindowFocus: false,
        retry: 1,
        gcTime: 5 * 60 * 1000,
    })

    const handleClick = () => {
        refetch()
        if (!fetchDataClicked) {
            setFetchDataClicked(true);
        }
    };

    const isDataActuallyAvailable = data && data.length > 0;

    return (
        <div className="overflow-hidden rounded-xl space-y-4">
            <div className="py-2">
                <Filters daysBehind={2} handleClick={handleClick} />
            </div>

            {(() => {
                if (isLoading) {
                    return (
                        <div className="flex h-full items-center justify-center">
                            <p>Loading charts data...</p>
                        </div>
                    );
                }

                if (isError) {
                    if (!isDataActuallyAvailable) {
                        return (
                            <div className="flex h-full items-center justify-center">
                                <p>Error: {error?.message}</p>
                            </div>
                        );
                    }
                }

                if (isDataActuallyAvailable) {
                    return (
                        <div className="space-y-12">
                            {isError && (
                                <div className="flex h-full items-center justify-center text-red-500">
                                    <p>Warning: Failed to update data. Displaying last available data. Error: {error?.message}</p>
                                </div>
                            )}

                            <DataTable data={data} />
                            <DataTableODP data={data} />

                            <section className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Golive (UIM) - Port</h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
                                    {/* NEW GOLIVE */}
                                    <GoliveCard
                                        title="New Golive"
                                        data={[
                                            { label: 'MTD', value: data[0].golive_m },
                                            { label: 'M-1', value: data[0].golive_m1 },
                                            { label: 'MoM', value: data[0].golive_mom },
                                            { label: 'YTD', value: data[0].golive_y },
                                            { label: 'Y-1', value: data[0].golive_y1 },
                                            { label: 'YoY', value: data[0].golive_yoy },
                                        ]}
                                    />

                                    <ProgressCard
                                        title="Go Live 2024"
                                        date={selectedDate ?? subDays(new Date(), 2)}
                                        data={[
                                            { label: '1mo GL', total_port: data[0].amount_port_1mo_y1, used_port: data[0].used_1mo_y1, ach: data[0].occ_1mo_y1 },
                                            { label: '2mo GL', total_port: data[0].amount_port_2mo_y1, used_port: data[0].used_2mo_y1, ach: data[0].occ_2mo_y1 },
                                            { label: '3mo GL', total_port: data[0].amount_port_3mo_y1, used_port: data[0].used_3mo_y1, ach: data[0].occ_3mo_y1 },
                                            { label: '4-6mo GL', total_port: data[0].amount_port_4mo_y1, used_port: data[0].used_4mo_y1, ach: data[0].occ_4mo_y1 },
                                            { label: 'Total', total_port: data[0].amount_port_1_6mo_y1, used_port: data[0].used_1_6mo_y1, ach: data[0].occ_1_6mo_y1 },
                                        ]}
                                    />

                                    <ProgressCard
                                        title="Go Live 2025"
                                        date={selectedDate ?? subDays(new Date(), 2)}
                                        data={[
                                            { label: '1mo GL', total_port: data[0].amount_port_1mo_y, used_port: data[0].used_1mo_y, ach: data[0].occ_1mo_y },
                                            { label: '2mo GL', total_port: data[0].amount_port_2mo_y, used_port: data[0].used_2mo_y, ach: data[0].occ_2mo_y },
                                            { label: '3mo GL', total_port: data[0].amount_port_3mo_y, used_port: data[0].used_3mo_y, ach: data[0].occ_3mo_y },
                                            { label: '4-6mo GL', total_port: data[0].amount_port_4mo_y, used_port: data[0].used_4mo_y, ach: data[0].occ_4mo_y },
                                            { label: 'Total', total_port: data[0].amount_port_1_6mo_y, used_port: data[0].used_1_6mo_y, ach: data[0].occ_1_6mo_y },
                                        ]}
                                    />

                                    <ProgressCard
                                        title="Go Live 2024-2025"
                                        date={selectedDate ?? subDays(new Date(), 2)}
                                        data={[
                                            { label: '1mo GL', total_port: Number(data[0].amount_port_1mo_y) + Number(data[0].amount_port_1mo_y1), used_port: Number(data[0].used_1mo_y) + Number(data[0].used_1mo_y1), ach: data[0].occ_1mo_2y },
                                            { label: '2mo GL', total_port: Number(data[0].amount_port_2mo_y) + Number(data[0].amount_port_2mo_y1), used_port: Number(data[0].used_2mo_y) + Number(data[0].used_2mo_y1), ach: data[0].occ_2mo_2y },
                                            { label: '3mo GL', total_port: Number(data[0].amount_port_3mo_y) + Number(data[0].amount_port_3mo_y1), used_port: Number(data[0].used_3mo_y) + Number(data[0].used_3mo_y1), ach: data[0].occ_3mo_2y },
                                            { label: '4-6mo GL', total_port: Number(data[0].amount_port_4mo_y) + Number(data[0].amount_port_4mo_y1), used_port: Number(data[0].used_4mo_y) + Number(data[0].used_4mo_y1), ach: data[0].occ_4mo_2y },
                                            { label: 'Total', total_port: Number(data[0].amount_port_1_6mo_y) + Number(data[0].amount_port_1_6mo_y1), used_port: Number(data[0].used_1_6mo_y) + Number(data[0].used_1_6mo_y1), ach: data[0].occ_1_6mo_2y },
                                        ]}
                                    />
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Demands</h2>
                                </div>

                                <div className="max-w-md">
                                    <Card className="@container/card bg-white dark:bg-white/[0.03]">
                                        <CardHeader className="relative">
                                            <CardTitle>DEMANDS</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">YtD Demands</span>
                                                <div className="text-base font-semibold">{data[0].target_ytd_demand.toLocaleString('id-ID')}</div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Created</span>
                                                <div className="text-base font-semibold">{data[0].demand_created_mtd}</div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">MoM</span>
                                                <div className="text-base font-semibold">{data[0].demand_created_mom}</div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Achieved</span>
                                                <div className="text-base font-semibold">{data[0].ach_demands}</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>
                        </div>
                    );
                }

                if (fetchDataClicked && (isSuccess || isError /* an attempt was made */) && !isDataActuallyAvailable) {
                    return (
                        <div className="flex h-full items-center justify-center">
                            <p>No data found for the selected filters.</p>
                        </div>
                    );
                }

                // Initial state: no fetch attempted yet
                if (!fetchDataClicked) {
                    return (
                        <div className="flex h-full items-center justify-center">
                            <p>"Tampilkan data" to view reports.</p>
                        </div>
                    );
                }

                return null;
            })()}
        </div>
    )
}
export default Page