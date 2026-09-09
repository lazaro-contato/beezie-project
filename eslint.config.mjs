import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importX, { createNodeResolver } from "eslint-plugin-import-x";

const tsconfigPath = fileURLToPath(new URL("./tsconfig.json", import.meta.url));

// `import-x/no-restricted-paths` resolves each import specifier to a real
// file before checking it against a zone. The plugin's own default resolver
// only tries `.mjs/.cjs/.js/.json/.node` and does not read `tsconfig.json`
// `paths`, so left unconfigured it silently fails to resolve both `.ts`/
// `.tsx` specifiers and the `@/*` alias — the boundary rules below would
// then never fire, on any import, without ESLint reporting an error.
// `createNodeResolver` is exported by eslint-plugin-import-x itself, so this
// needs no extra resolver package.
const resolver = createNodeResolver({
  extensions: [".mjs", ".cjs", ".js", ".jsx", ".ts", ".tsx", ".json", ".node"],
  tsconfig: { configFile: tsconfigPath },
});

// Boundary rules, one per row of docs/structure.md section 6. These are what
// turn the layer diagram in that document into something `pnpm lint` enforces
// instead of something a reviewer checks by eye.
const boundaryZones = [
  // An island never reaches past its props into the server-only world: the
  // db client, the RNG/fairness modules, env parsing, the prefs cookie
  // writer, or any feature's data-reading layer.
  //
  // Split into two zones sharing the same target: `no-restricted-paths`
  // requires every entry in one zone's `from` array to be either all glob
  // patterns or all exact paths, and `lib/env.ts` / `lib/prefs.server.ts`
  // are exact paths while the rest use `**`.
  //
  // `**/queries*.ts`, not `**/queries.ts`: phase 6 split
  // `features/reveal/queries.ts` into that file plus `queries.pull.ts`
  // (docs/decisions.md D43) so `getPull`'s `"use cache"`-adjacent test could
  // stay meaningful rather than being exempted. Without widening this glob,
  // `queries.pull.ts` would sit outside every boundary zone below and be
  // importable from a `.client.tsx` with no lint error — watched to fail per
  // D10 before being trusted (see this phase's report).
  {
    target: ["**/*.client.tsx"],
    from: ["lib/db/**", "lib/pull/**", "**/queries*.ts"],
  },
  {
    target: ["**/*.client.tsx"],
    from: ["lib/env.ts", "lib/prefs.server.ts"],
  },
  // components/ is the UI kit with no domain knowledge. It must not know a
  // domain, an entity or a route exists.
  {
    target: ["components/**"],
    from: ["features/**", "entities/**", "app/**"],
  },
  // entities/ is the shared card: every domain builds on it, so it must not
  // build on any of them. It may reach the kit and lib, nothing above.
  {
    target: ["entities/**"],
    from: ["features/**", "app/**"],
  },
  // Narrower than the `components/**` rule above, and deliberately: a card
  // *has* a tier, so the entity may use `lib/pull/tiers.ts`, which is pure
  // vocabulary. What it may not reach is the draw path and data access.
  {
    target: ["entities/**"],
    from: ["lib/db/**", "**/queries*.ts"],
  },
  {
    target: ["entities/**"],
    from: [
      "lib/env.ts",
      "lib/prefs.server.ts",
      "lib/pull/draw.ts",
      "lib/pull/fairness.ts",
      "lib/pull/odds.ts",
      "lib/pull/rng.ts",
    ],
  },
  // A domain never imports a route. app/ composes; it is not a library.
  {
    target: ["features/**", "entities/**", "components/**", "lib/**"],
    from: ["app/**"],
  },
  // Primitives under components/ carry no directive, which makes them
  // universal: they render on the server today and compile into the client
  // bundle the moment an island imports one. A server-only module reached
  // from here is therefore a client-boundary violation waiting for the phase
  // that first imports the primitive into an island — a build failure far
  // from the edit that caused it. Same split as the island zone above, for
  // the same glob-versus-exact-path reason.
  {
    target: ["components/**"],
    from: ["lib/db/**", "lib/pull/**", "**/queries*.ts"],
  },
  {
    target: ["components/**"],
    from: ["lib/env.ts", "lib/prefs.server.ts"],
  },
  // lib/ is pure and testable. Nothing above it may be imported back in.
  {
    target: ["lib/**"],
    from: ["app/**", "features/**", "entities/**", "components/**"],
  },
  // Domains compose the shared card entity, components and lib — never each
  // other. No sideways imports between machine, checkout and reveal.
  {
    target: ["features/machine/**"],
    from: ["features/reveal/**", "features/checkout/**"],
  },
  {
    target: ["features/checkout/**"],
    from: ["features/machine/**", "features/reveal/**"],
  },
  {
    target: ["features/reveal/**"],
    from: ["features/machine/**", "features/checkout/**"],
  },
  // The bounded market drift on the odds panel's average-value figure must
  // never be reachable from the draw path (docs/plans/phase-3.md section 2,
  // docs/decisions.md D23). `lib/market-tick.ts` consumes and returns an
  // `OddsDTO`, a shape `drawTier`/`drawPull` never see, but this zone makes
  // the separation a build failure instead of a type-shape argument alone.
  {
    target: ["lib/pull/**"],
    from: ["lib/market-tick.ts"],
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "import-x": importX,
    },
    settings: {
      "import-x/resolver-next": [resolver],
    },
    rules: {
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: boundaryZones,
        },
      ],
    },
  },
  {
    // Rule 2 of CLAUDE.md is only a mechanism, not a convention, once a
    // misnamed island fails the lint run instead of a reviewer counting
    // files. Every .tsx file except the named islands must not carry the
    // 'use client' directive.
    files: ["**/*.tsx"],
    ignores: ["**/*.client.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: 'Program > ExpressionStatement[directive="use client"]',
          message:
            "'use client' is only allowed in a file named *.client.tsx (CLAUDE.md rule 2). Rename the file or remove the directive.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reference material supplied with the brief, not project source —
    // see docs/architecture.md and docs/decisions.md D2/D4.
    "tempfiles/**",
  ]),
]);

export default eslintConfig;
