import React, { useState, useEffect } from 'react';
import './CutSuggestion.css';
import { GraphCanvas, lightTheme } from "reagraph";

export default function CutSuggestion({ cutSuggestion, dfg, handleCutSelected }) {

    const transformData = (cut, dfg) => {
        if (!cut || !dfg || !dfg.edges) {
            return { graphNodes: [], graphEdges: [] };
        }

        const dfgEdges = dfg.edges;

        // Create a map of dfg edges for quick lookup
        const dfgEdgeMap = {};
        dfgEdges.forEach(edge => {
            const key = `${edge.source}-${edge.target}`;
            dfgEdgeMap[key] = edge;
        });

        // Create nodes from set1 and set2
        const graphNodes = [];
        const nodeIdMap = {};
        let nodeCounter = 0;

        // Process set1 nodes
        cut.set1.forEach(activity => {
            const nodeId = `n-${nodeCounter}`;
            nodeIdMap[activity] = nodeId;

            graphNodes.push({
                id: nodeId,
                label: `Set 1 ${activity}`,
                fill: '#166534', // Green for set1
                data: {
                    type: 'Set 1',
                    activity: activity
                },
                type: 'Set 1'
            });
            nodeCounter++;
        });

        // Process set2 nodes
        cut.set2.forEach(activity => {
            const nodeId = `n-${nodeCounter}`;
            nodeIdMap[activity] = nodeId;

            graphNodes.push({
                id: nodeId,
                label: `set2 ${activity}`,
                fill: '#075985', // Blue for set2
                data: {
                    type: 'set2',
                    activity: activity
                },
                type: 'set2'
            });
            nodeCounter++;
        });

        // Create edges
        const graphEdges = [];
        const edgesToAdd = new Set();
        const edgesToRemove = new Set();

        // Track edges to be added and removed
        cut.edges_to_be_added.forEach(edge => {
            edgesToAdd.add(`${edge[0]}-${edge[1]}`);
        });

        cut.edges_to_be_removed.forEach(edge => {
            edgesToRemove.add(`${edge[0]}-${edge[1]}`);
        });

        // Process all DFG edges
        dfgEdges.forEach(edge => {
            const sourceId = nodeIdMap[edge.source];
            const targetId = nodeIdMap[edge.target];

            // Only create edge if both nodes exist in our current cut
            if (sourceId && targetId) {
                const edgeKey = `${edge.source}-${edge.target}`;
                let color = '#6b7280'; // Gray default
                let cost = edge.cost;

                if (edgesToAdd.has(edgeKey)) {
                    color = '#10b981'; // Green for edges to be added
                    cost = cut.cost_to_add_edge;
                } else if (edgesToRemove.has(edgeKey)) {
                    color = '#ef4444'; // Red for edges to be removed
                }

                graphEdges.push({
                    source: sourceId,
                    target: targetId,
                    id: `${sourceId}-${targetId}`,
                    label: cost.toString(),
                    fill: color
                });
            }
        });

        // Add edges that are in edges_to_be_added but not in DFG
        cut.edges_to_be_added.forEach(edge => {
            const sourceId = nodeIdMap[edge[0]];
            const targetId = nodeIdMap[edge[1]];
            const edgeKey = `${edge[0]}-${edge[1]}`;

            if (sourceId && targetId && !dfgEdgeMap[edgeKey]) {
                graphEdges.push({
                    source: sourceId,
                    target: targetId,
                    id: `${sourceId}-${targetId}`,
                    label: cut.cost_to_add_edge.toString(),
                    fill: '#10b981' // Green for new edges
                });
            }
        });

        return { graphNodes, graphEdges };
    };

    // Helper function to get edge cost from DFG
    const getEdgeCost = (source, target) => {
        const edge = dfg.edges.find(e => e.source === source && e.target === target);
        return edge ? edge.cost : 0;
    };

    // Helper function to prepare edges data for tables
    const prepareEdgesData = () => {
        const edgesToAdd = cutSuggestion.edges_to_be_added.map(edge => ({
            source: edge[0],
            target: edge[1],
            cost: cutSuggestion.cost_to_add_edge
        }));

        const edgesToRemove = cutSuggestion.edges_to_be_removed.map(edge => ({
            source: edge[0],
            target: edge[1],
            cost: getEdgeCost(edge[0], edge[1])
        }));

        return { edgesToAdd, edgesToRemove };
    };

    const data = transformData(cutSuggestion, dfg);
    const { edgesToAdd, edgesToRemove } = prepareEdgesData();

    return (
        <div className='cut-suggestion-wrapper'>
            <div className='cut-title'>{cutSuggestion.cut_type} Cut</div>
            <div className='cut-info'>
                <div className='cut-set-diagram-wrapper'>
                    <div className='graph-container'>
                        <GraphCanvas
                            nodes={data.graphNodes}
                            edges={data.graphEdges}
                            draggable
                            clusterAttribute="type"
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>
                </div>
                <div className='cut-cost-info-wrapper'>
                    <div className='cut-cost-info'>
                        <h3 className='cut-cost-title'>To perform this cut:</h3>

                        {edgesToAdd.length > 0 && (
                            <div className='edges-section'>
                                <h4 className='edges-section-title'>Edges to be added:</h4>
                                <table className='edges-table'>
                                    <thead>
                                        <tr>
                                            <th>Source</th>
                                            <th>Target</th>
                                            <th>Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {edgesToAdd.map((edge, index) => (
                                            <tr key={index} className='edge-row edge-add'>
                                                <td className='edge-source'>{edge.source}</td>
                                                <td className='edge-target'>{edge.target}</td>
                                                <td className='edge-cost'>{edge.cost}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {edgesToRemove.length > 0 && (
                            <div className='edges-section'>
                                <h4 className='edges-section-title'>Edges to be removed:</h4>
                                <table className='edges-table'>
                                    <thead>
                                        <tr>
                                            <th>Source</th>
                                            <th>Target</th>
                                            <th>Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {edgesToRemove.map((edge, index) => (
                                            <tr key={index} className='edge-row edge-remove'>
                                                <td className='edge-source'>{edge.source}</td>
                                                <td className='edge-target'>{edge.target}</td>
                                                <td className='edge-cost'>{edge.cost}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className='total-cost-section'>
                            <div className='total-cost'>
                                <strong>Total cost to perform cut: {cutSuggestion.total_cost}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='cut-select'>
                <button
                    className='select-cut-btn'
                    onClick={()=>handleCutSelected(cutSuggestion)}
                >
                    Select this cut
                </button>
            </div>
        </div>
    );
}