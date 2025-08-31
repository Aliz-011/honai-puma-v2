import { Separator } from '@/components/ui/separator'
import { SidebarNav } from './_components/sidebar-nav'
import { PropsWithChildren } from 'react'

const sidebarNavItems = [
  {
    title: "Appearance",
    href: "/puma/account/appearance",
  }
]

export default function RouteComponent({ children }: PropsWithChildren) {
  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
