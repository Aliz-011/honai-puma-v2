import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { HTTPException } from "hono/http-exception";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { client } from "@/lib/client";

type ResponseType = InferResponseType<typeof client.api.signin.$post>
type RequestType = InferRequestType<typeof client.api.signin.$post>['json']

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useRouter();
	const queryClient = useQueryClient()
	const { isPending } = authClient.useSession();

	const mutation = useMutation<ResponseType, HTTPException, RequestType>({
		mutationFn: async (values) => {
			const response = await client.api.signin.$post({ json: values })

			return await response.json()
		},
		onSuccess: () => {
			navigate.push('/honai');
			toast.success("Sign in successful");
			navigate.refresh()
			queryClient.invalidateQueries({ queryKey: ['current-session'] })
		},
		onError: (error) => {
			toast.error(error.message || 'Failed, please try again.');
		},
	})

	const form = useForm({
		defaultValues: {
			username: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await mutation.mutateAsync(value)
		},
		validators: {
			onSubmit: z.object({
				username: z.string().trim().min(1, 'Please enter your username'),
				password: z.string().min(6, "Password must be at least 6 characters"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Welcome back</CardTitle>
					<CardDescription>
						Login with your username and password to continue.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							void form.handleSubmit();
						}}
						className="space-y-4"
					>
						<div>
							<form.Field name="username">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Username</Label>
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

						<div>
							<form.Field name="password">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Password</Label>
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
									className="w-full"
									disabled={!state.canSubmit || state.isSubmitting}
								>
									{state.isSubmitting ? "Submitting..." : "Sign In"}
								</Button>
							)}
						</form.Subscribe>
					</form>

					<div className="mt-4 text-center">
						<Button
							variant="link"
							onClick={onSwitchToSignUp}
							className="text-indigo-600 hover:text-indigo-800"
						>
							Do not have an account yet? Sign Up
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
