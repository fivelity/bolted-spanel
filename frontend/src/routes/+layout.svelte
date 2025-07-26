<script>
	import '../app.postcss';
	// import { ThemeInit } from 'svelte-ux'; /* Temporarily disabled due to icon resolution issues */
</script>

<!-- <ThemeInit /> -->

<main class="h-screen w-screen overflow-hidden bg-gray-900 text-white">
	<slot />
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	:global(html, body) {
		height: 100%;
		width: 100%;
	}
</style>