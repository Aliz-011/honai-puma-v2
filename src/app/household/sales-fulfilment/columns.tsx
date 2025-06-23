import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"

type SalesForce = {
    sf_code: string | null;
    ps: number;
    category: string;
}

export const columns: ColumnDef<SalesForce>[] = [
    {
        accessorKey: "sf_code",
        header: "SF Code",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("sf_code")}</div>
        ),
    },
    {
        accessorKey: "ps",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    PS
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => <div className="lowercase">{row.getValue("ps")}</div>,
    },
    {
        accessorKey: "category",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Class
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => <div>{row.getValue("category")}</div>,
    },
]