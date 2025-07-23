export const manifest = (() => {
  function __memo(fn) {
    let value;
    return () => (value ??= value = fn());
  }

  return {
    appDir: "_app",
    appPath: "_app",
    assets: new Set([]),
    mimeTypes: {},
    _: {
      client: {
        start: "_app/immutable/entry/start.BjEt3yVq.js",
        app: "_app/immutable/entry/app.Cut4Y3Yk.js",
        imports: [
          "_app/immutable/entry/start.BjEt3yVq.js",
          "_app/immutable/chunks/CmyKn7di.js",
          "_app/immutable/chunks/-sVewgbm.js",
          "_app/immutable/chunks/BOYRZm52.js",
          "_app/immutable/entry/app.Cut4Y3Yk.js",
          "_app/immutable/chunks/BOYRZm52.js",
          "_app/immutable/chunks/-sVewgbm.js",
          "_app/immutable/chunks/CWj6FrbW.js",
          "_app/immutable/chunks/BTbfHnEm.js",
          "_app/immutable/chunks/DcYYMAFE.js",
        ],
        stylesheets: [],
        fonts: [],
        uses_env_dynamic_public: false,
      },
      nodes: [
        __memo(() => import("./nodes/0.js")),
        __memo(() => import("./nodes/1.js")),
        __memo(() => import("./nodes/2.js")),
      ],
      routes: [
        {
          id: "/",
          pattern: /^\/$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 2 },
          endpoint: null,
        },
        {
          id: "/api/ai-layout",
          pattern: /^\/api\/ai-layout\/?$/,
          params: [],
          page: null,
          endpoint: __memo(
            () => import("./entries/endpoints/api/ai-layout/_server.ts.js"),
          ),
        },
      ],
      prerendered_routes: new Set([]),
      matchers: async () => {
        return {};
      },
      server_assets: {},
    },
  };
})();
