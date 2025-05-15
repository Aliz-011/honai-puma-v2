import * as React from "react"
import {
    PieChart,
    Settings2,
    Command,
    Target,
    HandCoins,
    HouseWifi,
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
            title: "Revenue Gross",
            url: "#",
            icon: PieChart,
            items: [
                {
                    title: "Revenue Gross All",
                    url: "/honai/revenue-gross",
                },
                {
                    title: "Revenue ByU",
                    url: "/honai/revenue-byu",
                },
                {
                    title: "Revenue Gross Prabayar",
                    url: "/honai/revenue-gross-prabayar",
                },
            ],
        },
        {
            title: "Target SO",
            url: "#",
            icon: Target,
            items: [
                {
                    title: "SO All",
                    url: "/honai/target-so",
                }
            ],
        },
        {
            title: "Revenue New Sales",
            url: "#",
            icon: PieChart,
            items: [
                {
                    title: "Revenue New Sales All",
                    url: "/honai/revenue-new-sales/",
                },
                {
                    title: "Revenue New Sales Prabayar",
                    url: "/honai/revenue-new-sales-prabayar/",
                },
            ],
        },
        {
            title: "Paying Subs",
            url: "#",
            icon: HandCoins,
            items: [
                {
                    title: "Paying Subs All",
                    url: "/honai/paying-subs",
                },
                {
                    title: "Paying LoS 0-1 All",
                    url: "/honai/paying-los",
                }
            ],
        },
        {
            title: "Revenue CVM",
            url: "#",
            icon: PieChart,
            items: [
                {
                    title: "Revenue CVM All",
                    url: "/honai/revenue-cvm/",
                },
                {
                    title: "Revenue CVM Outlet",
                    url: "/honai/revenue-cvm-outlet",
                }
            ],
        },
        {
            title: "Revenue Redeem PV",
            url: "#",
            icon: PieChart,
            items: [
                {
                    title: "Revenue Redeem PV Prabyar",
                    url: "/honai/revenue-redeem-pv",
                }
            ],
        },
        {
            title: "Revenue SA",
            url: "#",
            icon: PieChart,
            items: [
                {
                    title: "Revenue SA All",
                    url: "/honai/revenue-sa",
                },
                {
                    title: "Revenue SA Prabayar",
                    url: "/honai/revenue-sa-prabayar",
                },
                {
                    title: "Revenue SA ByU",
                    url: "/honai/revenue-sa-byu",
                },
            ],
        },
        {
            title: "Trx SA",
            url: "#",
            icon: Target,
            items: [
                {
                    title: "Trx SA All",
                    url: "/honai/trx-sa",
                },
                {
                    title: "Trx SA Prabayar",
                    url: "/honai/trx-sa-prabayar",
                },
                {
                    title: "Trx SA ByU",
                    url: "/honai/trx-sa-byu",
                },
            ],
        },
        {
            title: "Trx New Sales",
            url: "#",
            icon: Target,
            items: [
                {
                    title: "Trx New Sales All",
                    url: "/honai/trx-new-sales",
                },
                {
                    title: "Trx New Sales Prabayar",
                    url: "/honai/trx-new-sales-prabayar",
                },
                {
                    title: "Trx New Sales ByU",
                    url: "/honai/trx-new-sales-byu",
                },
            ],
        },
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
                            <Link href="/honai">
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
                <NavDocuments items={data.projects} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
