<script lang="ts">
  import { dashboardState, dashboardActions } from '$lib/stores/dashboard.svelte';
  import { onMount } from 'svelte';
  import type { LayoutSuggestion } from '$lib/types/ai';

  let suggestions = $state<LayoutSuggestion[]>([]);
  let selectedSuggestion = $state<LayoutSuggestion | null>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      const response = await fetch('/api/ai-layout', {
        method: 'POST',
        body: JSON.stringify({
          currentWidgets: $dashboardState.currentLayout?.widgets || [],
          dashboardSize: { width: window.innerWidth, height: window.innerHeight },
          preferences: { priority: 'performance', theme: 'dark', density: 'compact' }
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      suggestions = await response.json();
    } catch (err) {
      error = (err as Error).message;
    } finally {
      isLoading = false;
    }
  });

  function applySuggestion() {
    if (selectedSuggestion && $dashboardState.currentLayout) {
      dashboardActions.applyLayoutSuggestion(selectedSuggestion);
      dashboardActions.closeAILayoutModal();
    }
  }
</script>

<div class="modal">
  {#if isLoading}
    <div>Loading AI suggestions...</div>
  {:else if error}
    <div>Error: {error}</div>
  {:else}
    <div class="suggestions-grid">
      {#each suggestions as suggestion}
        			<button
				class="suggestion-card"
				class:selected={selectedSuggestion?.id === suggestion.id}
				onclick={() => selectedSuggestion = suggestion}
				aria-label="Select {suggestion.name} layout suggestion"
			>
          <h3>{suggestion.name}</h3>
          <p>{suggestion.description}</p>
          <div class="preview">
            <!-- Mini preview of layout -->
          </div>
        			</button>
		{/each}
    </div>
    <button onclick={applySuggestion} disabled={!selectedSuggestion}>Apply Selected</button>
  {/if}
</div>
