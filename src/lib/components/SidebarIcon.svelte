<script lang="ts">
	import type { SidebarIconProps, SidebarIcon } from '../types.js';
	import type { Component, Snippet } from 'svelte';

	let { icon, class: className = '' }: SidebarIconProps = $props();

	// Type checks for icon types
	function isComponent(icon: SidebarIcon): icon is Component<{ class?: string }> {
		return typeof icon === 'function' && !('length' in icon && icon.length === 2);
	}

	function isSnippet(icon: SidebarIcon): icon is Snippet<[{ class?: string }]> {
		return typeof icon === 'function' && 'length' in icon;
	}

	function isString(icon: SidebarIcon): icon is string {
		return typeof icon === 'string';
	}
</script>

{#if isString(icon)}
	<span class="sidebar-icon sidebar-icon--string {className}">{icon}</span>
{:else if isComponent(icon)}
	{@const IconComponent = icon}
	<IconComponent class="sidebar-icon sidebar-icon--component {className}" />
{:else if isSnippet(icon)}
	{@render icon({ class: `sidebar-icon sidebar-icon--snippet ${className}` })}
{/if}
