'use client'

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import { ArrowRight, HouseWifi, Shield, TabletSmartphone, Users, Zap } from "lucide-react";

import { Header } from "@/components/header"
import Loader from "@/components/loader"
import { useCurrentSession } from "@/hooks/use-current-session"

export default function Home() {
  const { data: session, isLoading } = useCurrentSession()

  const router = useRouter()

  useEffect(() => {
    // Wait until the query is finished
    if (!isLoading && !session?.user) {
      // If loading is done and there's still no data, redirect
      router.push('/login')
    }
  }, [isLoading, session?.user, router])

  if (isLoading) {
    return <Loader />;
  }

  if (session?.user) {
    return (
      <>
        <Header />
        <main className="max-w-screen-2xl mx-auto w-full h-[80vh] pt-5 sidebar">
          <div className="flex flex-1 gap-8 items-center justify-center h-full">
            {/* Mobile */}
            <Link className="font-semibold text-lg uppercase" href='/puma'>Mobile</Link>
            <Link className="font-semibold text-lg uppercase" href='/household'>Household</Link>
          </div>
        </main >
      </>
    )
  }

  return null;
}
