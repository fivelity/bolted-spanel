

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BqDOeQAH.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/CsZG2_yR.js","_app/immutable/chunks/Cs-mvxKQ.js"];
export const stylesheets = ["_app/immutable/assets/0.CZuJ7DVt.css"];
export const fonts = [];
