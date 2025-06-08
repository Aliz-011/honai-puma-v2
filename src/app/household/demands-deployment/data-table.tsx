'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableCaption
} from "@/components/ui/table"
import { ChartDataItem } from "./page"
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const DataTable = ({ data }: { data: ChartDataItem[] | undefined; }) => {
    return (
        <div className="w-full space-y-2">
            <h2 className="font-semibold text-xl">Alpro Profiling</h2>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Territory</TableHead>
                            {/* <TableHead>Status</TableHead> */}
                            <TableHead>Amount Port</TableHead>
                            <TableHead>Avail. Port</TableHead>
                            <TableHead>Occ. Alpro</TableHead>
                            <TableHead>Occ. Alpro M1</TableHead>
                            <TableHead>Alpro MoM</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>

                        {data?.length ? data.filter(item => item.status === 'all').map((item, index) => (
                            <TableRow key={`${item.name}-${index}`}>
                                <TableCell>{item.name}</TableCell>
                                {/* <TableCell>{item.status}</TableCell> */}
                                <TableCell>{item.amount_port}</TableCell>
                                <TableCell>{item.avai_port}</TableCell>
                                <TableCell>{item.occupied_alpro_m}</TableCell>
                                <TableCell>{item.occupied_alpro_m1}</TableCell>
                                <TableCell>{item.alpro_mom}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export const DataTableODP = ({ data }: { data: ChartDataItem[] | undefined; }) => {
    return (
        <div className="w-full space-y-2">
            <h2 className="font-semibold text-xl">Occ ODP</h2>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Amount Port</TableHead>
                            <TableHead>Avail. Port</TableHead>
                            <TableHead>Occ. Alpro</TableHead>
                            <TableHead>Occ. Alpro M1</TableHead>
                            <TableHead>Alpro MoM</TableHead>
                            <TableHead>ODP %</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.length ? data.filter(item => item.status !== 'all').map((item, index) => (
                            <TableRow key={`${item.name}-${index}`}>
                                <TableCell>
                                    <Badge className={cn(item.status === 'RED' ? 'bg-red-500' : item.status === 'YELLOW' ? 'bg-yellow-500' : item.status === 'GREEN' ? 'bg-green-500' : 'bg-black')}>{item.status}</Badge>
                                </TableCell>
                                <TableCell>{item.amount_port}</TableCell>
                                <TableCell>{item.avai_port}</TableCell>
                                <TableCell>{item.occupied_alpro_m}</TableCell>
                                <TableCell>{item.occupied_alpro_m1}</TableCell>
                                <TableCell>{item.alpro_mom}</TableCell>
                                <TableCell>{item.odp_percentage}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}