// `standalone` produces a minimal server (.next/standalone) that the Dockerfile copies into the runtime image.
export default { outputFileTracingRoot: import.meta.dirname, output: "standalone" };
