import LoginPage from "./page"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

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