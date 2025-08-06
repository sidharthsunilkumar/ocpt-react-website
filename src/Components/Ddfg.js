import React from 'react';
import './Ddfg.css';
import { GraphCanvas } from "reagraph";
import DirectedGraph from './DirectedGraph';
import DirectedGraphV2 from './DirectedGraphV2';
import DirectedGraphV2example from './DirectedGraphV2example';
import DirectedGraphV2simpleexample from './DirectedGraphV2simpleexample';
import DirectedGraphV2clusterexample from './DirectedGraphV2clusterexample';
// import { useNavigate, Link } from 'react-router-dom';

export default function Ddfg({ dfg, onBack, startActivities, endActivities }) {

    // Function to color nodes based on start/end activity classification
    const colorNodes = (nodes, startActivities, endActivities) => {
        if (!nodes || !Array.isArray(nodes)) return [];
        
        return nodes.map(node => {
            const activityName = node.label;
            const isStart = startActivities && startActivities.includes(activityName);
            const isEnd = endActivities && endActivities.includes(activityName);

            let color = '#60a6bf'; // default color

            if (isStart && isEnd) {
                color = '#FFC107'; // Yellow for both start and end
            } else if (isStart) {
                color = '#56db82'; // Green for start activities
            } else if (isEnd) {
                color = '#F44336'; // Red for end activities
            }

            return {
                ...node,
                fill: color
            };
        });
    };

    // Color the nodes based on activity classification
    const coloredNodes = colorNodes(dfg.nodes, startActivities, endActivities);

    return (
        <div>
            <div 
                className="back-button"
                onClick={onBack}
                title="Go back"
            >
                <span className="back-button-arrow">←</span>
            </div>
            
            <div className="legend">
                <h4>Activities</h4>
                <div className="legend-item">
                    <div className="legend-color start"></div>
                    <span className="legend-label">Start Activities</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color end"></div>
                    <span className="legend-label">End Activities</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color both"></div>
                    <span className="legend-label">Start & End Activities</span>
                </div>
            </div>
            
            <GraphCanvas
                nodes={coloredNodes}
                edges={dfg.edges}
                draggable
                clusterAttribute="type"
                className="graph-container"
            />
        </div>
    );
}
