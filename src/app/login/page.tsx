'use client'

import { GalleryVerticalEndIcon } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from 'next/navigation'

import SignInForm from "./sign-in-form";
import Loader from "@/components/loader"
import { useCurrentSession } from "@/hooks/use-current-session";

export default function LoginPage() {
    const { data: session, isLoading } = useCurrentSession()

    const router = useRouter()

    useEffect(() => {
        // Wait until the query is finished
        if (!isLoading && session?.user) {
            // If loading is done and there's still no data, redirect
            router.push('/')
        }
    }, [isLoading, session?.user, router])

    if (isLoading) {
        return <Loader />;
    }

    if (!session?.user) {
        return (
            <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
                <div className="flex w-full max-w-sm flex-col gap-6">
                    <a href="#" className="flex items-center gap-2 self-center font-medium">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <GalleryVerticalEndIcon className="size-4" />
                        </div>
                        Honai PUMA.
                    </a>

                    <SignInForm />
                </div>
            </div>
        )
    }

    return null;
}
