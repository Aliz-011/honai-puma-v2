import * as React from "react"
import {
    PieChart,
    Settings2,
    Command,
    Target,
    HandCoins,
    HouseWifi,
    FolderIcon,
    BarChartIcon,
    ListIcon,
    LayoutDashboardIcon,
} from "lucide-react"

import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "SALES FULFILMENT",
            url: "/household/sales-fulfilment",
            icon: LayoutDashboardIcon,
        },
        {
            title: "DEMANDS & DEPLOYMENT",
            url: "/household/demands-deployment",
            icon: ListIcon,
        },
        {
            title: "REVENUE & C3MR",
            url: "/household/revenue-c3mr",
            icon: BarChartIcon,
        },
        {
            title: "OTHERS",
            url: "/household/others",
            icon: FolderIcon,
        }
    ],
    navSecondary: [
        {
            title: "Settings",
            url: "/honai/account",
            icon: Settings2,
        },
    ],
    projects: [
        {
            name: "FMC",
            url: "#",
            icon: HouseWifi,
            items: [
                {
                    title: "Line In Service",
                    url: "/honai/fmc/line-in-service",
                },
                {
                    title: "WL Connect Wifi",
                    url: "/honai/fmc/connect-wifi",
                }
            ],
        }
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Honai PUMA</span>
                                    <span className="truncate text-xs">Enterprise</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="sidebar">
                <NavMain items={data.navMain} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
