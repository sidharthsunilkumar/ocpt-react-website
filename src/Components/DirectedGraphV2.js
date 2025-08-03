import React, { useState, useEffect } from 'react';
import { GraphCanvas } from 'reagraph';



const DirectedGraphV2 = ({ dfgNodes, dfgEdges }) => {

    // const [nodes, setNodes] = useState(dfgNodes);
    // const [edges, setEdges] = useState(dfgEdges);

    const handleNodeClick = (node) => {
        // Delete node
        const newNodes = nodes.filter((n) => n.id !== node.id);

        // Also delete connected edges
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

    const [nodes, setNodes] = useState(dfgNodes || []);
    const [edges, setEdges] = useState(dfgEdges || []);

    // Update state when props change
    useEffect(() => {
        setNodes(dfgNodes || []);
        setEdges(dfgEdges || []);
    }, [dfgNodes, dfgEdges]);


    return (
        <GraphCanvas
            nodes={nodes}
            edges={edges}
            draggable={true}
            // onNodeClick={handleNodeClick}
            // onEdgeClick={handleEdgeClick}
        />
    )

};

export default DirectedGraphV2;