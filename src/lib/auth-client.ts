import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, usernameClient } from 'better-auth/client/plugins'
import { auth } from "./auth";

export const authClient = createAuthClient({
    baseURL:
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
    plugins: [usernameClient(), inferAdditionalFields<typeof auth>()]
});
