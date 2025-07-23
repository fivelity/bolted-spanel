<script lang="ts">
	import '../app.postcss';
	import { AppShell } from '@skeletonlabs/skeleton';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { ThemeInit } from 'svelte-ux';

	// Initialize Skeleton popup system
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
</script>

<ThemeInit />

<AppShell>
	<slot />
</AppShell>