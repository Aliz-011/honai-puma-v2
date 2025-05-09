'use client'

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { InferRequestType, InferResponseType } from "hono"
import { HTTPResponseError } from "hono/types"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client } from "@/lib/client";

type ResponseType = InferResponseType<typeof client.api['update-password']['$post']>
type RequestType = InferRequestType<typeof client.api['update-password']['$post']>['json']

export const PasswordForm = () => {
    const mutation = useMutation<ResponseType, HTTPResponseError, RequestType>({
        mutationFn: async json => {
            const response = await client.api['update-password']['$post']({ json })

            return await response.json()
        }
    })

    const queryClient = useQueryClient()

    const form = useForm({
        defaultValues: {
            password: '',
            newPassword: '',
            confirmPassword: ''
        },
        validators: {
            onSubmit: z.object({
                password: z.string().min(1, "Enter your current password."),
                newPassword: z.string().min(8, 'Password must be at least 8 characters').max(30, "Password cannot exceed 30 characters")
                    .regex(
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/,
                        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
                    ),
                confirmPassword: z.string().min(1, "Confirm your new password.")
            }).superRefine(({ newPassword, confirmPassword }, ctx) => {
                if (newPassword !== confirmPassword) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Passwords do not match',
                        path: ['confirmPassword']
                    })
                }
            })
        },
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync(
                { newPassword: value.newPassword, oldPassword: value.password },
                {
                    onSuccess: ({ message }) => {
                        queryClient.invalidateQueries({ queryKey: ['current-session'] })
                        toast.success(message)
                    },
                    onError: (error) => {
                        toast.error(error.message)
                    },
                })
        }
    })

    return (
        <form className="space-y-8" onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
        }}>
            <div>
                <form.Field name="password">
                    {(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>Current Password</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.map((error) => (
                                <p key={error?.message} className="text-red-500">
                                    {error?.message}
                                </p>
                            ))}
                        </div>
                    )}
                </form.Field>
            </div>

            <div>
                <form.Field name="newPassword">
                    {(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>New Password</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.map((error) => (
                                <p key={error?.message} className="text-red-500">
                                    {error?.message}
                                </p>
                            ))}
                        </div>
                    )}
                </form.Field>
            </div>

            <div>
                <form.Field name="confirmPassword">
                    {(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>Confirm Password</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.map((error) => (
                                <p key={error?.message} className="text-red-500">
                                    {error?.message}
                                </p>
                            ))}
                        </div>
                    )}
                </form.Field>
            </div>

            <form.Subscribe>
                {(state) => (
                    <Button
                        type="submit"
                        className="cursor-pointer"
                        disabled={!state.canSubmit || state.isSubmitting}
                    >
                        {state.isSubmitting ? "Submitting..." : "Update Password"}
                    </Button>
                )}
            </form.Subscribe>
        </form>
    )
}