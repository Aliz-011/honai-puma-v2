import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import { subDays } from 'date-fns'

import "react-datepicker/dist/react-datepicker.css";

import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

import { useSelectDate } from '@/hooks/use-select-date'
import { useSelectRegion } from '@/hooks/use-select-region';
import { useSelectBranch } from '@/hooks/use-select-branch';
import { useSelectSubbranch } from '@/hooks/use-select-subbranch';
import { useSelectCluster } from '@/hooks/use-select-cluster';
import { useSelectKabupaten } from '@/hooks/use-select-kabupaten';
import { Skeleton } from '@/components/ui/skeleton';
import { client } from '@/lib/client';

export const Filters = ({ daysBehind }: { daysBehind: number }) => {
    const { date: selectedDate, setDate } = useSelectDate()
    const { region: selectedRegion, setSelectedRegion } = useSelectRegion()
    const { branch: selectedBranch, setSelectedBranch } = useSelectBranch()
    const { subbranch: selectedSubbranch, setSelectedSubbranch } = useSelectSubbranch()
    const { cluster: selectedCluster, setSelectedCluster } = useSelectCluster()
    const { setSelectedKabupaten } = useSelectKabupaten()
    const { data: areas, isLoading: isLoadingAreas } = useQuery({
        queryKey: ['areas'],
        queryFn: async () => {
            const response = await client.api.areas.$get()

            if (!response.ok) {
                throw new Error('Failed to fetch areas')
            }

            const { data } = await response.json()

            return data
        },
        staleTime: 60 * 1000 * 60 * 24, gcTime: 60 * 1000 * 15, retry: 2, refetchOnWindowFocus: false
    })

    const handleRegionChange = (value: string) => {
        setSelectedRegion(value);
        setSelectedBranch("");
        setSelectedSubbranch("");
        setSelectedCluster("");
        setSelectedKabupaten("");
    };

    const handleBranchChange = (value: string) => {
        setSelectedBranch(value);
        setSelectedSubbranch("");
        setSelectedCluster("");
        setSelectedKabupaten("");
    };

    const handleSubbranchChange = (value: string) => {
        setSelectedSubbranch(value);
        setSelectedCluster("");
        setSelectedKabupaten("");
    };

    const handleClusterChange = (value: string) => {
        setSelectedCluster(value);
        setSelectedKabupaten("");
    };

    const handleDateChange = (date: Date | null) => {
        const today = new Date().getDate();
        const lastDayOfMonth = new Date(date!.getFullYear(), date!.getMonth() + 1, 0).getDate();
        const day = Math.min(today, lastDayOfMonth); // Ensure valid day in the month

        // this for month picker, doesnt include day
        // setSelectedDate(new Date(date!.getFullYear(), date!.getMonth(), day));

        // this for date picker, day included
        const notNullDate = date ? date : subDays(new Date(), daysBehind)
        setDate(notNullDate)
    }

    if (isLoadingAreas || !areas) {
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

    const getFilteredSubbranches = () => {
        const area = areas.find((a) => a.regional === selectedRegion);
        const branch = area?.branches.find((b) => b.branchNew === selectedBranch);
        return branch?.subbranches.map(area => ({ label: area.subbranchNew, value: area.subbranchNew })) || [];
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
                <Label>Region</Label>
                <Select onValueChange={handleRegionChange} defaultValue={regionalOptions[0].value}>
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select Region' />
                    </SelectTrigger>
                    <SelectContent>
                        {regionalOptions.map(region => (
                            <SelectItem value={region.value} key={region.value}>{region.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                <Label>Subbranch</Label>
                <Select onValueChange={handleSubbranchChange} defaultValue="" value={selectedSubbranch}>
                    <SelectTrigger disabled={!selectedBranch} className='w-full'>
                        <SelectValue placeholder='Select Subbranch' />
                    </SelectTrigger>
                    <SelectContent>
                        {getFilteredSubbranches().map(subbranch => (
                            <SelectItem key={subbranch.value} value={subbranch.value}>{subbranch.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className='space-y-2'>
                <Label>Cluster</Label>
                <Select onValueChange={handleClusterChange} defaultValue="" value={selectedCluster}>
                    <SelectTrigger disabled={!selectedSubbranch} className='w-full'>
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
                <Button onClick={() => {
                    setSelectedBranch('')
                    setSelectedSubbranch('')
                    setSelectedCluster('')
                }} disabled={!selectedBranch || (!selectedBranch && !selectedSubbranch && !selectedCluster)} className="cursor-pointer">
                    Clear Filter
                </Button>
            </div>
        </div>
    )
}