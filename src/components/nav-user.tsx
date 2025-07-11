'use client'

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    LogOutIcon,
    MoreVerticalIcon,
    UserCircleIcon,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

import { useCurrentSession } from "@/hooks/use-current-session"
import { useRouter } from "next/navigation"
import { client } from "@/lib/client"

export function NavUser() {
    const { isMobile } = useSidebar()
    const navigate = useRouter()
    const { data: user } = useCurrentSession()
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async () => {
            const response = await client.api.signout.$post()

            return await response.json()
        },
        onSuccess: () => {
            navigate.push('/login')
            queryClient.invalidateQueries({ queryKey: ['current-session'] })
        }
    })

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg grayscale">
                                <AvatarImage src='https://github.com/shadcn.png' alt={user?.user.name} />
                                <AvatarFallback className="rounded-lg">{user?.user.name.split(' ')[0]}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user?.user.name}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user?.user.email}
                                </span>
                            </div>
                            <MoreVerticalIcon className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src='https://github.com/shadcn.png' alt={user?.user.name} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user?.user.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user?.user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate.push('/honai/account')}>
                                <UserCircleIcon />
                                Account
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                            <form onSubmit={(e) => {
                                e.preventDefault()
                                e.stopPropagation()

                                mutation.mutate()
                            }}>
                                <button className="inline-flex items-center gap-1">
                                    <LogOutIcon />
                                    Log out
                                </button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
