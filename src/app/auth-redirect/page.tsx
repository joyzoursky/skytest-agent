"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-provider";
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

                const proxyFetch: typeof window.fetch = async (input, init) => {
                    const req = new Request(input, init);

                    if (endpoint && req.url.startsWith(endpoint)) {
                        const proxyUrl = new URL('/api/authgear-proxy', window.location.origin);
                        proxyUrl.searchParams.set('url', req.url);

                        const proxiedHeaders = new Headers(req.headers);
                        proxiedHeaders.delete('origin');
                        proxiedHeaders.delete('referer');

                        const method = req.method.toUpperCase();
                        const body = method === 'GET' || method === 'HEAD' ? undefined : await req.arrayBuffer();

                        return window.fetch(proxyUrl.toString(), {
                            method,
                            headers: proxiedHeaders,
                            body,
                            redirect: req.redirect,
                        });
                    }

                    return window.fetch(req);
                };

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
