<script lang="ts">
	import { getSidebarContext } from '../context.svelte.js';

	const ctx = getSidebarContext();

	// Get announcement from context
	const announcement = $derived(ctx.announcement);
</script>

<!-- Hidden instructions for screen readers -->
<div id="sidebar-dnd-instructions" class="sidebar-dnd-instructions">
	{ctx.labels.dnd.instructions}
</div>

<!-- Live region for dynamic announcements -->
<div
	class="sidebar-live-region"
	role="status"
	aria-live="assertive"
	aria-atomic="true"
>
	{announcement}
</div>
