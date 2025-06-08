import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { type ChartDataItem } from "./chart-component"

export const SectionCards = ({ data }: { data: ChartDataItem[] }) => {
    return (
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
            {data.map((item, index) => (
                <Card className="@container/card" key={index}>
                    <CardHeader className="relative">
                        <CardTitle>Ratio Fulfilment</CardTitle>

                    </CardHeader>
                    <CardContent className="flex flex-col">
                        <div className="flex items-center justify-between">
                            <span className="text-xs">PS</span>
                            <div className="text-sm font-medium">{item.ps_m}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs">RE</span>
                            <div className="text-sm font-medium">{item.re_m}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs">PS to RE</span>
                            <div className="text-sm font-medium">{item.ps_to_re}</div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1 text-sm">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            {item.name}
                        </div>
                    </CardFooter>
                </Card>
            ))}
            {data.map((item, index) => (
                <Card className="@container/card" key={index}>
                    <CardHeader className="relative">
                        <CardTitle>Daily PS</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col">
                        <div className="flex items-center justify-between">
                            <span className="text-xs">Target daily PS</span>
                            <div className="text-sm font-medium">{item.target_daily_ps}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs">Ach daily PS</span>
                            <div className="text-sm font-medium">{item.ach_daily_ps} ({item.drr_ps}%)</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs">Daily PS remain.</span>
                            <div className="text-sm font-medium">{item.daily_ps_remaining}</div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-1 text-sm">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            {item.name}
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}