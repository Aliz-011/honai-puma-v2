import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
// import { ThemeProvider } from '@/components/theme-provider'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { PropsWithChildren } from 'react'

const HonaiLayout = ({ children }: PropsWithChildren) => {
    return (
        <SidebarProvider>
            <AppSidebar variant='inset' />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            {/* <ThemeProvider defaultTheme="light" storageKey="honai-ui-theme"> */}
                            {children}
                            {/* </ThemeProvider> */}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
export default HonaiLayout