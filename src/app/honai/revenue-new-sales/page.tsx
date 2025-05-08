'use client'

import { Filters } from '../filters'
import { DataTable } from '../data-table'

import { useSelectDate } from '@/hooks/use-select-date'
import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'

export default function RevenueNewSalesPage() {
    const { date } = useSelectDate()
    const { data, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['revenue-new-sales', date],
        queryFn: async () => {
            const response = await client.api['revenue-new-sales'].$get({ query: { date: date?.toLocaleString() } })

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
            <DataTable refetch={refetch} data={data} latestUpdatedData={2} title="Revenue New Sales All" date={date} isLoading={isLoading || isRefetching} />
        </div>
    </div>
}
