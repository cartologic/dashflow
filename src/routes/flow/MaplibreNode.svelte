<script lang="ts">
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  import { MapLibre } from "svelte-maplibre";
  type $$Props = NodeProps;
  export let data: $$Props["data"];
</script>

<div class="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
  <MapLibre
    center={[0, 0]}
    zoom={3}
    class="map"
    standardControls
    style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
  />
  <Handle
    type="target"
    position={Position.Top}
    class="w-16 !bg-teal-500 rounded-none border-none"
    on:connect
    on:connectend
    on:connectstart
  />
  <Handle
    type="source"
    position={Position.Bottom}
    class="w-16 !bg-teal-500 rounded-none border-none"
    on:connect
    on:connectend
    on:connectstart
  />
</div>

<style>
  :global(.map) {
    height: 500px;
    width: 500px;
  }
</style>
