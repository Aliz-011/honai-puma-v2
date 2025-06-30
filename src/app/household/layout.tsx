import { PropsWithChildren } from "react"
import { headers } from "next/headers"

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { SiteHeader } from "@/components/site-header"
import { authClient } from "@/lib/auth-client"
import { redirect } from "next/navigation"

const HouseholdLayout = async ({ children }: PropsWithChildren) => {
    const session = await authClient.getSession()

    if (!session) {
        redirect('/login')
    }

    return (
        <SidebarProvider>
            <AppSidebar variant='inset' />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <div className="px-4 lg:px-6">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
export default HouseholdLayout