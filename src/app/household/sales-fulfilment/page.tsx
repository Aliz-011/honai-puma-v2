'use client'

import { useQuery } from "@tanstack/react-query"
import { useState, useMemo, Fragment } from "react"
import { format, subDays } from "date-fns"

import { SectionCards } from "./section-cards"
import { BrownGreenChart, ChartPie, IOREPSChart } from "./chart-component"
import { Filters } from "../filter"

import { client } from '@/lib/client'
import { useSelectDate } from "@/hooks/use-select-date"
import { useSelectBranch } from "@/hooks/use-select-branch"
import { useSelectWok } from "@/hooks/use-select-wok"
import { SalesForceDataTable } from "./data-table"
import { columns } from "./columns"

const Page = () => {
    const { date: selectedDate } = useSelectDate()
    const { branch } = useSelectBranch()
    const { wok } = useSelectWok()
    const [fetchDataClicked, setFetchDataClicked] = useState(false);

    const { data, isLoading, isError, error, refetch, isSuccess } = useQuery({
        queryKey: ['sales-fulfilment', selectedDate, branch, wok],
        queryFn: async ({ queryKey }) => {

            const [_key, dateQuery, branchQuery, wokQuery] = queryKey;

            const dateString = dateQuery instanceof Date
                ? dateQuery.toISOString()
                : (typeof dateQuery === 'string' ? dateQuery : undefined);

            const response = await client.api['io-re-ps'].$get({
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

    const { data: sfData, isLoading: isLoadingSf, isSuccess: isSfSuccess, refetch: refetchSf, isError: isSfError } = useQuery({
        queryKey: ['sales-force-class', selectedDate],
        queryFn: async ({ queryKey }) => {
            const [_key, dateQuery] = queryKey;

            const dateString = dateQuery instanceof Date
                ? dateQuery.toISOString()
                : (typeof dateQuery === 'string' ? dateQuery : undefined);

            const response = await client.api['sf-class'].$get({
                query: {
                    date: dateString
                }
            })

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
        refetchSf()
        if (!fetchDataClicked) {
            setFetchDataClicked(true);
        }
    };

    const groupedData = useMemo(() => {
        if (!data) return {};
        const grouped: Record<string, ResponseData[]> = {};
        data.forEach(item => {
            if (!grouped[item.level]) {
                grouped[item.level] = [];
            }
            grouped[item.level].push(item);
        });
        return grouped;
    }, [data]);

    const renderChartsForIOREPS = (level: string, title: string) => {
        const levelData = groupedData[level];

        if (!levelData || levelData.length === 0) {
            return (
                <div key={level} className="overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
                    <h2 className="text-2xl font-semibold">{title}</h2>
                    <p>No data available for {level.toLowerCase()}.</p>
                </div>
            );
        }

        const ioChartData = levelData.map(item => ({
            territory: item.name,
            target: item.target_all_sales,
            actual: item.io_m,
            drr: item.drr_io
        }))

        const reChartData = levelData.map(item => ({
            territory: item.name,
            target: item.target_all_sales,
            actual: item.re_m,
            drr: item.drr_re
        }))

        const psChartData = levelData.map(item => ({
            territory: item.name,
            target: item.target_all_sales,
            actual: item.ps_m,
            drr: item.drr_ps
        }))

        return (
            <Fragment key={level}>
                <h2 className="text-2xl font-semibold">{title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <IOREPSChart date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyy')} title='IO' data={ioChartData} />
                    <IOREPSChart date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyy')} title='RE' data={reChartData} />
                    <IOREPSChart date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyy')} title='PS' data={psChartData} />
                </div>
            </Fragment>
        );
    };

    const renderChartsForBrownGreen = (level: string, title: string) => {
        const levelData = groupedData[level];

        if (!levelData || levelData.length === 0) {
            return (
                <div key={level} className="overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
                    <h2 className="text-2xl font-semibold">{title}</h2>
                    <p>No data available for {level.toLowerCase()}.</p>
                </div>
            );
        }

        const brownfieldData = levelData.map(item => ({
            territory: item.name,
            target: item.target_brownfield,
            actual: item.brownfield,
            drr: parseFloat(item.drr_brownfield.replace('%', ''))
        }))

        const greenfieldData = levelData.map(item => ({
            territory: item.name,
            target: item.target_greenfield,
            actual: item.greenfield,
            drr: parseFloat(item.drr_greenfield.replace('%', ''))
        }))

        return (
            <Fragment key={level}>
                <h2 className="text-2xl font-semibold">{title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BrownGreenChart date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyy')} title='Brownfield' data={brownfieldData} />
                    <BrownGreenChart date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyy')} title='Greenfield' data={greenfieldData} />
                </div>
            </Fragment>
        );
    };

    const isDataActuallyAvailable = data && data.length > 0 && sfData && sfData.length > 0

    return (
        <div className="overflow-hidden min-h-screen rounded-xl space-y-4">

            <div className="py-2">
                <Filters daysBehind={2} handleClick={handleClick} />
            </div>

            {(() => {
                if (isLoading || isLoadingSf) {
                    return (
                        <div className="flex h-full items-center justify-center">
                            <p>Loading charts data...</p>
                        </div>
                    );
                }

                if (isError && isSfError) {
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
                            {isError && isSfError && (
                                <div className="flex h-full items-center justify-center text-red-500">
                                    <p>Warning: Failed to update data. Displaying last available data. Error: {error?.message}</p>
                                </div>
                            )}

                            <SectionCards data={data} />

                            {Object.keys(groupedData)
                                .filter(level => level !== '')
                                .map(level => {
                                    let title = "";
                                    switch (level) {
                                        case 'region': title = 'Regional IO-RE-PS'; break;
                                        case 'branch': title = `Branch IO-RE-PS`; break;
                                        case 'wok': title = `WOK IO-RE-PS`; break;
                                        case 'sto': title = 'STO IO-RE-PS'; break;
                                        default: title = `${level} IO-RE-PS`;
                                    }
                                    return renderChartsForIOREPS(level, title);
                                })}

                            {renderChartsForBrownGreen('branch', 'Brownfield Greenfield')}

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <SalesForceDataTable columns={columns} data={sfData} />
                                </div>
                                <ChartPie date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyy')} data={data} />
                            </div>
                        </>
                    );
                }


                if (fetchDataClicked && (isSuccess || isSfSuccess || isError /* an attempt was made */) && !isDataActuallyAvailable) {
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

                return null; // Fallback, should not be reached with proper logic
            })()}
        </div>
    )
}

export default Page


export type ResponseData = {
    name: string | null;
    target_all_sales: number;
    level: string;
    ach_target_fm_io_all_sales: number;
    drr_io: number;
    io_m: number;
    io_mom: string;
    io_gap_daily: number;
    ach_target_fm_re_all_sales: number;
    drr_re: number;
    re_m: number;
    re_mom: string;
    re_gap_daily: number;
    ach_target_fm_ps_all_sales: number;
    drr_ps: number;
    target_daily_ps: number;
    ach_daily_ps: number;
    ps_gap_daily: number;
    daily_ps_remaining: number;
    ps_m: number;
    ps_mom: string;
    ps_to_io: number;
    ps_to_re: number;
    ach_fm_indihome: string;
    ps_indihome: number;
    ach_fm_grapari: string;
    ps_grapari: number;
    ach_fm_community: string;
    ps_community: number;
    ach_fm_agency: string;
    ps_sales_force: number;
    brownfield: number;
    target_brownfield: number;
    ach_fm_brownfield: string;
    drr_brownfield: string;
    greenfield: number;
    target_greenfield: number;
    ach_fm_greenfield: string;
    drr_greenfield: string;
}