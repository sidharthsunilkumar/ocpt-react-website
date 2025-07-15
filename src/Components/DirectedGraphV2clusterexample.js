import React, { useState } from "react";
import { GraphCanvas, lightTheme } from "reagraph";

const initialNodes = [
    {
        id: 'n-0',
        label: 'set2 0',
        fill: '#075985',
        data: {
            type: 'set2',
            segment: 'A'
        },
        type: 'set2'
    },
    {
        id: 'n-1',
        label: 'Set 1 1',
        fill: '#166534',
        data: {
            type: 'Set 1'
        },
        type: 'Set 1'
    },
    {
        id: 'n-2',
        label: 'set2 2',
        fill: '#075985',
        data: {
            type: 'set2',
            segment: 'A'
        },
        type: 'set2'
    },
    {
        id: 'n-3',
        label: 'set2 3',
        fill: '#c2410c',
        data: {
            type: 'set2'
        },
        type: 'set2'
    },
    {
        id: 'n-6',
        label: 'Set 1 6',
        fill: '#3730a3',
        data: {
            type: 'Set 1',
            segment: 'A'
        },
        type: 'Set 1'
    },
    {
        id: 'n-7',
        label: 'Set 1 7',
        fill: '#3730a3',
        data: {
            type: 'Set 1'
        },
        type: 'Set 1'
    }
];

const initialEdges = [
    {
        source: 'n-6',
        target: 'n-1',
        id: 'n-6-n-1',
        label: 'n-6 → n-1',
        color: '#fff'
    }
];

const DirectedGraphV2clusterexample = () => {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    const myTheme = {
        ...lightTheme,
        edge: {
            ...lightTheme.edge,
            color: edge => edge.color || lightTheme.edge.color
        }
    };

    const handleNodeClick = (node) => {
        const newNodes = nodes.filter((n) => n.id !== node.id);
        const newEdges = edges.filter(
            (e) => e.source !== node.id && e.target !== node.id
        );
        setNodes(newNodes);
        setEdges(newEdges);
    };

    const handleEdgeClick = (edge) => {
        const newEdges = edges.filter((e) => e.id !== edge.id);
        setEdges(newEdges);
    };

    return (
        <div
            style={{
                width: "1200px",
                height: "400px",
                border: "1px solid #ccc",
                position: "relative", // Add this
                overflow: "hidden"    // Optional: hides overflow
            }}
        >
            <GraphCanvas
                nodes={nodes}
                edges={edges}
                draggable
                clusterAttribute="type"
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                theme={myTheme}
                style={{ width: "100%", height: "100%" }} // Add this
            />
        </div>
    );
};
export default DirectedGraphV2clusterexample;