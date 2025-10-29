'use client'

import { useQuery } from "@tanstack/react-query"

import { Filters } from "./filter"
import { DataTable, DataTableODP } from "./data-table"

import { useSelectDate } from "@/hooks/use-select-date"
import { useSelectBranch } from "@/hooks/use-select-branch"
import { useSelectWok } from "@/hooks/use-select-wok"
import { client } from "@/lib/client"
import { useCurrentSession } from "@/hooks/use-current-session"
import { redirect } from 'next/navigation'
import { ProgressCard, GoliveCard, DemandData } from "./progress-card"

const Page = () => {
    const { date: selectedDate } = useSelectDate()
    const { branch, setSelectedBranch } = useSelectBranch()
    const { wok, setSelectedWok } = useSelectWok()

    const { data: session } = useCurrentSession()

    if (!session?.user) {
        redirect('/login')
    }

    const { data, isLoading, isError, error, isSuccess } = useQuery({
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
        enabled: true,
        refetchOnWindowFocus: false,
        retry: 1,
        gcTime: 5 * 60 * 1000,
    })

    const handleClick = () => {
        setSelectedBranch('')
        setSelectedWok('')
    };

    const isDataActuallyAvailable = data && data.length > 0;

    return (
        <div className="overflow-hidden rounded-xl space-y-4">
            <div className="py-2">
                <Filters daysBehind={2} handleClick={handleClick} disabled={isLoading} />
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
                        <div className="space-y-6">
                            {isError && (
                                <div className="flex h-full items-center justify-center text-red-500">
                                    <p>Warning: Failed to update data. Displaying last available data. Error: {error?.message}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-12 gap-6">
                                <section className="space-y-6 col-span-8">
                                    <DataTable data={data} />

                                    <DataTableODP data={data} />
                                </section>


                                <section className="space-y-6 col-span-4">
                                    <DemandData
                                        data={[
                                            { metric: 'YTD DEMANDS', value: data[0].target_ytd_demand.toLocaleString('id-ID') },
                                            { metric: 'CREATED', value: data[0].demand_created_mtd.toLocaleString('id-ID') },
                                            { metric: 'MoM', value: data[0].demand_created_mom },
                                            { metric: 'Achieved', value: data[0].ach_demands },
                                        ]}
                                    />
                                </section>
                            </div>

                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                        <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full mr-3"></div>
                                        New Golive (UIM) - Port
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                                    <GoliveCard
                                        title="New Golive"
                                        data={[
                                            { label: 'MTD', value: data[0].golive_m || '0' },
                                            { label: 'M-1', value: data[0].golive_m1 || ' 0' },
                                            { label: 'MoM', value: data[0].golive_mom || '0%', className: getValueStyle(data[0].golive_mom || '0%') },
                                            { label: 'YTD', value: data[0].golive_y || '0' },
                                            { label: 'Y-1', value: data[0].golive_y1 || '0' },
                                            { label: 'YoY', value: data[0].golive_yoy || '0%', className: getValueStyle(data[0].golive_yoy || '0%') },
                                        ]}
                                    />

                                    <ProgressCard
                                        title="Go Live 2024"
                                        data={[
                                            { label: '1mo GL', total_port: data[0].amount_port_1mo_y1, used_port: data[0].used_1mo_y1, ach: data[0].occ_1mo_y1 },
                                            { label: '2mo GL', total_port: data[0].amount_port_2mo_y1, used_port: data[0].used_2mo_y1, ach: data[0].occ_2mo_y1 },
                                            { label: '3mo GL', total_port: data[0].amount_port_3mo_y1, used_port: data[0].used_3mo_y1, ach: data[0].occ_3mo_y1 },
                                            { label: '4-6mo GL', total_port: data[0].amount_port_4mo_y1, used_port: data[0].used_4mo_y1, ach: data[0].occ_4mo_y1 },
                                            { label: '>6mo GL', total_port: data[0].amount_port_gt_6mo_y1, used_port: data[0].used_gt_6mo_y1, ach: data[0].occ_gt_6mo_y1 },
                                            { label: 'Total', total_port: data[0].amount_port_all_mo_y1, used_port: data[0].used_all_mo_y1, ach: data[0].occ_all_mo_y1 },
                                        ]}
                                    />

                                    <ProgressCard
                                        title="Go Live 2025"
                                        data={[
                                            { label: '1mo GL', total_port: data[0].amount_port_1mo_y, used_port: data[0].used_1mo_y, ach: data[0].occ_1mo_y },
                                            { label: '2mo GL', total_port: data[0].amount_port_2mo_y, used_port: data[0].used_2mo_y, ach: data[0].occ_2mo_y },
                                            { label: '3mo GL', total_port: data[0].amount_port_3mo_y, used_port: data[0].used_3mo_y, ach: data[0].occ_3mo_y },
                                            { label: '4-6mo GL', total_port: data[0].amount_port_4mo_y, used_port: data[0].used_4mo_y, ach: data[0].occ_4mo_y },
                                            { label: '>6mo GL', total_port: data[0].amount_port_gt_6mo_y, used_port: data[0].used_gt_6mo_y, ach: data[0].occ_gt_6mo_y },
                                            { label: 'Total', total_port: data[0].amount_port_all_mo_y, used_port: data[0].used_all_mo_y, ach: data[0].occ_all_mo_y },
                                        ]}
                                    />

                                    <ProgressCard
                                        title="Go Live 2024-2025"
                                        data={[
                                            { label: '1mo GL', total_port: Number(data[0].amount_port_1mo_y) + Number(data[0].amount_port_1mo_y1), used_port: Number(data[0].used_1mo_y) + Number(data[0].used_1mo_y1), ach: data[0].occ_1mo_2y },
                                            { label: '2mo GL', total_port: Number(data[0].amount_port_2mo_y) + Number(data[0].amount_port_2mo_y1), used_port: Number(data[0].used_2mo_y) + Number(data[0].used_2mo_y1), ach: data[0].occ_2mo_2y },
                                            { label: '3mo GL', total_port: Number(data[0].amount_port_3mo_y) + Number(data[0].amount_port_3mo_y1), used_port: Number(data[0].used_3mo_y) + Number(data[0].used_3mo_y1), ach: data[0].occ_3mo_2y },
                                            { label: '4-6mo GL', total_port: Number(data[0].amount_port_4mo_y) + Number(data[0].amount_port_4mo_y1), used_port: Number(data[0].used_4mo_y) + Number(data[0].used_4mo_y1), ach: data[0].occ_4mo_2y },
                                            { label: '>6mo GL', total_port: Number(data[0].amount_port_gt_6mo_y) + Number(data[0].amount_port_gt_6mo_y1), used_port: Number(data[0].used_gt_6mo_y) + Number(data[0].used_gt_6mo_y1), ach: data[0].occ_gt_6mo_2y },
                                            { label: 'Total', total_port: Number(data[0].amount_port_all_mo_y) + Number(data[0].amount_port_all_mo_y1), used_port: Number(data[0].used_all_mo_y) + Number(data[0].used_all_mo_y1), ach: data[0].occ_all_mo_2y },
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                }

                if ((isSuccess || isError /* an attempt was made */) && !isDataActuallyAvailable) {
                    return (
                        <div className="flex h-full items-center justify-center">
                            <p>No data found for the selected filters.</p>
                        </div>
                    );
                }

                return null;
            })()}
        </div >
    )
}
export default Page

function getValueStyle(value: string) {
    const valueNumber = parseInt(value.replace('%', ''), 10)
    if (valueNumber > 0) {
        return "text-green-500"
    }

    return "text-red-500"
}