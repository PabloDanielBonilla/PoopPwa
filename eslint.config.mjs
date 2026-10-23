import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "functions/**",
    "supabase/**",
  ]),
  {
    rules: {
      // Supabase JSON/RPC payloads are dynamic maps; explicit `any` is
      // intentional at the boundary between the API and our typed UI shapes.
      "@typescript-eslint/no-explicit-any": "off",
      // The React Compiler lint rules below flag intentional localStorage and
      // media-device synchronization patterns used by this app.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
