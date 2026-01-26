<script lang="ts">
	import { getSidebarContext } from '../context.svelte.js';

	const ctx = getSidebarContext();

	// Get announcement from context
	const announcement = $derived(ctx.announcement);
</script>

<!-- Hidden instructions for screen readers -->
<div id="sidebar-dnd-instructions" class="sidebar-dnd-instructions">
	Press Space or Enter to pick up a draggable item. Use Arrow keys to move the item. Press Enter
	to drop the item in a new position, or press Escape to cancel.
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
