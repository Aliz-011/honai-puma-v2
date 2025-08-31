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
            <div className="group">
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-700 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <TabletSmartphone className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-3xl font-bold text-white mb-4">Mobile</h3>
                  <p className="text-indigo-100 mb-6 leading-relaxed">
                    Cutting-edge mobile solutions for enterprise mobility, app development, and device management
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center space-x-3 text-white/90">
                      <Zap className="w-5 h-5" />
                      <span>High-performance applications</span>
                    </div>
                    <div className="flex items-center space-x-3 text-white/90">
                      <Shield className="w-5 h-5" />
                      <span>Enterprise-grade security</span>
                    </div>
                    <div className="flex items-center space-x-3 text-white/90">
                      <Users className="w-5 h-5" />
                      <span>Multi-platform support</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 group-hover:bg-white/25 border border-white/20 cursor-pointer" onClick={() => router.push('/puma')}>
                    <span>Explore Mobile</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <HouseWifi className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-3xl font-bold text-white mb-4">Household</h3>
                  <p className="text-emerald-100 mb-6 leading-relaxed">
                    Comprehensive household management solutions for smart homes, automation, and family connectivity
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center space-x-3 text-white/90">
                      <Zap className="w-5 h-5" />
                      <span>Smart home automation</span>
                    </div>
                    <div className="flex items-center space-x-3 text-white/90">
                      <Shield className="w-5 h-5" />
                      <span>Family safety features</span>
                    </div>
                    <div className="flex items-center space-x-3 text-white/90">
                      <Users className="w-5 h-5" />
                      <span>Multi-user management</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 group-hover:bg-white/25 border border-white/20 cursor-pointer" onClick={() => router.push('/household')}>
                    <span>Explore Household</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main >
      </>
    )
  }

  return null;
}
