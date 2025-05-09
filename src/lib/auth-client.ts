import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, usernameClient } from 'better-auth/client/plugins'
import { auth } from "./auth";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000", // UBAH MENGGUNAKAN NEXT_PUBLIC_APP_URL DAN BUKAN LOCALHOST:3000
    plugins: [usernameClient(), inferAdditionalFields<typeof auth>()]
});
