'use client'

import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import { subDays } from 'date-fns'
import { Funnel } from 'lucide-react';

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
import { useSelectWok } from '@/hooks/use-select-wok';
import { useSelectSto } from '@/hooks/use-select-sto';
import { useSelectDate } from '@/hooks/use-select-date';
import { client } from '@/lib/client';

export const Filters = ({ daysBehind, handleClick, disabled }: { daysBehind: number, handleClick: () => void, disabled: boolean }) => {
    const { date: selectedDate, setDate } = useSelectDate()
    const { region: selectedRegion, setSelectedRegion } = useSelectRegion()
    const { branch: selectedBranch, setSelectedBranch } = useSelectBranch()
    const { wok: selectedWok, setSelectedWok } = useSelectWok()
    const { setSelectedSto } = useSelectSto()
    const { data: areas, isLoading } = useQuery({
        queryKey: ['fmc-areas'],
        queryFn: async () => {
            const response = await client.api['fmc-areas'].$get()

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

    const handleRegionChange = (value: string) => {
        setSelectedRegion(value);
        setSelectedBranch("");
        setSelectedWok("");
        setSelectedSto("");
    };

    const handleBranchChange = (value: string) => {
        setSelectedBranch(value);
        setSelectedWok("");
        setSelectedSto("");
    };

    const handleWokChange = (value: string) => {
        setSelectedWok(value);
        setSelectedSto("");
    };

    const handleStoChange = (value: string) => {
        setSelectedSto(value);
    };

    const handleDateChange = (date: Date | null) => {
        const notNullDate = date ? new Date(date) : subDays(new Date(), daysBehind)
        setDate(notNullDate)
    }

    if (isLoading || !areas) {
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

    const getFilteredWoks = () => {
        const area = areas.find((a) => a.regional === selectedRegion);
        const branch = area?.branches.find((b) => b.branchNew === selectedBranch);
        return branch?.woks.map(area => ({ label: area.wok, value: area.wok })) || [];
    };

    const getFilteredStos = () => {
        const area = areas.find((a) => a.regional === selectedRegion);
        const branch = area?.branches.find((b) => b.branchNew === selectedBranch);
        const woks = branch?.woks.find(
            (s) => s.wok === selectedWok
        );
        return woks?.stos.map(area => ({ label: area.sto, value: area.sto })) || [];
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
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4'>
            <div className='space-y-2'>
                <Label>Tanggal</Label>
                <DatePicker
                    selected={selectedDate ? selectedDate : subDays(new Date(), daysBehind)}
                    renderMonthContent={renderMonthContent}
                    onChange={(date) => handleDateChange(date)}
                    dateFormat="yyyy-MM-dd"
                    maxDate={subDays(new Date(), daysBehind)}
                    minDate={new Date(2025, 0, 1)}
                    className="w-full text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    calendarClassName="shadow-lg border-0"
                    customInput={
                        <input className="w-full h-8 px-2 py-1.5 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer" />
                    }
                    wrapperClassName="w-full"
                    showPopperArrow={false}
                    showDateSelect
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
                <Label>WOK</Label>
                <Select onValueChange={handleWokChange} defaultValue="" value={selectedWok}>
                    <SelectTrigger disabled={!selectedBranch} className='w-full'>
                        <SelectValue placeholder='Select WOK' />
                    </SelectTrigger>
                    <SelectContent>
                        {getFilteredWoks().map(subbranch => (
                            <SelectItem key={subbranch.value} value={subbranch.value}>{subbranch.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 mt-auto">
                <button onClick={handleClick} disabled={!selectedBranch || (!selectedBranch && !selectedWok) || disabled} className="cursor-pointer px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:pointer-events-none disabled:opacity-50">
                    <Funnel className="w-3 h-3 inline mr-1" />
                    Clear Filter
                </button>
            </div>
        </div>
    )
}