import { redirect } from "next/navigation"
import { headers } from "next/headers"

import LoginPage from "./page"
import { auth } from "@/lib/auth"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Login | Honai PUMA'
}

const AuthLayout = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session) {
        redirect('/honai')
    }

    return (
        <LoginPage />
    )
}
export default AuthLayout