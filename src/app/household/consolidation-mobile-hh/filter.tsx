'use client'

import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import { Funnel } from 'lucide-react';
import { useEffect } from 'react';
import { getDaysInMonth, getMonth, getYear, subDays } from 'date-fns'

import "react-datepicker/dist/react-datepicker.css";

import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useSelectRegion } from '@/hooks/use-select-region';
import { useSelectBranch } from '@/hooks/use-select-branch';
import { Skeleton } from '@/components/ui/skeleton';

import { useSelectDate } from '@/hooks/use-select-date';
import { client } from '@/lib/client';
import { useSelectCluster } from '@/hooks/use-select-cluster';
import { useSelectKabupaten } from '@/hooks/use-select-kabupaten';
import { useSelectSubbranch } from '@/hooks/use-select-subbranch';

export const Filters = ({ daysBehind, handleClick, disabled = false }: { daysBehind: number, handleClick: () => void, disabled?: boolean }) => {
    const { date, setDate: setSelectedDate } = useSelectDate()
    const { region: selectedRegion, setSelectedRegion } = useSelectRegion()
    const { branch: selectedBranch, setSelectedBranch } = useSelectBranch()
    const { subbranch: selectedSubbranch } = useSelectSubbranch()
    const { cluster: selectedCluster, setSelectedCluster } = useSelectCluster()
    const { setSelectedKabupaten } = useSelectKabupaten()

    const { data: maxDate, isLoading: isLoadingDate } = useQuery({
        queryKey: ['get-max-date'],
        queryFn: async () => {
            const response = await client.api['hh-max-dates'].$get()

            if (!response.ok) {
                throw new Error('Failed to get max date')
            }

            const { data } = await response.json()

            return data
        },
        staleTime: 60 * 1000 * 60 * 24,
        gcTime: 60 * 1000 * 15,
        retry: 2,
        refetchOnWindowFocus: false
    })

    const { data: areas, isLoading } = useQuery({
        queryKey: ['areas'],
        queryFn: async () => {
            const response = await client.api['areas'].$get()

            if (!response.ok) {
                throw new Error('Failed to fetch areaa')
            }

            const { data } = await response.json()

            return data
        },
        staleTime: 60 * 1000 * 60 * 24,
        gcTime: 60 * 1000 * 15,
        retry: 2,
        refetchOnWindowFocus: false
    })

    useEffect(() => {
        if (maxDate && !isLoadingDate && maxDate[0]?.cons_max_date) {
            const apiDate = new Date(maxDate[0].cons_max_date);
            // Set the date to the last day of the month from API
            const year = apiDate.getFullYear();
            const month = apiDate.getMonth();
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
            const adjustedDate = new Date(year, month, lastDayOfMonth);

            setSelectedDate(adjustedDate);
        }
    }, [maxDate, isLoadingDate, setSelectedDate]);

    const handleRegionChange = (value: string) => {
        setSelectedRegion(value);
        setSelectedBranch("");
        setSelectedKabupaten("");
    };

    const handleBranchChange = (value: string) => {
        setSelectedBranch(value);
        setSelectedCluster("");
        setSelectedKabupaten("");
    };

    const handleClusterChange = (value: string) => {
        setSelectedCluster(value);
        setSelectedKabupaten("");
    };

    const handleDateChange = (date: Date | null) => {
        const safeDate = date ?? new Date()
        const selectedYear = getYear(safeDate);
        const selectedMonth = getMonth(safeDate);

        // For any other month: use the last day of that month
        const lastDayOfSelectedMonth = getDaysInMonth(safeDate);
        setSelectedDate(new Date(selectedYear, selectedMonth, lastDayOfSelectedMonth));
    }

    if (isLoading || !areas || isLoadingDate) {
        return (
            <div className='grid grid-cols-3 sm:grid-cols- md:grid-cols-4 lg:grid-cols-4 gap-4'>
                {[1, 2, 3, 4].map((_, index) => (
                    <div className='space-y-2' key={index}>
                        <Skeleton className='h-4 w-10' />
                        <Skeleton className='h-8 w-48' />
                    </div>
                ))}
            </div>
        )
    }

    const regionalOptions = areas.map(area => ({
        label: area.regional,
        value: area.regional
    }))

    const getFilteredBranches = () => {
        const area = areas.find((a) => a.regional === selectedRegion)
        return area?.branches.map(area => ({ label: area.branchNew, value: area.branchNew })) || [];
    };

    const getFilteredClusters = () => {
        const area = areas.find((a) => a.regional === selectedRegion);
        const branch = area?.branches.find((b) => b.branchNew === selectedBranch);
        const subbranch = branch?.subbranches.find(
            (s) => s.subbranchNew === selectedSubbranch
        );
        return subbranch?.clusters.map(area => ({ label: area.cluster, value: area.cluster })) || [];
    };

    const getFilteredKabupatens = () => {
        const area = areas.find((a) => a.regional === selectedRegion);
        const branch = area?.branches.find((b) => b.branchNew === selectedBranch);
        const subbranch = branch?.subbranches.find(
            (s) => s.subbranchNew === selectedSubbranch
        );
        const cluster = subbranch?.clusters.find(
            (c) => c.cluster === selectedCluster
        );
        return cluster?.kabupatens.map(area => ({ label: area.kabupaten, value: area.kabupaten })) || [];
    };

    const renderMonthContent = (
        month: number,
        shortMonth: string,
        longMonth: string,
        day: Date
    ) => {
        const fullYear = new Date(day).getFullYear();
        const tooltipText = `Tooltip for month: ${longMonth} ${fullYear}`;

        return <span title={tooltipText}>{shortMonth}</span>;
    };

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
            <div className='space-y-2'>
                <Label>Tanggal</Label>
                <DatePicker
                    selected={date || (maxDate && !isLoadingDate ? new Date(maxDate[0].cons_max_date) : subDays(new Date(), daysBehind))}
                    renderMonthContent={renderMonthContent}
                    onChange={(date) => handleDateChange(date)}
                    dateFormat="yyyy-MM"
                    maxDate={maxDate && !isLoadingDate ? new Date(maxDate[0].cons_max_date) : subDays(new Date(), daysBehind)}
                    minDate={new Date(2025, 0, 1)}
                    className="w-full text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    calendarClassName="shadow-lg border-0"
                    customInput={
                        <input className="w-full h-8 px-2 py-1.5 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer" />
                    }
                    wrapperClassName="w-full"
                    showPopperArrow={false}
                    showMonthYearPicker
                />
            </div>
            <div className='space-y-2'>
                <Label>Branch</Label>
                <Select onValueChange={handleBranchChange} defaultValue="" value={selectedBranch}>
                    <SelectTrigger className='w-full' disabled={!selectedRegion}>
                        <SelectValue placeholder='Select Branch' />
                    </SelectTrigger>
                    <SelectContent>
                        {getFilteredBranches().map(branch => (
                            <SelectItem key={branch.value} value={branch.value}>{branch.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className='space-y-2'>
                <Label>Cluster</Label>
                <Select onValueChange={handleClusterChange} defaultValue="" value={selectedCluster}>
                    <SelectTrigger disabled={!selectedBranch} className='w-full'>
                        <SelectValue placeholder='Select Cluster' />
                    </SelectTrigger>
                    <SelectContent>
                        {getFilteredClusters().map(cluster => (
                            <SelectItem key={cluster.value} value={cluster.value}>{cluster.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className='space-y-2'>
                <Label>Kabupaten</Label>
                <Select>
                    <SelectTrigger disabled={!selectedCluster} className='w-full'>
                        <SelectValue placeholder='Select Kabupaten' />
                    </SelectTrigger>
                    <SelectContent>
                        {getFilteredKabupatens().map(kabupaten => (
                            <SelectItem key={kabupaten.value} value={kabupaten.value}>{kabupaten.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 mt-auto">
                <button onClick={handleClick} disabled={!selectedBranch || (!selectedBranch && !selectedCluster) || disabled} className="cursor-pointer px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:pointer-events-none disabled:opacity-50">
                    <Funnel className="w-3 h-3 inline mr-1" />
                    Clear Filter
                </button>
            </div>
        </div>
    )
}