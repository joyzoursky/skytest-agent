#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const repoRoot = path.resolve(workspaceRoot, '../..');
const lockfilePath = path.resolve(repoRoot, 'package-lock.json');

const FLOORS = {
    // GHSA-52cp-r559-cp3m (merge-key chain quadratic DoS) + GHSA-5p4m-2wfm-xmqj (!!omap
    // quadratic CPU, not backported below 4.3.1) + GHSA-2883-xcg3-v3hh (maxTotalMergeKeys does
    // not limit CPU for empty merge sources), patched in 4.3.2
    'js-yaml': '4.3.2',
    // GHSA-frvp-7c67-39w9 (encoded-backslash path traversal in the Hono Node adapter)
    '@modelcontextprotocol/sdk': '1.30.0',
    '@hono/node-server': '2.0.5',
    // GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895
    'brace-expansion': '5.0.9',
    // Axios recursion, prototype-pollution, proxy, and streamed-upload advisory chain
    'axios': '1.18.0',
    // GHSA-v422-hmwv-36x6
    'body-parser': '1.20.6',
    // GHSA-v2hh-gcrm-f6hx, GHSA-4c8g-83qw-93j6, GHSA-7p8r-x3mc-p8w7 (host confusion), plus the
    // IDN/IPv6/percent-decoding SSRF + host-confusion chain (GHSA-5jgf-p345-68v8,
    // GHSA-f65p-4m7j-42xc, GHSA-fph4-wmhf-6fwf, GHSA-jqff-g426-hqxp) patched in 3.1.6
    'fast-uri': '3.1.7',
    // GHSA-gh4j-gqv2-49f6
    '@aws-sdk/xml-builder': '3.972.19',
    'fast-xml-parser': '5.7.0',
    // GHSA-2v35-w6hq-6mfw, GHSA-f6ww-3ggp-fr8h, GHSA-x6wf-f3px-wcqx, GHSA-j759-j44w-7fr8, plus
    // the requireWellFormed injection bypasses and quadratic parse/serialize DoS chain
    // (GHSA-c7q8-3ch8-vqpv, GHSA-27p8-2357-5qqv, GHSA-6gmq-8vp8-gcm6, GHSA-6h8r-xr42-gp59,
    // GHSA-8344-3jmq-59r6, GHSA-x4fp-j954-r2f4, GHSA-965w-775f-mr7g, GHSA-93r5-fhx6-vmg9)
    // patched in 0.8.15
    '@xmldom/xmldom': '0.8.15',
    // GHSA-w5hq-g745-h8pq
    'uuid': '14.0.0',
    // GHSA-xrhx-7g5j-rcj5, GHSA-3hrh-pfw6-9m5x, GHSA-f577-qrjj-4474, GHSA-2gcr-mfcq-wcc3,
    // plus CORS wildcard-credentials (GHSA-88fw-hqm2-52qc), and the CORS/language ReDoS +
    // memo() SSR cross-user disclosure + proxy Connection-header chain patched in 4.12.34
    // plus toSSG() path escape, parseBody() dot-notation memory exhaustion, and the query-parser
    // fragment cache-key differential (GHSA-gqvv-2mrq-wpjv, GHSA-g6gw-c38x-mqfc,
    // GHSA-crvj-82cr-hjcx) patched in 4.13.5
    'hono': '4.13.7',
    // GHSA-q8mj-m7cp-5q26, plus bracket-key comma array-limit bypass (GHSA-x5fp-wj9c-mxmx) and
    // attacker-controlled isBuffer DoS (GHSA-4mjr-xmp4-gh2g) patched in 6.16.0
    'qs': '6.16.0',
    // GHSA-ph9p-34f9-6g65
    'tmp': '0.2.6',
    // GHSA-5xrq-8626-4rwp, plus @vitest/mocker redirect-mock path traversal / arbitrary file
    // read (GHSA-82fw-gwwq-j7x9) patched in 4.1.11
    'vitest': '4.1.11',
    '@vitest/mocker': '4.1.11',
    // undici Set-Cookie/header-injection + WebSocket DoS chain, plus retry-interceptor response
    // desync, blob CRLF injection, and cookie-attribute injection patched in 6.28.0
    'undici': '6.28.0',
    // GHSA-96hv-2xvq-fx4p (memory-exhaustion DoS from tiny fragments/chunks), patched in 8.21.0
    'ws': '8.21.0',
    // DOMPurify hook/custom-element bypass chain, plus GHSA-55q2-fjhq-7xh7 (IN_PLACE hook removal
    // leaves a detached subtree executable) patched in 3.4.13
    'dompurify': '3.4.13',
    // GHSA-hmw2-7cc7-3qxx (form-data multipart CRLF injection), patched in 4.0.6
    'form-data': '4.0.6',
    // GHSA-fx2h-pf6j-xcff (server.fs.deny bypass) + launch-editor UNC disclosure, patched in 7.3.5
    'vite': '7.3.5',
    // GHSA-g7r4-m6w7-qqqr (dev-server arbitrary file read on Windows), patched in 0.28.1
    'esbuild': '0.28.1',
    // Next.js App Router security advisory chain, patched in 16.2.11, plus the unauthenticated
    // RCE pair on Windows hosts and in the AVIF image-optimization path
    // (GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4) patched in 16.3.3
    'next': '16.3.4',
    // GHSA-r28c-9q8g-f849
    'postcss': '8.5.18',
    // GHSA-f88m-g3jw-g9cj, plus the bundled libheif advisories GHSA-g89c-p67h-r497 and
    // GHSA-2jg2-4ch7-h545 (GHSA-rgj7-g3m4-5g8c) patched in 0.35.4
    'sharp': '0.35.4',
    // GHSA-395f-4hp3-45gv
    'shell-quote': '1.9.0',
    // GHSA-mwp4-54f8-5fhr (leading-zero octet SSRF bypass), GHSA-4xrf-jv44-h6hh,
    // GHSA-22jq-vg5j-6vgg
    'ip-address': '10.3.1',
    // GHSA-2v37-7h3g-55p8 (custom generators loop indefinitely when size is zero); the advisory
    // is fixed in 3.3.18, so the previous 3.3.17 floor still admitted the vulnerable release
    'nanoid': '3.3.18',
    // GHSA-2m8v-j782-fhvr (zero-attachment memory exhaustion)
    'socket.io-parser': '4.2.7',
    // GHSA-c83g-rgw3-j3cx (unbounded cache growth -> OOM) + GHSA-73wf-gq98-2v4g (uncaught crash
    // / prototype write via untrusted browserslist-stats.json)
    'browserslist': '4.28.9',
    // GHSA-w5vr-8v7q-w6rv (process termination on invalid input)
    'baseline-browser-mapping': '2.11.0',
};

