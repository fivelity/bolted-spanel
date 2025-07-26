type DynamicRoutes = {
	
};

type Layouts = {
	"/": undefined;
	"/api": undefined;
	"/api/ai-layout": undefined;
	"/test-layerchart": undefined
};

export type RouteId = "/" | "/api" | "/api/ai-layout" | "/test-layerchart";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/api" | "/api/ai-layout" | "/test-layerchart";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = never;