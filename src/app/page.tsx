import Link from "next/link"

import { Header } from "@/components/header"

export default function Home() {
  return (
    <>
      <Header />
      <main className="max-w-screen-2xl mx-auto w-full h-full py-5">
        <div className="flex flex-1 gap-4 items-center justify-center">
          <Link className="font-semibold text-lg uppercase" href='/honai'>Mobile</Link>
          <Link className="font-semibold text-lg uppercase" href='/household'>Household</Link>
        </div>
      </main>
    </>
  )
}
