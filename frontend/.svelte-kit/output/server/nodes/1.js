export const index = 1;
let component_cache;
export const component = async () =>
  (component_cache ??= (await import("../entries/fallbacks/error.svelte.js"))
    .default);
export const imports = [
  "_app/immutable/nodes/1.B2_iSMZ-.js",
  "_app/immutable/chunks/CWj6FrbW.js",
  "_app/immutable/chunks/cUd3n1kI.js",
  "_app/immutable/chunks/BOYRZm52.js",
  "_app/immutable/chunks/-sVewgbm.js",
  "_app/immutable/chunks/CmyKn7di.js",
];
export const stylesheets = [];
export const fonts = [];
