import React, { useState, useEffect } from 'react';
import './CutSuggestion.css';
import { GraphCanvas, lightTheme, CustomLayoutInputs, NodePositionArgs } from "reagraph";

export default function CutSuggestion({ cutSuggestion, dfg, handleCutSelected, handleDfgGraphSelection }) {

    // Early validation to prevent rendering with invalid data
    if (!cutSuggestion || !dfg) {
        return <div className='cut-suggestion-wrapper'>Invalid data provided</div>;
    }

    // Additional validation for required properties
    if (!cutSuggestion.set1 || !cutSuggestion.set2 || 
        !Array.isArray(cutSuggestion.set1) || !Array.isArray(cutSuggestion.set2)) {
        console.error('Cut suggestion missing required set1 or set2 arrays');
        return <div className='cut-suggestion-wrapper'>Invalid cut suggestion data</div>;
    }

    const transformData = (cut, dfg) => {
        if (!cut || !dfg || !dfg.edges) {
            return { graphNodes: [], graphEdges: [] };
        }

        // Additional validation for cut data
        if (!cut.set1 || !cut.set2 || !Array.isArray(cut.set1) || !Array.isArray(cut.set2)) {
            console.warn('Invalid cut data: set1 or set2 missing or not arrays');
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
        cut.set1.forEach((activity, index) => {
            console.log(`Processing set1 activity ${index}:`, activity);
            if (!activity) {
                console.warn(`Skipping invalid set1 activity at index ${index}:`, activity);
                return; // Skip invalid activities
            }
            
            const nodeId = `n-${nodeCounter}`;
            nodeIdMap[activity] = nodeId;
            console.log(`Creating set1 node: ${activity} -> ${nodeId}`);

            graphNodes.push({
                id: nodeId,
                label: `${activity}`,
                fill: '#828c41', // Green for set1
                data: {
                    type: 'Set 1',
                    activity: activity
                },
                type: 'Set 1'
            });
            nodeCounter++;
        });

        // Process set2 nodes
        cut.set2.forEach((activity, index) => {
            console.log(`Processing set2 activity ${index}:`, activity);
            if (!activity) {
                console.warn(`Skipping invalid set2 activity at index ${index}:`, activity);
                return; // Skip invalid activities
            }
            
            const nodeId = `n-${nodeCounter}`;
            nodeIdMap[activity] = nodeId;
            console.log(`Creating set2 node: ${activity} -> ${nodeId}`);

            graphNodes.push({
                id: nodeId,
                label: `${activity}`,
                fill: '#075985', // Blue for set2
                data: {
                    type: 'Set 2',
                    activity: activity
                },
                type: 'Set 2'
            });
            nodeCounter++;
        });

        // Create edges
        const graphEdges = [];
        const edgesToAdd = new Set();
        const edgesToRemove = new Set();

        // Track edges to be added and removed
        if (cut.edges_to_be_added) {
            cut.edges_to_be_added.forEach(edge => {
                edgesToAdd.add(`${edge[0]}-${edge[1]}`);
            });
        }

        if (cut.edges_to_be_removed) {
            cut.edges_to_be_removed.forEach(edge => {
                edgesToRemove.add(`${edge[0]}-${edge[1]}`);
            });
        }

        // Safely get cost_to_add_edge with fallback
        const costToAddEdge = (typeof cut.cost_to_add_edge === 'number' && 
                              !isNaN(cut.cost_to_add_edge) && 
                              isFinite(cut.cost_to_add_edge)) 
            ? cut.cost_to_add_edge 
            : 0;

        // Process all DFG edges
        dfgEdges.forEach(edge => {
            const sourceId = nodeIdMap[edge.source];
            const targetId = nodeIdMap[edge.target];

            // Only create edge if both nodes exist in our current cut
            if (sourceId && targetId) {
                const edgeKey = `${edge.source}-${edge.target}`;
                let color = '#6b7280'; // Gray default
                let cost = (typeof edge.cost === 'number' && 
                           !isNaN(edge.cost) && 
                           isFinite(edge.cost)) ? edge.cost : 0;

                if (edgesToAdd.has(edgeKey)) {
                    color = '#10b981'; // Green for edges to be added
                    cost = costToAddEdge;
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
        if (cut.edges_to_be_added) {
            cut.edges_to_be_added.forEach(edge => {
                const sourceId = nodeIdMap[edge[0]];
                const targetId = nodeIdMap[edge[1]];
                const edgeKey = `${edge[0]}-${edge[1]}`;

                if (sourceId && targetId && !dfgEdgeMap[edgeKey]) {
                    graphEdges.push({
                        source: sourceId,
                        target: targetId,
                        id: `${sourceId}-${targetId}`,
                        label: costToAddEdge.toString(),
                        fill: '#10b981' // Green for new edges
                    });
                }
            });
        }

        return { graphNodes, graphEdges };
    };

    // Function to validate and sanitize graph data
    const validateGraphData = (data) => {
        if (!data || !data.graphNodes || !data.graphEdges) {
            return { graphNodes: [], graphEdges: [] };
        }

        const validNodes = data.graphNodes.filter(node => {
            return node && 
                   node.id && 
                   node.label && 
                   node.fill && 
                   node.type &&
                   typeof node.id === 'string' &&
                   typeof node.label === 'string' &&
                   typeof node.fill === 'string' &&
                   typeof node.type === 'string';
        });

        const validEdges = data.graphEdges.filter(edge => {
            if (!edge || !edge.source || !edge.target || !edge.id || !edge.label || !edge.fill) {
                return false;
            }
            
            // Ensure all properties are strings
            if (typeof edge.source !== 'string' || 
                typeof edge.target !== 'string' || 
                typeof edge.id !== 'string' || 
                typeof edge.label !== 'string' || 
                typeof edge.fill !== 'string') {
                return false;
            }
            
            // Ensure source and target nodes exist
            const hasSource = validNodes.some(n => n.id === edge.source);
            const hasTarget = validNodes.some(n => n.id === edge.target);
            
            return hasSource && hasTarget;
        });

        return { graphNodes: validNodes, graphEdges: validEdges };
    };

    // Helper function to get edge cost from DFG
    const getEdgeCost = (source, target) => {
        if (!dfg || !dfg.edges) return 0;
        const edge = dfg.edges.find(e => e.source === source && e.target === target);
        return edge && (typeof edge.cost === 'number' && 
                       !isNaN(edge.cost) && 
                       isFinite(edge.cost)) ? edge.cost : 0;
    };

    // Helper function to prepare edges data for tables
    const prepareEdgesData = () => {
        if (!cutSuggestion || !cutSuggestion.edges_to_be_added || !cutSuggestion.edges_to_be_removed) {
            return { edgesToAdd: [], edgesToRemove: [] };
        }

        const costToAdd = (typeof cutSuggestion.cost_to_add_edge === 'number' && 
                          !isNaN(cutSuggestion.cost_to_add_edge) && 
                          isFinite(cutSuggestion.cost_to_add_edge))
            ? cutSuggestion.cost_to_add_edge 
            : 0;

        const edgesToAdd = cutSuggestion.edges_to_be_added.map(edge => ({
            source: edge[0],
            target: edge[1],
            cost: costToAdd
        }));

        const edgesToRemove = cutSuggestion.edges_to_be_removed.map(edge => ({
            source: edge[0],
            target: edge[1],
            cost: getEdgeCost(edge[0], edge[1])
        }));

        return { edgesToAdd, edgesToRemove };
    };

    const rawData = transformData(cutSuggestion, dfg);
    const data = validateGraphData(rawData);
    const { edgesToAdd, edgesToRemove } = prepareEdgesData();

    // Enhanced debug logging to identify missing nodes
    console.log('Cut suggestion data:', {
        set1: cutSuggestion.set1,
        set2: cutSuggestion.set2,
        set1Length: cutSuggestion.set1?.length,
        set2Length: cutSuggestion.set2?.length
    });
    
    console.log('Raw data generated:', {
        rawNodes: rawData.graphNodes.length,
        rawEdges: rawData.graphEdges.length,
        validNodes: data.graphNodes.length,
        validEdges: data.graphEdges.length
    });

    if (rawData.graphNodes.length !== data.graphNodes.length) {
        console.warn('Some nodes were filtered out during validation:', {
            filteredNodes: rawData.graphNodes.filter(node => 
                !data.graphNodes.some(validNode => validNode.id === node.id)
            )
        });
    }

    // Debug logging to help identify NaN sources
    if (data.graphNodes.length === 0 || data.graphEdges.length === 0) {
        console.warn('Graph data validation resulted in empty nodes or edges:', {
            originalNodes: rawData.graphNodes.length,
            validNodes: data.graphNodes.length,
            originalEdges: rawData.graphEdges.length,
            validEd: data.graphEdges.length
        });
    }

    // Additional validation to ensure we have valid data for rendering
    if (!data.graphNodes || !data.graphEdges) {
        return <div className='cut-suggestion-wrapper'>Unable to generate graph data</div>;
    }

    return (
        <div className='cut-suggestion-wrapper'>
            <div className='cut-title'>{cutSuggestion.cut_type} Cut</div>
            <div className='cut-info'>
                <div className='cut-set-diagram-wrapper'>
                    <div 
                        className='graph-container'
                        onClick={() => handleDfgGraphSelection(data.graphNodes, data.graphEdges)}
                        style={{ cursor: 'pointer' }}
                    >
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
                                <strong>Total cost to perform cut: {
                                    (typeof cutSuggestion.total_cost === 'number' && 
                                     !isNaN(cutSuggestion.total_cost) && 
                                     isFinite(cutSuggestion.total_cost))
                                        ? cutSuggestion.total_cost 
                                        : 'N/A'
                                }</strong>
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