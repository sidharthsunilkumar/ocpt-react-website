import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ShowMissingEdgeCostDetails.css';

// Individual ScatterPlot component for edge data
const IndividualScatterPlot = ({ title, edgeData, aLabel, bLabel, width = 600, height = 400 }) => {
    if (!edgeData || !edgeData.a_coords || !edgeData.b_coords) {
        return (
            <div className="individual-plot">
                <h4>{title}</h4>
                <div>No data to display</div>
            </div>
        );
    }

    const { a_coords, b_coords } = edgeData;

    // Convert coordinates to points with index+1 as x-coordinate
    const aPoints = a_coords.map((y, index) => ({ x: index + 1, y: y }));
    const bPoints = b_coords.map((y, index) => ({ x: index + 1, y: y }));
    const allPoints = [...aPoints, ...bPoints];

    // Calculate scales for this specific dataset
    const xValues = allPoints.map(p => p.x);
    const yValues = allPoints.map(p => p.y);
    
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Scale functions
    const xScale = (x) => {
        if (maxX === minX) {
            return margin.left + chartWidth / 2;
        }
        return margin.left + ((x - minX) / (maxX - minX)) * chartWidth;
    };
    
    const yScale = (y) => {
        if (maxY === minY) {
            return margin.top + chartHeight / 2;
        }
        return margin.top + chartHeight - ((y - minY) / (maxY - minY)) * chartHeight;
    };

    // Generate axis ticks
    const xTicks = [];
    const yTicks = [];
    const numXTicks = Math.min(8, maxX - minX);
    const numYTicks = 8;

    for (let i = 0; i <= numXTicks; i++) {
        const value = minX + (i / numXTicks) * (maxX - minX);
        xTicks.push({
            value: Math.round(value),
            x: margin.left + (i / numXTicks) * chartWidth
        });
    }

    for (let i = 0; i <= numYTicks; i++) {
        const value = minY + (i / numYTicks) * (maxY - minY);
        yTicks.push({
            value: Math.round(value * 100) / 100, // Round to 2 decimal places
            y: margin.top + chartHeight - (i / numYTicks) * chartHeight
        });
    }

    // Generate smooth curve path using cubic bezier curves with bounds checking
    const generateSmoothPath = (points, xScale, yScale) => {
        if (points.length < 2) return '';
        
        let path = `M ${xScale(points[0].x)},${yScale(points[0].y)}`;
        
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];
            
            if (i === 1) {
                // First curve segment
                const cp1x = xScale(prev.x) + (xScale(curr.x) - xScale(prev.x)) * 0.3;
                const cp1y = Math.max(yScale(Math.max(prev.y, curr.y)), Math.min(yScale(prev.y), yScale(curr.y)));
                const cp2x = xScale(curr.x) - (xScale(curr.x) - xScale(prev.x)) * 0.3;
                const cp2y = Math.max(yScale(Math.max(prev.y, curr.y)), Math.min(yScale(prev.y), yScale(curr.y)));
                path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${xScale(curr.x)},${yScale(curr.y)}`;
            } else if (i === points.length - 1) {
                // Last curve segment
                const cp1x = xScale(prev.x) + (xScale(curr.x) - xScale(prev.x)) * 0.3;
                const cp1y = Math.max(yScale(Math.max(prev.y, curr.y)), Math.min(yScale(prev.y), yScale(curr.y)));
                const cp2x = xScale(curr.x) - (xScale(curr.x) - xScale(prev.x)) * 0.3;
                const cp2y = Math.max(yScale(Math.max(prev.y, curr.y)), Math.min(yScale(prev.y), yScale(curr.y)));
                path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${xScale(curr.x)},${yScale(curr.y)}`;
            } else {
                // Middle curve segments with better bounds checking
                const prevPrev = points[i - 2];
                
                // Calculate control points with damping to prevent extreme curves
                let cp1x = xScale(prev.x) + (xScale(curr.x) - xScale(prevPrev.x)) * 0.1;
                let cp1y = yScale(prev.y) + (yScale(curr.y) - yScale(prevPrev.y)) * 0.1;
                let cp2x = xScale(curr.x) - (xScale(next.x) - xScale(prev.x)) * 0.1;
                let cp2y = yScale(curr.y) - (yScale(next.y) - yScale(prev.y)) * 0.1;
                
                // Ensure control points stay within reasonable bounds
                const minY = Math.min(yScale(prev.y), yScale(curr.y));
                const maxY = Math.max(yScale(prev.y), yScale(curr.y));
                const yBuffer = (maxY - minY) * 0.2; // 20% buffer
                
                cp1y = Math.max(minY - yBuffer, Math.min(maxY + yBuffer, cp1y));
                cp2y = Math.max(minY - yBuffer, Math.min(maxY + yBuffer, cp2y));
                
                // Ensure we don't go below the chart area
                cp1y = Math.min(cp1y, margin.top + chartHeight);
                cp2y = Math.min(cp2y, margin.top + chartHeight);
                
                // Ensure we don't go above the chart area
                cp1y = Math.max(cp1y, margin.top);
                cp2y = Math.max(cp2y, margin.top);
                
                path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${xScale(curr.x)},${yScale(curr.y)}`;
            }
        }
        
        return path;
    };

    // Calculate area under curve using trapezoidal rule
    const calculateAreaUnderCurve = (points) => {
        if (points.length < 2) return 0;
        
        let area = 0;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            // Trapezoidal rule: (x2 - x1) * (y1 + y2) / 2
            const deltaX = curr.x - prev.x;
            const avgY = (prev.y + curr.y) / 2;
            area += deltaX * avgY;
        }
        return area;
    };

    // Calculate areas
    const areaA = calculateAreaUnderCurve(aPoints);
    const areaB = calculateAreaUnderCurve(bPoints);

    return (
        <div className="individual-plot">
            <h4>{title}</h4>
            <div className="legend-container">
                <div className="legend-item">
                    <div className="legend-color" style={{backgroundColor: '#4285f4'}}></div>
                    <span>{aLabel} ({a_coords.length} points) - Area: {areaA.toFixed(4)}</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{backgroundColor: '#ea4335'}}></div>
                    <span>{bLabel} ({b_coords.length} points) - Area: {areaB.toFixed(4)}</span>
                </div>
            </div>
            <svg width={width} height={height}>
                {/* Chart background */}
                <rect 
                    x={margin.left} 
                    y={margin.top} 
                    width={chartWidth} 
                    height={chartHeight} 
                    fill="#f8f9fa" 
                    stroke="#dee2e6" 
                />
                
                {/* Grid lines */}
                {xTicks.map((tick, i) => (
                    <line 
                        key={`x-grid-${i}`}
                        x1={tick.x} 
                        y1={margin.top} 
                        x2={tick.x} 
                        y2={margin.top + chartHeight} 
                        stroke="#e9ecef" 
                        strokeWidth="1"
                    />
                ))}
                {yTicks.map((tick, i) => (
                    <line 
                        key={`y-grid-${i}`}
                        x1={margin.left} 
                        y1={tick.y} 
                        x2={margin.left + chartWidth} 
                        y2={tick.y} 
                        stroke="#e9ecef" 
                        strokeWidth="1"
                    />
                ))}

                {/* Axes */}
                <line 
                    x1={margin.left} 
                    y1={margin.top + chartHeight} 
                    x2={margin.left + chartWidth} 
                    y2={margin.top + chartHeight} 
                    stroke="#333" 
                    strokeWidth="2"
                />
                <line 
                    x1={margin.left} 
                    y1={margin.top} 
                    x2={margin.left} 
                    y2={margin.top + chartHeight} 
                    stroke="#333" 
                    strokeWidth="2"
                />

                {/* X-axis ticks and labels */}
                {xTicks.map((tick, i) => (
                    <g key={`x-tick-${i}`}>
                        <line 
                            x1={tick.x} 
                            y1={margin.top + chartHeight} 
                            x2={tick.x} 
                            y2={margin.top + chartHeight + 5} 
                            stroke="#333" 
                            strokeWidth="1"
                        />
                        <text 
                            x={tick.x} 
                            y={margin.top + chartHeight + 20} 
                            textAnchor="middle" 
                            fontSize="10" 
                            fill="#333"
                        >
                            {tick.value}
                        </text>
                    </g>
                ))}

                {/* Y-axis ticks and labels */}
                {yTicks.map((tick, i) => (
                    <g key={`y-tick-${i}`}>
                        <line 
                            x1={margin.left - 5} 
                            y1={tick.y} 
                            x2={margin.left} 
                            y2={tick.y} 
                            stroke="#333" 
                            strokeWidth="1"
                        />
                        <text 
                            x={margin.left - 10} 
                            y={tick.y + 4} 
                            textAnchor="end" 
                            fontSize="10" 
                            fill="#333"
                        >
                            {tick.value}
                        </text>
                    </g>
                ))}

                {/* Axis labels */}
                <text 
                    x={margin.left + chartWidth / 2} 
                    y={height - 10} 
                    textAnchor="middle" 
                    fontSize="12" 
                    fontWeight="bold" 
                    fill="#333"
                >
                    Time buckets
                </text>
                <text 
                    x={15} 
                    y={margin.top + chartHeight / 2} 
                    textAnchor="middle" 
                    fontSize="12" 
                    fontWeight="bold" 
                    fill="#333" 
                    transform={`rotate(-90, 15, ${margin.top + chartHeight / 2})`}
                >
                    Probability of the event occuring
                </text>

                {/* A coordinates curve - Blue */}
                {aPoints.length > 1 && (
                    <path
                        d={generateSmoothPath(aPoints, xScale, yScale)}
                        fill="none"
                        stroke="#4285f4"
                        strokeWidth="2"
                        opacity="0.7"
                    />
                )}

                {/* B coordinates curve - Red */}
                {bPoints.length > 1 && (
                    <path
                        d={generateSmoothPath(bPoints, xScale, yScale)}
                        fill="none"
                        stroke="#ea4335"
                        strokeWidth="2"
                        opacity="0.7"
                    />
                )}

                {/* A coordinates - Blue points */}
                {aPoints.map((point, index) => (
                    <circle
                        key={`a-${index}`}
                        cx={xScale(point.x)}
                        cy={yScale(point.y)}
                        r="4"
                        fill="#4285f4"
                        stroke="#fff"
                        strokeWidth="1.5"
                        opacity="0.9"
                    >
                        <title>{`${aLabel}[${index}]: Position ${point.x}, Value ${point.y}`}</title>
                    </circle>
                ))}

                {/* B coordinates - Red points */}
                {bPoints.map((point, index) => (
                    <circle
                        key={`b-${index}`}
                        cx={xScale(point.x)}
                        cy={yScale(point.y)}
                        r="4"
                        fill="#ea4335"
                        stroke="#fff"
                        strokeWidth="1.5"
                        opacity="0.9"
                    >
                        <title>{`${bLabel}[${index}]: Position ${point.x}, Value ${point.y}`}</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
};

// Main ScatterPlot component that renders multiple individual plots
const ScatterPlot = ({ data }) => {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return <div>No data to display</div>;
    }

    // Calculate areas for summary
    const calculateAreaUnderCurve = (points) => {
        if (points.length < 2) return 0;
        
        let area = 0;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const deltaX = curr.x - prev.x;
            const avgY = (prev.y + curr.y) / 2;
            area += deltaX * avgY;
        }
        return area;
    };

    // Prepare summary data
    const summaryData = Object.entries(data).map(([edgeName, edgeData]) => {
        const [aValue, bValue] = edgeName.split('→');
        const aPoints = edgeData.a_coords.map((y, index) => ({ x: index + 1, y: y }));
        const bPoints = edgeData.b_coords.map((y, index) => ({ x: index + 1, y: y }));
        
        return {
            edge: edgeName,
            aNode: aValue,
            bNode: bValue,
            aArea: calculateAreaUnderCurve(aPoints),
            bArea: calculateAreaUnderCurve(bPoints),
            totalArea: calculateAreaUnderCurve(aPoints) + calculateAreaUnderCurve(bPoints)
        };
    }).sort((a, b) => b.totalArea - a.totalArea); // Sort by total area descending

    return (
        <div className="scatter-plot-container">
            <h3>Edge Plot Data Visualization</h3>
            
            {/* Area Summary Table */}
            <div className="area-summary">
                <h4>Area Under Curves Summary</h4>
                <div className="summary-table">
                    <div className="table-header">
                        <div className="col-edge">Edge</div>
                        <div className="col-node">Node A</div>
                        <div className="col-area">Area A</div>
                        <div className="col-node">Node B</div>
                        <div className="col-area">Area B</div>
                        <div className="col-total">Total Area</div>
                    </div>
                    {summaryData.map((item, index) => (
                        <div key={item.edge} className="table-row">
                            <div className="col-edge" title={item.edge}>{item.edge}</div>
                            <div className="col-node">{item.aNode}</div>
                            <div className="col-area" style={{color: '#4285f4'}}>{item.aArea.toFixed(4)}</div>
                            <div className="col-node">{item.bNode}</div>
                            <div className="col-area" style={{color: '#ea4335'}}>{item.bArea.toFixed(4)}</div>
                            <div className="col-total"><strong>{item.totalArea.toFixed(4)}</strong></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="plots-grid">
                {Object.entries(data).map(([edgeName, edgeData]) => {
                    // Split the edge name by arrow to get a and b values
                    const [aValue, bValue] = edgeName.split('→');
                    
                    return (
                        <IndividualScatterPlot
                            key={edgeName}
                            title={edgeName}
                            edgeData={edgeData}
                            aLabel={aValue}
                            bLabel={bValue}
                            width={600}
                            height={400}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default function ShowMissingEdgeCostDetails() {
    const [plotData, setPlotData] = useState(null);
    const { id } = useParams();
    
    useEffect(() => {
        console.log("Fetching data from server...");
        const url = `http://localhost:1080/missing-edge-cost/${id}`;
        
        axios.get(url)
            .then(response => {
                console.log("Received plot data:", response.data.plot_data);
                setPlotData(response.data.plot_data);
            })
            .catch(err => {
                console.error("Error fetching data:", err);
            });
    }, [id]);

    if (!plotData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="missing-edge-cost-details">
            <h1>Missing Edge Cost Details</h1>
            <ScatterPlot data={plotData} />
        </div>
    );
}
