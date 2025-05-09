
import { PropsWithChildren } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'

import { auth } from '@/lib/auth'

const HonaiLayout = async ({ children }: PropsWithChildren) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

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
                            {children}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
export default HonaiLayout