'use client'

import { useCurrentSession } from "@/hooks/use-current-session"
import { redirect } from "next/navigation"

const Page = () => {
    const { data } = useCurrentSession()

    if (!data) {
        redirect('/login')
    }

    return redirect('/household/sales-fulfilment')
}
export default Page