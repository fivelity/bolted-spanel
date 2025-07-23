<script>
	import '../app.postcss';
	import { ThemeInit } from 'svelte-ux';
</script>

<ThemeInit />

<main class="min-h-screen bg-gray-900 text-white">
	<slot />
</main>