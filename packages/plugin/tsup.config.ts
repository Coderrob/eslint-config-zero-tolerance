import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'tsup';

const runtimeShimPath = fileURLToPath(
  new URL('./typescript-eslint-utils-runtime.ts', import.meta.url),
);
const runtimeImportFilter = /^@typescript-eslint\/utils$/;

export default defineConfig({
  esbuildPlugins: [
    {
      name: 'typescript-eslint-utils-runtime',
      /**
       * Redirects runtime imports to the minimal bundled utility surface.
       * @param build - The esbuild plugin API used to register the resolver.
       */
      setup(build) {
        build.onResolve({ filter: runtimeImportFilter }, () => ({
          path: runtimeShimPath,
        }));
      },
    },
  ],
});
