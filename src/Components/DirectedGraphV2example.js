import React, { useEffect, useState } from 'react';
import { GraphCanvas } from 'reagraph';

const initialNodes = [
    { id: "n1", label: "Node 1" },
    { id: "n2", label: "Node 2" },
    { id: "n3", label: "Node 3" },
];

const initialEdges = [
    { id: "e1", source: "n1", target: "n2" },
    { id: "e2", source: "n2", target: "n3" },
];

const DirectedGraphV2example = () => {

    // example
    // const [nodes, setNodes] = useState(initialNodes);
    // const [edges, setEdges] = useState(initialEdges);

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    useEffect(() => {
        const filePath = process.env.PUBLIC_URL + '/example.txt';
        console.log("Fetching file from:", filePath);
        fetch(filePath)
            .then(res => {
                console.log("Fetch response:", res);
                return res.text();
            })
            .then(dataStr => {
                console.log("Raw file data:", dataStr);
                const { nodes, edges } = parseExampleData(dataStr);
                console.log("Parsed nodes:", nodes);
                console.log("Parsed edges:", edges);
                setNodes(nodes);
                setEdges(edges);
            })
            .catch(err => {
                console.error("Error fetching or parsing file:", err);
            });
    }, []);


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


    return (
        <GraphCanvas
            nodes={nodes}
            edges={edges}
            draggable={true}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            clusterAttribute="type"
            labelType="all"
        />
    )

};

// Helper function to parse the example.txt data WITHOUT set1 and set2
function parseExampleData1(dataStr) {

    const edgeRegex = /\("([^"]+)", "([^"]+)"\): \d+/g;
    const nodesSet = new Set();
    const edges = [];
    let match;
    let edgeCount = 1;
    while ((match = edgeRegex.exec(dataStr)) !== null) {
        const [_, source, target] = match;
        nodesSet.add(source);
        nodesSet.add(target);
        edges.push({
            id: `e${edgeCount++}`,
            source,
            target,
            label: '4'
        });
    }
    const nodes = Array.from(nodesSet).map((id) => ({
        id,
        label: id,
        fill: '#075985',
        data: {
            type: 'Set 2'
        },
        type: 'Set 2'
    }));
    return { nodes, edges };
}

// Helper function to parse the example.txt data with set1 and set2
function parseExampleData(dataStr) {

    // only consider the nodes and edges in set1 and set2
    const set2 = new Set(["unassigned"]);
    const set1 = new Set([
        "milestoned", "renamed", "merged", "labeled", "assigned", "added_to_project", "head_ref_restored", "head_ref_deleted", "created", "moved_columns_in_project", "unlabeled", "base_ref_changed", "commented", "closed"
    ]);
    const cutEdges= [["commented", "unassigned"], ["unassigned", "closed"], ["milestoned", "unassigned"]];

    const allowedNodes = new Set([...set1, ...set2]);
    const edgeRegex = /\("([^"]+)", "([^"]+)"\): (\d+)/g;
    const nodesSet = new Set();
    const edges = [];
    let match;
    let edgeCount = 1;
    while ((match = edgeRegex.exec(dataStr)) !== null) {
        const [_, source, target, label] = match;
        // Only consider edges where both source and target are in allowedNodes
        if (allowedNodes.has(source) && allowedNodes.has(target)) {
            nodesSet.add(source);
            nodesSet.add(target);


            let fill = "#a2a6a8";
            if (cutEdges.some(([a, b]) => a === source && b === target)) {
                fill = "red";
            }

            edges.push({
                id: `e${edgeCount++}`,
                source,
                target,
                label,
                fill
            });
        }
    }
    const nodes = Array.from(nodesSet).map((id) => ({
        id,
        label: id,
        fill: set1.has(id) ? '#075985' : '#688507',
        data: {
            type: set1.has(id) ? 'Set 1' : 'Set 2'
        },
        type: set1.has(id) ? 'Set 1' : 'Set 2',
    }));
    return { nodes, edges };
}

export default DirectedGraphV2example;