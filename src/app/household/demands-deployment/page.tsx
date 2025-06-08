'use client'

import { format, subDays } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { Filters } from "./filter"
import { DataTable, DataTableODP } from "./data-table"

import { useSelectDate } from "@/hooks/use-select-date"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSelectBranch } from "@/hooks/use-select-branch"
import { useSelectWok } from "@/hooks/use-select-wok"
import { client } from "@/lib/client"

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
            console.log({ branch, wok })
            setFetchDataClicked(true);
        }
    };

    const isDataActuallyAvailable = data && data.length > 0;

    return (
        <div className="overflow-hidden min-h-screen rounded-xl space-y-4">
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
                        <>
                            {isError && (
                                <div className="flex h-full items-center justify-center text-red-500">
                                    <p>Warning: Failed to update data. Displaying last available data. Error: {error?.message}</p>
                                </div>
                            )}

                            <DataTable data={data} />
                            <DataTableODP data={data} />

                            <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
                                <Card className="@container/card">
                                    <CardHeader className="relative">
                                        <CardTitle>New Golive (UIM)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs">MoM</span>
                                            <div className="text-sm font-medium">{data[0].new_go_live_mom}</div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs">YtD</span>
                                            <div className="text-sm font-medium">{data[0].new_go_live_ytd}</div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex-col items-start gap-1 text-sm">
                                        <div className="line-clamp-1 flex gap-2 font-medium">
                                            {data[0].name}
                                        </div>
                                    </CardFooter>
                                </Card>
                                {/* DEMANDS */}
                                <Card className="@container/card">
                                    <CardHeader className="relative">
                                        <CardTitle>DEMANDS</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs">YtD Demands</span>
                                            <div className="text-sm font-medium">450</div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs">Created</span>
                                            <div className="text-sm font-medium">1560</div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs">MoM</span>
                                            <div className="text-sm font-medium">11.93%</div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs">Achieved</span>
                                            <div className="text-sm font-medium">120 (20.93%)</div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex-col items-start gap-1 text-sm">
                                        <div className="line-clamp-1 flex gap-2 font-medium">
                                            AMBON
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        </>
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

export type ChartDataItem = {
    name: string | null;
    level: string;
    status: string;
    amount_port: string | null;
    avai_port: string | null;
    occupied_alpro_m: number;
    occupied_alpro_m1: number;
    alpro_gap: number;
    alpro_mom: string;
    odp_percentage: string;
}