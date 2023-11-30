<script>
	import { onMount } from 'svelte';

	// URL for geoJSON data of countries
	const COUNTRIES =
		'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson';

	let deckGLContainer;
	let canvasElement;

	onMount(async () => {
		const { Deck } = await import('@deck.gl/core');
		const { GeoJsonLayer } = await import('@deck.gl/layers');

		// Initial view state settings for the map
		const INITIAL_VIEW_STATE = {
			latitude: 51.47,
			longitude: 0.45,
			zoom: 4,
			bearing: 0
		};

		// Instantiate Deck with specified container and rendering settings
		new Deck({
			container: deckGLContainer,
			canvas: canvasElement,
			width: '100%', // Width of the canvas
			height: '100%', // Height of the canvas
			style: {},
			debug: true, // Enable state logging
			useDevicePixels: true, // Device (physical) pixels resolution is used for rendering
			initialViewState: INITIAL_VIEW_STATE,
			controller: true,
			layers: [
				new GeoJsonLayer({
					id: 'base-map',
					data: COUNTRIES,
					stroked: true,
					filled: true,
					lineWidthMinPixels: 2,
					opacity: 0.4,
					getLineColor: [60, 60, 60],
					getFillColor: [200, 200, 200]
				})
			]
			// Additional rendering configuration can be added here
		});
	});
</script>

<!-- Container for DeckGL -->
<div bind:this={deckGLContainer} style="display: contents;">
	<canvas bind:this={canvasElement}></canvas>
</div>
