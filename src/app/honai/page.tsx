'use client'

import { useCurrentSession } from "@/hooks/use-current-session";
import { redirect } from "next/navigation";

export default function HomeComponent() {
    const { data } = useCurrentSession()

    if (!data) {
        redirect('/login')
    }

    return redirect('/honai/revenue-gross')
}