function parseSemver(version) {
    if (typeof version !== 'string') {
        return null;
    }
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(version);
    if (!match) {
        return null;
    }
    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
        prerelease: match[4] ?? null,
    };
}

function compareSemver(a, b) {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    if (a.patch !== b.patch) return a.patch - b.patch;
    if (a.prerelease === b.prerelease) return 0;
    if (a.prerelease === null) return 1;
    if (b.prerelease === null) return -1;
    return a.prerelease < b.prerelease ? -1 : 1;
}

function extractPackageName(lockPath) {
    const segments = lockPath.split('/');
    for (let i = segments.length - 1; i >= 0; i -= 1) {
        if (segments[i] !== 'node_modules' && segments[i - 1] === 'node_modules') {
            if (segments[i].startsWith('@') && i + 1 < segments.length && segments[i + 1] !== 'node_modules') {
                return `${segments[i]}/${segments[i + 1]}`;
            }
            return segments[i];
        }
    }
    return null;
}

const raw = readFileSync(lockfilePath, 'utf8');
const lock = JSON.parse(raw);
const packages = lock.packages ?? {};

const violations = [];
for (const [lockPath, meta] of Object.entries(packages)) {
    if (!lockPath || !meta || typeof meta !== 'object' || typeof meta.version !== 'string') {
        continue;
    }
    const name = meta.name ?? extractPackageName(lockPath);
    if (!name || !(name in FLOORS)) {
        continue;
    }
    const floor = FLOORS[name];
    const actual = parseSemver(meta.version);
    const required = parseSemver(floor);
    if (!actual || !required) {
        continue;
    }
    if (compareSemver(actual, required) < 0) {
        violations.push({ path: lockPath, name, version: meta.version, floor });
    }
}

if (violations.length > 0) {
    console.error('Lockfile CVE floor check failed: vulnerable versions present in package-lock.json:');
    for (const item of violations) {
        console.error(`- ${item.name} ${item.version} < ${item.floor} at ${item.path}`);
    }
    console.error(
        '\nThese packages have known advisories patched in the floor versions above.'
        + ' Update direct deps, add overrides in package.json, or prune nested transitive copies.'
    );
    process.exit(1);
}

console.log(
    `Lockfile CVE floor check passed: ${Object.keys(FLOORS).length} packages at or above their floor versions.`
);
