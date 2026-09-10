import type { NextConfig } from 'next';

function readAllowedDevOriginsFromEnv(): string[] {
  const raw = process.env.NEXT_ALLOWED_DEV_ORIGINS;
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

const nextConfig: NextConfig = {
  // `next dev` otherwise writes apps/web/AGENTS.md and a CLAUDE.md pointing at it. This repo
  // maintains its own agent guidance in the root CLAUDE.md and docs/maintainers/, and a generated
  // file here would shadow it for anything working inside apps/web.
  agentRules: false,
  // Next.js only applies this in `next dev` for HMR/internal dev resources.
  allowedDevOrigins: readAllowedDevOriginsFromEnv(),
  // @midscene/* are server-only and must not be bundled: @midscene/core does an
  // optional debug-only `import('langsmith/wrappers')` that Turbopack otherwise tries
  // to statically resolve, breaking the build because langsmith is not installed.
  serverExternalPackages: [
    '@silvia-odwyer/photon-node',
    '@midscene/web',
    '@midscene/core',
    '@midscene/android',
    '@midscene/shared',
  ],
};

export default nextConfig;
