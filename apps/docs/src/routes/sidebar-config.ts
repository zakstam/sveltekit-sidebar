import type { SidebarConfig } from 'sveltekit-sidebar';

export const sidebarConfig: SidebarConfig = {
	sections: [
		// Root-level page (no section wrapper)
		{
			kind: 'page',
			id: 'dashboard',
			label: 'Dashboard',
			href: '/dashboard',
			icon: '📊'
		},
		// Root-level group (no section wrapper)
		{
			kind: 'group',
			id: 'quick-actions',
			label: 'Quick Actions',
			icon: '⚡',
			defaultExpanded: true,
			items: [
				{
					kind: 'page',
					id: 'new-project',
					label: 'New Project',
					href: '/quick/new-project'
				},
				{
					kind: 'page',
					id: 'import',
					label: 'Import',
					href: '/quick/import'
				}
			]
		},
		{
			kind: 'section',
			id: 'main',
			title: 'Navigation',
			items: [
				{
					kind: 'page',
					id: 'home',
					label: 'Home',
					href: '/',
					icon: '🏠'
				},
				{
					kind: 'page',
					id: 'getting-started',
					label: 'Getting Started',
					href: '/docs/getting-started',
					icon: '🚀'
				}
			]
		},
		{
			kind: 'section',
			id: 'docs',
			title: 'Documentation',
			items: [
				{
					kind: 'group',
					id: 'components',
					label: 'Components',
					icon: '📦',
					href: '/docs/components',
					defaultExpanded: true,
					items: [
						{
							kind: 'page',
							id: 'sidebar',
							label: 'Sidebar',
							href: '/docs/components/sidebar'
						},
						{
							kind: 'page',
							id: 'sidebar-section',
							label: 'SidebarSection',
							href: '/docs/components/sidebar-section'
						},
						{
							kind: 'page',
							id: 'sidebar-page',
							label: 'SidebarPage',
							href: '/docs/components/sidebar-page'
						},
						{
							kind: 'page',
							id: 'sidebar-group',
							label: 'SidebarGroup',
							href: '/docs/components/sidebar-group'
						}
					]
				},
				{
					kind: 'group',
					id: 'guides',
					label: 'Guides',
					icon: '📖',
					items: [
						{
							kind: 'page',
							id: 'installation',
							label: 'Installation',
							href: '/docs/guides/installation'
						},
						{
							kind: 'page',
							id: 'configuration',
							label: 'Configuration',
							href: '/docs/guides/configuration'
						},
						{
							kind: 'page',
							id: 'theming',
							label: 'Theming',
							href: '/docs/guides/theming'
						},
						{
							kind: 'group',
							id: 'advanced',
							label: 'Advanced',
							items: [
								{
									kind: 'page',
									id: 'custom-icons',
									label: 'Custom Icons',
									href: '/docs/guides/advanced/custom-icons'
								},
								{
									kind: 'page',
									id: 'persistence',
									label: 'State Persistence',
									href: '/docs/guides/advanced/persistence'
								},
								{
									kind: 'group',
									id: 'deeply-nested',
									label: 'Deep Nesting Demo',
									items: [
										{
											kind: 'page',
											id: 'level-4',
											label: 'Level 4 Page',
											href: '/docs/guides/advanced/deep/level-4'
										},
										{
											kind: 'group',
											id: 'even-deeper',
											label: 'Even Deeper',
											items: [
												{
													kind: 'page',
													id: 'level-5',
													label: 'Level 5 Page',
													href: '/docs/guides/advanced/deep/level-5',
													badge: 'Deep!'
												}
											]
										}
									]
								}
							]
						}
					]
				}
			]
		},
		{
			kind: 'section',
			id: 'examples',
			title: 'Examples',
			items: [
				{
					kind: 'page',
					id: 'basic',
					label: 'Basic Example',
					href: '/examples/basic',
					icon: '✨'
				},
				{
					kind: 'page',
					id: 'advanced',
					label: 'Advanced (Schema)',
					href: '/examples/advanced',
					icon: '🎨',
					badge: 'New'
				},
				{
					kind: 'page',
					id: 'external',
					label: 'GitHub',
					href: 'https://github.com',
					icon: '🔗',
					external: true
				}
			]
		}
	],
	settings: {
		persistCollapsed: true,
		persistExpandedGroups: true,
		storageKey: 'sveltekit-sidebar-demo'
	}
};
