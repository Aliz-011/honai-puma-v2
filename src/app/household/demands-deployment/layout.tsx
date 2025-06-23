import { Metadata } from "next"

import Page from "./page"

export const metadata: Metadata = {
    title: 'Demands & Deployment',
    description: 'Demands & Deployment Household for Honai PUMA'
}

const Layout = () => {
    return (
        <Page />
    )
}
export default Layout