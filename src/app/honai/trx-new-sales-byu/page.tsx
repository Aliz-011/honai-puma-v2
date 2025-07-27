'use client'

import { useQuery } from '@tanstack/react-query'

import { Filters } from '../filters'
import { DataTable } from './data-table'

import { useSelectDate } from '@/hooks/use-select-date'
import { client } from '@/lib/client'
import { useSelectBranch } from '@/hooks/use-select-branch'
import { useSelectSubbranch } from '@/hooks/use-select-subbranch'
import { useSelectCluster } from '@/hooks/use-select-cluster'
import { useSelectKabupaten } from '@/hooks/use-select-kabupaten'
import { useCurrentSession } from "@/hooks/use-current-session"
import { redirect } from 'next/navigation'

export default function RevenueNewSalesPage() {
    const { date } = useSelectDate()
    const { branch } = useSelectBranch()
    const { subbranch } = useSelectSubbranch()
    const { cluster } = useSelectCluster()
    const { kabupaten } = useSelectKabupaten()

    const { data: session } = useCurrentSession()

    if (!session?.user) {
        redirect('/login')
    }

    const { data, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['trx-new-sales-byu', date, branch, subbranch, cluster, kabupaten],
        queryFn: async ({ queryKey }) => {
            const [_key, dateQuery, branchQuery, subbranchQuery, clusterQuery, kabupatenQuery] = queryKey;

            const dateString = dateQuery instanceof Date
                ? dateQuery.toISOString()
                : (typeof dateQuery === 'string' ? dateQuery : undefined);

            const response = await client.api['trx-new-sales-byu'].$get({
                query: {
                    date: dateString,
                    branch: branchQuery as string,
                    subbranch: subbranchQuery as string,
                    cluster: clusterQuery as string,
                    kabupaten: kabupatenQuery as string,
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch data')
            }
            const { data } = await response.json()
            return data
        },
        refetchOnWindowFocus: false,
        retry: 3,
        staleTime: 60 * 1000 * 60,
        gcTime: 60 * 1000 * 10,

    })

    return <div className="px-4 lg:px-6">
        <div className="overflow-hidden min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <Filters daysBehind={2} />
            <DataTable refetch={refetch} data={data} latestUpdatedData={2} title="Trx New Sales ByU" date={date} isLoading={isLoading || isRefetching} />
        </div>
    </div>
}
