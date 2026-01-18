"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-provider";
import { createAuthgearProxyFetch } from "../authgear-proxy-fetch";
import { useI18n } from "@/i18n";

export default function AuthRedirect() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const { t } = useI18n();

    useEffect(() => {
        const finishAuth = async () => {
            try {
                const authgearModule = await import("@authgear/web");
                const authgear = authgearModule.default;

                const endpoint = process.env.NEXT_PUBLIC_AUTHGEAR_ENDPOINT || "";
                const clientID = process.env.NEXT_PUBLIC_AUTHGEAR_CLIENT_ID || "";

                const proxyFetch = createAuthgearProxyFetch(endpoint);

                try {
                    await authgear.configure({
                        clientID,
                        endpoint,
                        fetch: proxyFetch,
                    });
                } catch {
                    // ignore
                }

                await authgear.finishAuthentication();
                await refreshUser();
                router.push("/");
            } catch (error) {
                console.error("Authentication failed", error);
                router.push("/");
            }
        };

        finishAuth();
    }, [router, refreshUser]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <p className="text-lg">{t('auth.finishing')}</p>
        </div>
    );
}
