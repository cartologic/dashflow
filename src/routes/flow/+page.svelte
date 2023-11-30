<script lang="ts">
	import { writable } from 'svelte/store';
	import { SvelteFlow, Controls, MiniMap, type Node, type Edge } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import MaplibreNode from './MaplibreNode.svelte';
	import SliderNode from './SliderNode.svelte';

	import { initialNodes, initialEdges } from './nodes-and-edges';

	const nodes = writable<Node[]>(initialNodes);
	const edges = writable<Edge[]>(initialEdges);

	const nodeTypes = {
		custom: MaplibreNode,
		sliderzoomnode: SliderNode
	};
	const proOptions = { hideAttribution: true };
</script>

<div style="height:100vh;">
	<SvelteFlow {nodes} {nodeTypes} {edges} {proOptions} fitView class="bg-teal-50">
		<MiniMap />
		<Controls />
	</SvelteFlow>
</div>
