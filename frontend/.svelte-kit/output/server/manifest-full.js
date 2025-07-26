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
		client: {start:"_app/immutable/entry/start.DC0qktS4.js",app:"_app/immutable/entry/app.mU9l_ssn.js",imports:["_app/immutable/entry/start.DC0qktS4.js","_app/immutable/chunks/DuZOQN0_.js","_app/immutable/chunks/D6eG0N4H.js","_app/immutable/chunks/yRvKVl8z.js","_app/immutable/entry/app.mU9l_ssn.js","_app/immutable/chunks/yRvKVl8z.js","_app/immutable/chunks/D6eG0N4H.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/D0YBHk4e.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
