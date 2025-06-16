'use client'

import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { format, subDays } from "date-fns"
import { ChevronRight } from "lucide-react"

import { SectionCards } from "./section-cards"
import { BrownGreenChart, ChartPie, ProgressCard } from "./chart-component"
import { Filters } from "../filter"
import { FunnelingGroup, WOLoS } from "./funneling-group"
import { SalesForce } from './sales-force'
import { FalloutDetail } from "./fallout-detail"

import { client } from '@/lib/client'
import { useSelectDate } from "@/hooks/use-select-date"
import { useSelectBranch } from "@/hooks/use-select-branch"
import { useSelectWok } from "@/hooks/use-select-wok"
import type { SalesFulfilmentResponseData } from '@/types'

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
        queryKey: ['sales-force-class', selectedDate, branch, wok],
        queryFn: async ({ queryKey }) => {
            const [_key, dateQuery, branchQuery, wokQuery] = queryKey;

            const dateString = dateQuery instanceof Date
                ? dateQuery.toISOString()
                : (typeof dateQuery === 'string' ? dateQuery : undefined);

            const response = await client.api['sf-class'].$get({
                query: {
                    date: dateString,
                    branch: branchQuery as string,
                    wok: wokQuery as string
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
        const grouped: Record<string, SalesFulfilmentResponseData[]> = {};
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
                    <p>No data available for {levelData[0].name}.</p>
                </div>
            );
        }

        const ioChartData = levelData.map(item => ({
            territory: item.name,
            target: item.target_all_sales,
            actual: item.io_m,
            drr: item.drr_io,
            color: 'text-chart-5',
            ach_fm: (item.io_m / item.target_all_sales * 100).toFixed(2) + '%'
        }))

        const reChartData = levelData.map(item => ({
            territory: item.name,
            target: item.target_all_sales,
            actual: item.re_m,
            drr: item.drr_re,
            color: 'text-chart-2',
            ach_fm: (item.re_m / item.target_all_sales * 100).toFixed(2) + '%'
        }))

        const psChartData = levelData.map(item => ({
            territory: item.name,
            target: item.target_all_sales,
            actual: item.ps_m,
            drr: item.drr_ps,
            color: 'text-chart-4',
            ach_fm: (item.ps_m / item.target_all_sales * 100).toFixed(2) + '%'
        }))

        return (
            <section key={level} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ProgressCard
                        date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyyy')}
                        title='IO'
                        data={ioChartData}
                    />
                    <ProgressCard
                        date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyyy')}
                        title='RE'
                        data={reChartData}
                    />
                    <ProgressCard
                        date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyyy')}
                        title='PS'
                        data={psChartData}
                    />
                </div>
            </section>
        );
    };

    const renderChartsForBrownGreen = (level: string, title: string) => {
        const levelData = groupedData[level];

        if (!levelData || levelData.length === 0) {
            return (
                <div key={level} className="overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
                    <h2 className="text-2xl font-semibold">{title}</h2>
                    <p>No data available for {levelData[0].name}.</p>
                </div>
            );
        }

        const brownfieldData = levelData.map(item => ({
            territory: item.name,
            target: item.target_brownfield,
            actual: item.brownfield,
            drr: parseFloat(item.drr_brownfield.replace('%', '')),
            color: 'text-orange-900',
            ach_fm: (item.brownfield / item.target_brownfield * 100).toFixed(2) + '%'
        }))

        const greenfieldData = levelData.map(item => ({
            territory: item.name,
            target: item.target_greenfield,
            actual: item.greenfield,
            drr: parseFloat(item.drr_greenfield.replace('%', '')),
            color: 'text-teal-500',
            ach_fm: (item.greenfield / item.target_greenfield * 100).toFixed(2) + '%'
        }))

        return (
            <section key={level} className="space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ProgressCard
                        date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyyy')}
                        title='Brownfield'
                        data={brownfieldData}
                    />
                    <ProgressCard
                        date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyyy')}
                        title='Greenfield'
                        data={greenfieldData}
                    />
                </div>
            </section>
        );
    };

    const isDataActuallyAvailable = data && data.length > 0 && sfData && sfData.length > 0

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header Section with Filters */}
            <div className=" px-6 py-4">
                <Filters daysBehind={2} handleClick={handleClick} disabled={isLoading || isLoadingSf} />
            </div>

            <div className="mx-auto px-4 py-8 space-y-12">
                {(() => {
                    if (isLoading || isLoadingSf) {
                        return (
                            <div className="flex h-64 items-center justify-center">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600 dark:text-gray-400">Loading charts data...</p>
                                </div>
                            </div>
                        );
                    }

                    if (isError && isSfError) {
                        if (!isDataActuallyAvailable) {
                            return (
                                <div className="flex h-64 items-center justify-center">
                                    <div className="text-center text-red-600 dark:text-red-400">
                                        <p>Error: {error?.message}</p>
                                    </div>
                                </div>
                            );
                        }
                    }

                    if (isDataActuallyAvailable) {
                        return (
                            <div className="space-y-12">
                                {/* Error Warning */}
                                {isError && isSfError && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    Warning: Failed to update data. Displaying last available data. Error: {error?.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* KPI Overview Section */}
                                <section className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Overview</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">Key performance indicators and metrics</p>
                                    </div>
                                    <SectionCards data={data} />
                                </section>

                                {/* IO-RE-PS Charts Section */}
                                <section className="space-y-10">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">IO-RE-PS Performance</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">Input Order, RE, and Put in Service metrics</p>
                                    </div>

                                    {Object.keys(groupedData)
                                        .filter(level => level !== '')
                                        .map(level => {
                                            let title = "";
                                            switch (level) {
                                                case 'region': title = 'Regional IO-RE-PS'; break;
                                                case 'branch': title = 'Branch IO-RE-PS'; break;
                                                case 'wok': title = 'WOK IO-RE-PS'; break;
                                                case 'sto': title = 'STO IO-RE-PS'; break;
                                                default: title = `${level} IO-RE-PS`;
                                            }
                                            return renderChartsForIOREPS(level, title);
                                        })}
                                </section>

                                {/* Brownfield & Greenfield Section */}
                                <section className="space-y-10">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Brownfield & Greenfield</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">Territory development and expansion metrics</p>
                                    </div>

                                    {Object.keys(groupedData)
                                        .filter(level => level !== '')
                                        .map(level => {
                                            let title = "";
                                            switch (level) {
                                                case 'region': title = 'Regional Territory'; break;
                                                case 'branch': title = 'Branch Territory'; break;
                                                case 'wok': title = 'WOK Territory'; break;
                                                case 'sto': title = 'STO Territory'; break;
                                                default: title = `${level} Territory`;
                                            }
                                            return renderChartsForBrownGreen(level, title);
                                        })}
                                </section>

                                {/* Analytics & Data Section - Improved bottom layout */}
                                <section className="space-y-6">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">PS by Channel & SF</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">Detailed PS by Channel and Sales Force</p>
                                    </div>

                                    {/* First Row: Pie Chart and Table */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <ChartPie
                                                date={format(selectedDate ? selectedDate : subDays(new Date(), 2), 'dd MMM yyyy')}
                                                data={data}
                                            />
                                        </div>

                                        <div>
                                            <SalesForce data={sfData} selectedDate={selectedDate ?? subDays(new Date(), 2)} />
                                        </div>
                                    </div>
                                </section>

                                {/* Funneling Group & WO by LoS */}
                                <section className="space-y-6">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Funneling Group & WO by LoS</h2>
                                    </div>

                                    {/* Second Row: Funneling Group */}
                                    <div className="grid grid-cols-1 xl:grid-cols-11 gap-4 items-start">
                                        <div className="col-span-5">
                                            <FunnelingGroup
                                                data={data}
                                                selectedDate={selectedDate ?? subDays(new Date(), 2)}
                                            />
                                        </div>

                                        <div className="col-span-1 self-center mx-auto">
                                            <div className="flex items-center justify-center p-2 rounded-full size-10 bg-muted">
                                                <ChevronRight className="size-8 text-neutral-500 font-bold" />
                                            </div>
                                        </div>

                                        <div className="col-span-5">
                                            <WOLoS
                                                data={data}
                                                selectedDate={selectedDate ?? subDays(new Date(), 2)}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* FALLOUT DETAIL */}
                                <section className="space-y-6">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fallout Detail</h2>
                                    </div>

                                    <FalloutDetail data={data} selectedDate={selectedDate ?? subDays(new Date(), 2)} />
                                </section>
                            </div>
                        );
                    }

                    if (fetchDataClicked && (isSuccess || isSfSuccess || isError) && !isDataActuallyAvailable) {
                        return (
                            <div className="flex h-64 items-center justify-center">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">No data found for the selected filters.</p>
                                </div>
                            </div>
                        );
                    }

                    if (!fetchDataClicked) {
                        return (
                            <div className="flex h-64 items-center justify-center">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">"Tampilkan data" to view reports.</p>
                                </div>
                            </div>
                        );
                    }

                    return null;
                })()}
            </div>
        </div>
    )
}

export default Page