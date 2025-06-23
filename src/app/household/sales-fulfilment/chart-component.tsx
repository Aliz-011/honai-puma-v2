"use client"

import { Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, LabelList } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import { ResponseData } from "./page"

const chartConfig = {
    target: {
        label: "Target",
        color: "hsl(0, 84%, 60%)",
    },
    actual: {
        label: "Actual",
        color: "hsl(120, 61%, 50%)",
    },
    drr: {
        label: "Daily Run Rate",
        color: "hsl(217, 91%, 60%)",
    },
} satisfies ChartConfig



type IOREPSParams = {
    date: string;
    title: string;
    data: {
        territory: string | null;
        target: number;
        actual: number;
        drr: number;
    }[]
}

export function IOREPSChart({ date, data: chartData, title }: IOREPSParams) {
    return (
        <Card className="@container/card shadow-none border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <CardHeader className="relative">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{date}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-2.5 px-0">
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <ComposedChart data={chartData} margin={{ left: 0, right: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="territory"
                            tickLine={false}
                            axisLine={false}
                            textAnchor="end"
                            interval={0}
                        />
                        <YAxis
                            yAxisId="bars"
                            orientation="left"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="line"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            yAxisId="bars"
                            dataKey="target"
                            fill="var(--color-target)"
                            radius={[2, 2, 0, 0]}
                            maxBarSize={40}
                        />
                        <Bar
                            yAxisId="bars"
                            dataKey="actual"
                            fill="var(--color-actual)"
                            radius={[2, 2, 0, 0]}
                            maxBarSize={40}
                        />
                        <Line
                            yAxisId="line"
                            type="monotone"
                            dataKey="drr"
                            stroke="var(--color-drr)"
                            strokeWidth={3}
                            dot={{ fill: "var(--color-drr)", strokeWidth: 2, r: 4 }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
            {/* <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
            </CardFooter> */}
        </Card>
    )
}

export function BrownGreenChart({ data: chartData, date, title }: IOREPSParams) {
    return (
        <Card className="@container/card shadow-none border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <CardHeader className="relative">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{date}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-2.5 px-0">
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <ComposedChart data={chartData} margin={{ left: 0, right: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="territory"
                            tickLine={false}
                            axisLine={false}
                            textAnchor="end"
                            interval={0}
                        />
                        <YAxis
                            yAxisId="bars"
                            orientation="left"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="line"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            yAxisId="bars"
                            dataKey="target"
                            fill="var(--color-target)"
                            radius={[2, 2, 0, 0]}
                            maxBarSize={40}
                        />
                        <Bar
                            yAxisId="bars"
                            dataKey="actual"
                            fill="var(--color-actual)"
                            radius={[2, 2, 0, 0]}
                            maxBarSize={40}
                        />
                        <Line
                            yAxisId="line"
                            type="monotone"
                            dataKey="drr"
                            stroke="var(--color-drr)"
                            strokeWidth={3}
                            dot={{ fill: "var(--color-drr)", strokeWidth: 2, r: 4 }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

const chartConfigPie = {
    visitors: {
        label: "Channel",
    },
    digital: {
        label: "Digital",
        color: "var(--chart-1)",
    },
    grapari: {
        label: "GraPari",
        color: "var(--chart-2)",
    },
    agency: {
        label: "Agency",
        color: "var(--chart-3)",
    },
    community: {
        label: "Community",
        color: "var(--chart-4)",
    }
} satisfies ChartConfig

type PieParams = {
    date: string;
    data: ResponseData[]
}

export function ChartPie({ data, date }: PieParams) {
    const chartData = [
        { channel: "digital", ach_fm: parseFloat(data[0].ach_fm_indihome.replace('%', '')), ach_fm_per: data[0].ach_fm_indihome, fill: "var(--color-digital)" },
        { channel: "grapari", ach_fm: parseFloat(data[0].ach_fm_grapari.replace('%', '')), ach_fm_per: data[0].ach_fm_grapari, fill: "var(--color-grapari)" },
        { channel: "agency", ach_fm: parseFloat(data[0].ach_fm_agency.replace('%', '')), ach_fm_per: data[0].ach_fm_agency, fill: "var(--color-agency)" },
        { channel: "community", ach_fm: parseFloat(data[0].ach_fm_community.replace('%', '')), ach_fm_per: data[0].ach_fm_community, fill: "var(--color-community)" },
    ]

    return (
        <Card className="@container/card flex flex-col max-h-[380px] shadow-none border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-0.5">
            <CardHeader>
                <CardTitle>PS By Channel</CardTitle>
                <CardDescription>{date}</CardDescription>
            </CardHeader>
            <CardContent className="pb-0 flex-1">
                <ChartContainer config={chartConfigPie} className="[&_.recharts-pie-label-text]:fill-foreground mx-auto my-auto aspect-square max-h-[250px] pb-0 pt-0">
                    <PieChart margin={{ top: 20, bottom: 20 }}>
                        <ChartTooltip content={<ChartTooltipContent labelKey="visitors" />} />
                        <Pie data={chartData} dataKey="ach_fm" label={({ payload }) => payload.ach_fm_per} nameKey="channel" />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="channel" />}
                            className="translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}