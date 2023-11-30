<script>
	import Grid from 'svelte-grid';
	import gridHelp from 'svelte-grid/build/helper/index.mjs';
	import { MapLibre } from 'svelte-maplibre';
	import ChartJsComponent from '../components/ChartJSComponent.svelte';
	const { item } = gridHelp;
	const id = () => '_' + Math.random().toString(36).substr(2, 9);

	let items = [
		{
			id: id(),
			5: item({
				x: 0,
				y: 0,
				w: 2,
				h: 2
			}),
			3: item({ x: 0, w: 2, h: 2, y: 0 }),
			1: item({ x: 0, y: 0, w: 1, h: 2 }),
			data: 'chart'
		},
		{
			id: id(),
			5: item({
				x: 2,
				y: 0,
				w: 3,
				h: 2
			}),
			3: item({ x: 2, w: 1, h: 2, y: 0 }),
			1: item({ x: 0, y: 2, w: 1, h: 2 }),
			data: 'chart'
		},

		{
			id: id(),
			5: item({
				x: 0,
				y: 2,
				w: 5,
				h: 6,
				customDragger: true
			}),
			3: item({ x: 0, w: 3, h: 2, y: 2 }),
			1: item({ x: 0, y: 4, w: 1, h: 2 }),
			data: 'map'
		}
	];

	const cols = [
		[1500, 5],
		[1024, 3],
		[500, 1]
	];
</script>

<div class="demo-container size">
	<Grid {items} {cols} rowHeight={100} let:item let:dataItem let:movePointerDown>
		<div class="demo-widget content">
			{#if dataItem.data === 'map'}
				<MapLibre
					center={[0, 0]}
					zoom={3}
					class="map"
					standardControls
					style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
					attributionControl={false}
				/>
				{#if item.customDragger}
					<div class="dragger" on:pointerdown={movePointerDown}>✋ Drag me!</div>
				{/if}
			{:else if dataItem.data === 'chart'}
				<ChartJsComponent></ChartJsComponent>
			{:else}
				{dataItem.data}
			{/if}
		</div>
	</Grid>
</div>

<style>
	.size {
		max-width: 100vw;
		width: 100%;
	}
	.demo-widget {
		background: #f1f1f1;
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	:global(.map) {
		height: 100%;
		width: 100%;
	}
	.dragger {
		cursor: default;
		user-select: none;
		color: white;
		line-height: 30px;
		text-align: center;
		background: black;
		width: 100px;
		height: 30px;
		margin-top: 10px;
		border-radius: 3px;
		position: absolute;
		top: 5px;
		right: 5px;
	}
</style>
