import type { Node, Edge } from '@xyflow/svelte';
import { writable, type Writable } from 'svelte/store';
export type FlowState = {
    color: string;
    zoom: number;
    shape: string;
};
export type NodeData = {
    flowState: Writable<FlowState>;
    label: string;
};


const flowState = writable<FlowState>({
    color: '#ff4000',
    zoom: 17,
    shape: 'cube'
});

export const initialNodes: Node[] = [
    {
        id: '1',
        type: 'custom',
        data: { name: 'Jane Doe', job: 'CEO', emoji: '😎' },
        position: { x: 0, y: 200 },
        dragHandle: '.custom-drag-area',
        style: 'resize: both;', // Additional styles if needed

    },
    {
        id: '2',
        type: 'sliderzoomnode',
        position: { x: 40, y: 50 },
        data: {
            flowState,
            label: 'zoom level'
        },
        class: 'w-[150px]'
    }
];

export const initialEdges: Edge[] = [
    {
        id: 'e1-2',
        source: '2',
        target: '1'
    },
    {
        id: 'e1-3',
        source: '1',
        target: '3'
    }
];