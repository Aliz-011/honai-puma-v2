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
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { type DemandsDeploymentResponseData } from "@/types"

export const DataTable = ({ data }: { data: DemandsDeploymentResponseData[]; }) => {
    return (
        <div className="w-full space-y-4">
            <h2 className="font-semibold text-xl">Alpro Profiling</h2>
            <div className="rounded-lg border">
                <Table className="bg-white dark:bg-white/[0.03]">
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Territory</TableHead>
                            <TableHead>Amount Port</TableHead>
                            <TableHead>Avail. Port</TableHead>
                            <TableHead>Occ. Alpro</TableHead>
                            <TableHead>Occ. Alpro M1</TableHead>
                            <TableHead>Alpro MoM</TableHead>
                            <TableHead>ODP</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.length ? (
                            <TableRow>
                                <TableCell>{data[0].name}</TableCell>
                                <TableCell>{data[0].amount_port.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{data[0].avai_port.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{(data[0].used / data[0].amount_port * 100).toFixed(2)}</TableCell>
                                <TableCell>{(data[0].used_m1 / data[0].amount_port_m1 * 100).toFixed(2)}</TableCell>
                                <TableCell>{(((data[0].used / data[0].amount_port) - (data[0].used_m1 / data[0].amount_port_m1)) / (data[0].used_m1 / data[0].amount_port_m1) * 100).toFixed(2)}%</TableCell>
                                <TableCell>{data[0].total_odp.toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        ) : (
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

export const DataTableODP = ({ data }: { data: DemandsDeploymentResponseData[]; }) => {
    const formattedData = [
        {
            status: 'RED',
            amount_port: data[0].amount_port_red,
            avai_port: data[0].avai_port_red,
            occ_alpro: (data[0].used_red / data[0].amount_port_red * 100).toFixed(2),
            occ_alpro_m1: (data[0].used_red_m1 / data[0].amount_port_red_m1 * 100).toFixed(2),
            occ_alpro_mom: (((data[0].used_red / data[0].amount_port_red) - (data[0].used_red_m1 / data[0].amount_port_red_m1)) / (data[0].used_red_m1 / data[0].amount_port_red_m1) * 100).toFixed(2),
            total_odp: data[0].total_odp_red,
            odp_per: (data[0].total_odp_red / data[0].total_odp * 100).toFixed(2) + '%'
        },
        {
            status: 'BLACK',
            amount_port: data[0].amount_port_black,
            avai_port: data[0].avai_port_black,
            occ_alpro: (data[0].used_black / data[0].amount_port_black * 100).toFixed(2),
            occ_alpro_m1: (data[0].used_black_m1 / data[0].amount_port_black_m1 * 100).toFixed(2),
            occ_alpro_mom: (((data[0].used_black / data[0].amount_port_black) - (data[0].used_black_m1 / data[0].amount_port_black_m1)) / (data[0].used_black_m1 / data[0].amount_port_black_m1) * 100).toFixed(2),
            total_odp: data[0].total_odp_black,
            odp_per: (data[0].total_odp_black / data[0].total_odp * 100).toFixed(2) + '%'
        },
        {
            status: 'GREEN',
            amount_port: data[0].amount_port_green,
            avai_port: data[0].avai_port_green,
            occ_alpro: (data[0].used_green / data[0].amount_port_green * 100).toFixed(2),
            occ_alpro_m1: (data[0].used_green_m1 / data[0].amount_port_green_m1 * 100).toFixed(2),
            occ_alpro_mom: (((data[0].used_green / data[0].amount_port_green) - (data[0].used_green_m1 / data[0].amount_port_green_m1)) / (data[0].used_green_m1 / data[0].amount_port_green_m1) * 100).toFixed(2),
            total_odp: data[0].total_odp_green,
            odp_per: (data[0].total_odp_green / data[0].total_odp * 100).toFixed(2) + '%'
        },
        {
            status: 'YELLOW',
            amount_port: data[0].amount_port_yellow,
            avai_port: data[0].avai_port_yellow,
            occ_alpro: (data[0].used_yellow / data[0].amount_port_yellow * 100).toFixed(2),
            occ_alpro_m1: (data[0].used_yellow_m1 / data[0].amount_port_yellow_m1 * 100).toFixed(2),
            occ_alpro_mom: (((data[0].used_yellow / data[0].amount_port_yellow) - (data[0].used_yellow_m1 / data[0].amount_port_yellow_m1)) / (data[0].used_yellow_m1 / data[0].amount_port_yellow_m1) * 100).toFixed(2),
            total_odp: data[0].total_odp_yellow,
            odp_per: (data[0].total_odp_yellow / data[0].total_odp * 100).toFixed(2) + '%'
        },

    ]

    return (
        <div className="w-full space-y-2">
            <h2 className="font-semibold text-xl">Occ ODP</h2>
            <div className="rounded-lg border">
                <Table className="bg-white dark:bg-white/[0.03]">
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Amount Port</TableHead>
                            <TableHead>Avail. Port</TableHead>
                            <TableHead>Occ. Alpro</TableHead>
                            <TableHead>Occ. Alpro M1</TableHead>
                            <TableHead>Alpro MoM</TableHead>
                            <TableHead>ODP</TableHead>
                            <TableHead>ODP %</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.length > 0 ? formattedData.map((item, index) => (
                            <TableRow key={`${item.status}-${index}`}>
                                <TableCell>
                                    <Badge className={cn(item.status === 'RED' ? 'bg-red-500' : item.status === 'YELLOW' ? 'bg-yellow-500' : item.status === 'GREEN' ? 'bg-green-500' : 'bg-black')}>{item.status}</Badge>
                                </TableCell>
                                <TableCell>{item.amount_port.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{item.avai_port.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{item.occ_alpro}</TableCell>
                                <TableCell>{item.occ_alpro_m1}</TableCell>
                                <TableCell>{item.occ_alpro_mom}%</TableCell>
                                <TableCell>{item.total_odp.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{item.odp_per}</TableCell>
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