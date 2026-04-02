declare module '@coderrob/eslint-plugin-zero-tolerance' {
  interface IZeroTolerancePluginConfigs extends Record<string, unknown> {
    'legacy-recommended': unknown;
    'legacy-strict': unknown;
    recommended: unknown;
    strict: unknown;
  }

  interface IZeroTolerancePlugin {
    configs: IZeroTolerancePluginConfigs;
  }

  const zeroTolerancePlugin: IZeroTolerancePlugin;

  export default zeroTolerancePlugin;
}
