'use client'

import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { InferRequestType, InferResponseType } from "hono"
import { HTTPResponseError } from "hono/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCurrentSession } from "@/hooks/use-current-session"
import { client } from "@/lib/client"

type ResponseType = InferResponseType<typeof client.api['update-profile']['$post']>
type RequestType = InferRequestType<typeof client.api['update-profile']['$post']>['json']

export const AccountForm = () => {
    const { data } = useCurrentSession()
    const mutation = useMutation<ResponseType, HTTPResponseError, RequestType>({
        mutationFn: async json => {
            const response = await client.api['update-profile']['$post']({ json })

            return await response.json()
        }
    })
    const queryClient = useQueryClient()

    const form = useForm({
        defaultValues: {
            nik: data?.user.nik || '',
            phoneNumber: data?.user.phoneNumber || ''
        },
        validators: {
            onSubmit: z.object({
                nik: z
                    .string()
                    .min(5, { message: 'NIK must be at least 5 digits' })
                    .max(8)
                    .trim()
                    .regex(/^\d+$/, { message: "NIK must contain only numbers" }),
                phoneNumber: z
                    .string()
                    .min(11, { message: 'Phone number must be at least 11 digits' })
                    .max(13)
                    .trim()
                    .regex(/^\d+$/, { message: "Phone number must contain only numbers" })
            })
        },
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync(
                { nik: value.nik, phoneNumber: value.phoneNumber },
                {
                    onSuccess: ({ message }) => {
                        queryClient.invalidateQueries({ queryKey: ['current-session'] })
                        toast.success(message)
                    },
                    onError: (error) => {
                        toast.error(error.message)
                    },
                }
            )
        }
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void form.handleSubmit()
            }}
            className="space-y-8">
            <div>
                <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input type="text" id="displayName" disabled value={data?.user.name || ''} />
                </div>
            </div>

            <div>
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input type="text" id="username" disabled value={data?.user.displayUsername || ''} />
                </div>
            </div>

            <div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input type="email" id="email" disabled value={data?.user.email || ''} />
                </div>
            </div>

            <div>
                <form.Field name="nik">
                    {(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>NIK</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="text"
                                disabled
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
                <form.Field name="phoneNumber">
                    {(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>Phone Number</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="text"
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
                        {state.isSubmitting ? "Submitting..." : "Update Profile"}
                    </Button>
                )}
            </form.Subscribe>
        </form>
    )
}