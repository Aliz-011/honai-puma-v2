import { queryOptions, useQuery } from "@tanstack/react-query"
import { authClient } from '@/lib/auth-client'

export const useCurrentSession = () => {
    return useQuery(currentSessionOptions)
}

export const currentSessionOptions = queryOptions({
    queryKey: ['current-session'],
    queryFn: async () => {
        const response = await authClient.getSession()

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    },
    staleTime: 60 * 1000 * 15
})