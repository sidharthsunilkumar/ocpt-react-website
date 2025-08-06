

import React from 'react';
import './ModifiedEdges.css';

export default function ModifiedEdges({ totalEdgesRemoved, totalEdgesAdded }) {
    // Only render if there are edges to display
    if ((!totalEdgesRemoved || totalEdgesRemoved.length === 0) && 
        (!totalEdgesAdded || totalEdgesAdded.length === 0)) {
        return null;
    }

    // Calculate total costs
    const totalRemovedCost = totalEdgesRemoved ? totalEdgesRemoved.reduce((sum, edge) => sum + edge[2], 0) : 0;
    const totalAddedCost = totalEdgesAdded ? totalEdgesAdded.reduce((sum, edge) => sum + edge[2], 0) : 0;
    const totalCost = totalAddedCost + totalRemovedCost;

    return (
        <div className="modified-edges-container">
            <h3 className="modified-edges-title">Added and Removed Edges</h3>
            
            <div className="total-cost-summary">
                <div className="net-cost-change">
                    Total Cost: <span className="cost-value">{totalCost}</span>
                </div>
            </div>
            
            {totalEdgesRemoved && totalEdgesRemoved.length > 0 && (
                <div className="edges-section">
                    <h4 className="edges-section-title removed">
                        Edges Removed ({totalEdgesRemoved.length}) - Total Cost: {totalRemovedCost}
                    </h4>
                    <div className="edges-list">
                        {totalEdgesRemoved.map((edge, index) => (
                            <div key={index} className="edge-item removed">
                                <span className="edge-source">{edge[0]}</span>
                                <span className="edge-arrow">→</span>
                                <span className="edge-target">{edge[1]}</span>
                                <span className="edge-weight">Cost: {edge[2]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {totalEdgesAdded && totalEdgesAdded.length > 0 && (
                <div className="edges-section">
                    <h4 className="edges-section-title added">
                        Edges Added ({totalEdgesAdded.length}) - Total Cost: {totalAddedCost}
                    </h4>
                    <div className="edges-list">
                        {totalEdgesAdded.map((edge, index) => (
                            <div key={index} className="edge-item added">
                                <span className="edge-source">{edge[0]}</span>
                                <span className="edge-arrow">→</span>
                                <span className="edge-target">{edge[1]}</span>
                                <span className="edge-weight">Cost: {edge[2]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}