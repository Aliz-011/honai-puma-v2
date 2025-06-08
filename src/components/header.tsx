'use client'

import { Command, LogOutIcon, UserCircleIcon } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"

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

import { useCurrentSession } from "@/hooks/use-current-session"
import { client } from "@/lib/client"

export const Header = () => {

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
        <header className="p-4 lg:px-14 border">
            <div className="max-w-screen-2xl mx-auto">
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center lg:gap-x-16">
                        <Link href="/">
                            <div className="items-center flex">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight ml-2.5">
                                    <span className="truncate font-semibold">Honai PUMA</span>
                                    <span className="truncate text-xs">Enterprise</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer rounded-full">
                            <Avatar className="h-10 w-10 rounded-full grayscale">
                                <AvatarImage src='https://github.com/shadcn.png' alt={user?.user.name} />
                                <AvatarFallback className="rounded-full">{user?.user.name.split(' ')[0]}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
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
                </div>
            </div>
        </header>
    )
}