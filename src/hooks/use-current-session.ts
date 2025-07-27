import { queryOptions, useQuery } from "@tanstack/react-query"
import type { Session } from "@auth/core/types";

export const useCurrentSession = () => {
    return useQuery(currentSessionOptions)
}

export const currentSessionOptions = queryOptions({
    queryKey: ['current-session'],
    queryFn: async () => {
        // const response = await client.api['current-user'].$get()
        const response = await fetch('/api/auth/session')

        return await response.json() as Session
    },
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5 * (60 * 1000),
    gcTime: 10 * (60 * 1000),
})