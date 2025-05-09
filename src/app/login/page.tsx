'use client'

import { GalleryVerticalEndIcon } from "lucide-react";
import { useState } from "react";

import SignInForm from "./sign-in-form";
import SignUpForm from "./sign-up-form";

export default function LoginPage() {
    const [showSignIn, setShowSignIn] = useState(true);

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="#" className="flex items-center gap-2 self-center font-medium">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <GalleryVerticalEndIcon className="size-4" />
                    </div>
                    Honai PUMA.
                </a>
                {showSignIn ? (
                    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
                ) : (
                    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
                )}
            </div>
        </div>
    )
}
