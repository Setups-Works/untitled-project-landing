import path from "node:path";

// Trace workspace packages from the repository root so standalone output includes shared code.
export default {
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  output: "standalone",
  transpilePackages: ["@untitled/api-client", "@untitled/logic", "@untitled/validation", "@untitled/types"],
};
