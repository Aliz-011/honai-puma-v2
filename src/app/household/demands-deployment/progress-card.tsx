import { endOfMonth, format, startOfMonth } from "date-fns";

import { cn } from "@/lib/utils";

type ProgressCardParams = {
    date: Date;
    data: {
        label: string;
        total_port: number;
        used_port: number;
        ach: string;
        style?: string;
    }[];
    title: string;
}

export const ProgressCard = ({ date, data, title }: ProgressCardParams) => {
    const selectedDate = new Date(date)
    const lastDayOfSelectedMonth = endOfMonth(selectedDate);
    const isEndOfMonth = selectedDate.getDate() === lastDayOfSelectedMonth.getDate();

    const endOfCurrMonth = isEndOfMonth ? lastDayOfSelectedMonth : selectedDate;

    const currStartOfMonth = format(startOfMonth(selectedDate), 'd')
    const currDate = format(endOfCurrMonth, 'dd MMM yyyy')

    return (
        <div className="bg-white dark:bg-white/[0.03] rounded-lg shadow-md overflow-hidden w-full h-fit">
            <div className="bg-red-700 text-white p-3">
                <h3 className="text-lg font-bold">{title}</h3>
            </div>
            <div className="overflow-x-auto w-full">
                <table className="w-full text-sm">
                    <thead className="bg-red-100">
                        <tr>
                            <th className="px-3 py-2 text-left font-semibold">Golive</th>
                            <th className="px-3 py-2 text-right font-semibold">Total Port</th>
                            <th className="px-3 py-2 text-right font-semibold">Used Port</th>
                            <th className="px-3 py-2 text-right font-semibold">%Occ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="px-3 py-2 font-normal">{item.label}</td>
                                <td className="px-3 py-2 text-right font-bold">{item.total_port}</td>
                                <td className="px-3 py-2 text-right font-bold">{item.used_port}</td>
                                <td className="px-3 py-2 text-right">
                                    <span className={`px-2 py-1 font-normal`}>
                                        {item.ach}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const GoliveCard = ({ data, title }: {
    data: {
        label: string;
        value: number | string;
    }[];
    title: string;
}) => {
    return (
        <div className="bg-white/95 backdrop-blur-lg rounded-lg p-6 border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
            <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            </div>

            <div className="space-y-4">
                {data.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600 font-medium text-sm">{item.label}</span>
                        <span className={cn("px-2 py-1.5 rounded-lg font-bold text-sm")}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export const DemandData = ({ data }: { data: { metric: string, value: number | string }[] }) => {
    return (
        <div className="bg-white rounded-xl p-6">
            <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Demand Analysis</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Metric</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-none">
                                <td className="p-3 text-gray-900 font-medium">{row.metric}</td>
                                <td className="p-3 text-gray-900 font-semibold">{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}