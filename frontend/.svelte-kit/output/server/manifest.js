export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.BChj2hiw.js",app:"_app/immutable/entry/app.-j7lu2VB.js",imports:["_app/immutable/entry/start.BChj2hiw.js","_app/immutable/chunks/OwHoGg8g.js","_app/immutable/chunks/Cwjjotvx.js","_app/immutable/chunks/Cs-mvxKQ.js","_app/immutable/entry/app.-j7lu2VB.js","_app/immutable/chunks/Cs-mvxKQ.js","_app/immutable/chunks/Cwjjotvx.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/BgS6ufPy.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/ai-layout",
				pattern: /^\/api\/ai-layout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/ai-layout/_server.ts.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
