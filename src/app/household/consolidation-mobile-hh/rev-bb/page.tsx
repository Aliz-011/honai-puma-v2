'use client'

import { useQuery } from "@tanstack/react-query"

import { Filters } from "../filter"
import { DataTable } from "./data-table"

import { useSelectBranch } from "@/hooks/use-select-branch"
import { useSelectCluster } from "@/hooks/use-select-cluster"
import { useSelectDate } from "@/hooks/use-select-date"
import { useSelectKabupaten } from "@/hooks/use-select-kabupaten"
import { client } from "@/lib/client"

const Page = () => {
    const { date: selectedDate } = useSelectDate()
    const { branch, setSelectedBranch } = useSelectBranch()
    const { cluster, setSelectedCluster } = useSelectCluster()
    const { kabupaten, setSelectedKabupaten } = useSelectKabupaten()

    const { data, isLoading, isError, error, refetch, isSuccess, isRefetching } = useQuery({
        queryKey: ['consolidation-bb', selectedDate, branch, cluster, kabupaten],
        queryFn: async ({ queryKey }) => {

            const [_key, dateQuery, branchQuery, clusterQuery, kabupatenQuery] = queryKey;

            const dateString = dateQuery instanceof Date
                ? dateQuery.toISOString()
                : (typeof dateQuery === 'string' ? dateQuery : undefined);

            const response = await client.api['consolidation-bb'].$get({
                query: {
                    date: dateString,
                    branch: branchQuery as string,
                    cluster: clusterQuery as string,
                    kabupaten: kabupatenQuery as string
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
        setSelectedCluster('')
        setSelectedKabupaten('')
    };

    const isDataActuallyAvailable = data && data.length > 0

    return (
        <div className="overflow-hidden min-h-screen rounded-2xl border border-gray-200 px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] space-y-4 bg-gray-50">
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
                        <>
                            <DataTable refetch={refetch} data={data} latestUpdatedData={2} title="REV MOBILE BB vs REV HH ALL" date={selectedDate} isLoading={isLoading || isRefetching} />
                        </>
                    )
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
        </div>
    )
}
export default Page