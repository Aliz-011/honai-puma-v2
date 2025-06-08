import { Metadata } from "next"

import Page from "./page"

export const metadata: Metadata = {
    title: 'Sales & Fulfilment',
    description: 'Sales & Fulfilment Household for Honai PUMA'
}

const Layout = () => {
    return (
        <Page />
    )
}
export default Layout