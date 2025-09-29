import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ShowCostToAddEdgesDetails.css';

export default function ShowCostToAddEdgesDetails() {
    const [data, setData] = useState(null);
    const { id } = useParams();
    
    useEffect(() => {
        console.log("Fetching data from server...");
        // Construct the URL based on whether we have an id parameter
        const url = id 
            ? `http://localhost:1080/test-cost-to-add-edge/${id}`
            : 'http://localhost:1080/test-cost-to-add-edge';
        
        axios.get(url)
            .then(response => {
                console.log(response.data);
                setData(response.data);
            })
            .catch(err => {
                console.error("Error fetching data:", err);
            });
    }, [id]);

    if (!data) {
        return <div className="loading">Loading...</div>;
    }

    // Helper function to sort edges by cost (ascending)
    const sortEdgesByCost = (edges) => {
        return [...edges].sort((a, b) => a.cost - b.cost);
    };

    // Helper function to sort score objects by value (ascending)
    const sortScoresByValue = (scores) => {
        return Object.entries(scores).sort(([,a], [,b]) => a - b);
    };

    // Calculate total cost for edges
    const calculateTotalCost = (edges) => {
        return edges.reduce((total, edge) => total + edge.cost, 0);
    };

    const sortedDfgEdges = sortEdgesByCost(data.dfg.edges);
    const sortedMissingEdges = sortEdgesByCost(data.missing_edge_dfg.edges);
    const sortedRarityScores = sortScoresByValue(data.rarity_score);
    const sortedNormalisedScores = sortScoresByValue(data.normalised_rarity_score);

    const dfgTotalCost = calculateTotalCost(data.dfg.edges);
    const missingEdgesTotalCost = calculateTotalCost(data.missing_edge_dfg.edges);

    return (
        <div className="container">
            <h1>Cost to Add Edges Details</h1>
            
            {/* Probability at the top */}
            <div className="probability-section">
                <h2>Probability of Missing Edge: {data.probability_of_missing_edge}</h2>
            </div>

            {/* Main content in 4 columns */}
            <div className="main-content">
                {/* DFG Edges Column */}
                <div className="column">
                    <h3>DFG Edges (Cost Ascending)</h3>
                    <p className="total-cost">Total Cost: {dfgTotalCost}</p>
                    <div className="edges-list">
                        {sortedDfgEdges.map((edge, index) => (
                            <div key={index} className="edge-item">
                                <div className="edge-label">{edge.label}</div>
                                <div className="edge-cost">{edge.cost}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Missing Edge DFG Column */}
                <div className="column">
                    <h3>Missing Edge DFG (Cost Ascending)</h3>
                    <p className="total-cost">Total Cost: {missingEdgesTotalCost}</p>
                    <div className="edges-list">
                        {sortedMissingEdges.map((edge, index) => (
                            <div key={index} className="edge-item">
                                <div className="edge-label">{edge.label}</div>
                                <div className="edge-cost">{edge.cost}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rarity Score Column */}
                <div className="column">
                    <h3>Rarity Score (Ascending)</h3>
                    <div className="scores-list">
                        {sortedRarityScores.map(([key, value], index) => (
                            <div key={index} className="score-item">
                                <div className="score-label">{key}</div>
                                <div className="score-value">{value.toExponential(6)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Normalised Rarity Score Column */}
                <div className="column">
                    <h3>Normalised Rarity Score (Ascending)</h3>
                    <div className="scores-list">
                        {sortedNormalisedScores.map(([key, value], index) => (
                            <div key={index} className="score-item">
                                <div className="score-label">{key}</div>
                                <div className="score-value">{value.toFixed(6)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DFG Sets at the bottom */}
            <div className="dfg-sets-section">
                <h2>DFG Sets</h2>
                {Object.entries(data.dfg_sets).map(([setName, setData]) => (
                    <div key={setName} className="dfg-set">
                        <h3>{setName.charAt(0).toUpperCase() + setName.slice(1)}</h3>
                        <div className="set-details">
                            <div className="activities">
                                <p><strong>Start Activities:</strong> {setData.start_activities.join(', ')}</p>
                                <p><strong>End Activities:</strong> {setData.end_activities.join(', ')}</p>
                            </div>
                            {setData.dfg.edges && setData.dfg.edges.length > 0 ? (
                                <div className="set-edges">
                                    <h4>Edges (Total Cost: {calculateTotalCost(setData.dfg.edges)})</h4>
                                    <div className="edges-grid">
                                        {sortEdgesByCost(setData.dfg.edges).map((edge, index) => (
                                            <div key={index} className="set-edge-item">
                                                <span className="edge-info">{edge.source} → {edge.target}</span>
                                                <span className="edge-cost">{edge.cost}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="no-edges">No edges in this set</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}