'use client'

import { redirect } from "next/navigation"

import { useCurrentSession } from "@/hooks/use-current-session"

const Page = () => {
    const { data: session, isLoading: isLoadingUser } = useCurrentSession()

    if (!session?.user) {
        redirect('/login')
    }

    return null
}
export default Page