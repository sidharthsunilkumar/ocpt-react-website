import React, { useEffect, useState } from 'react';
import { GraphCanvas } from 'reagraph';


const initialNodes = [
    { id: "a", label: "A", set: 1 },
    { id: "b", label: "B", set: 1 },
    { id: "c", label: "C", set: 2 },
    { id: "d", label: "D", set: 2 },
];

const initialEdges = [
    { id: "e1", source: "a", target: "c", label: "A → C", color: "#f97316", fill: '#075985' },
    { id: "e2", source: "b", target: "d", label: "B → D", color: "#10b981" },
];

const DirectedGraphV2simpleexample = () => {

    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

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

    // Custom layout function (refactored for readability)
    const getCustomNodePosition = (id, { nodes }) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return { x: 0, y: 0, z: 0 };

        const set1 = nodes.filter((n) => n.set === 1);
        const set2 = nodes.filter((n) => n.set === 2);

        let x, y;

        if (node.set === 1) {
            const idx = set1.findIndex((n) => n.id === id);
            x = -300;
            y = idx * 100;
        } else {
            const idx = set2.findIndex((n) => n.id === id);
            x = 300;
            y = idx * 100;
        }

        return { x, y, z: 0 };
    };

    return (
        <GraphCanvas
            nodes={nodes}
            edges={edges}
            draggable={true}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            labelType="all"
            layoutType="custom"
            layoutOverrides={{ getNodePosition: getCustomNodePosition }}
        />
    );

};


export default DirectedGraphV2simpleexample;