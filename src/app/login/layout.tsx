import LoginPage from "./page"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Login | Honai PUMA'
}

const AuthLayout = async () => {

    return (
        <LoginPage />
    )
}
export default AuthLayout