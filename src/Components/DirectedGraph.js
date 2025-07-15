import React from 'react';

const DirectedGraph = () => {
  // Graph data - can be easily modified
  const graphData = {
    a: [['b', 5], ['c', 2]],
    b: [['a', 3], ['c', 1]],
    c: [['b', 2], ['a', 6]],
    d: [['a', 3], ['c', 1]],
    e: [['a', 3], ['c', 1]],
    f: [['a', 3], ['c', 1]],
    g: [['a', 3]],
    h: []
  };

  const nodeRadius = 25;
  const svgWidth = 600;
  const svgHeight = 400;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const graphRadius = Math.min(svgWidth, svgHeight) * 0.3;

  // Automatically calculate node positions in a circle
  const calculateNodePositions = (nodes) => {
    const positions = {};
    const nodeCount = nodes.length;
    
    if (nodeCount === 1) {
      positions[nodes[0]] = { x: centerX, y: centerY };
    } else {
      nodes.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / nodeCount - Math.PI / 2; // Start from top
        positions[node] = {
          x: centerX + graphRadius * Math.cos(angle),
          y: centerY + graphRadius * Math.sin(angle)
        };
      });
    }
    
    return positions;
  };

  const allNodes = Object.keys(graphData);
  const nodePositions = calculateNodePositions(allNodes);

  // Function to calculate straight arrow properties
  const calculateArrowProps = (from, to) => {
    const fromPos = nodePositions[from];
    const toPos = nodePositions[to];
    
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return null; // Same node
    
    const unitX = dx / distance;
    const unitY = dy / distance;
    
    const startX = fromPos.x + unitX * nodeRadius;
    const startY = fromPos.y + unitY * nodeRadius;
    const endX = toPos.x - unitX * nodeRadius;
    const endY = toPos.y - unitY * nodeRadius;
    
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    return { startX, startY, endX, endY, midX, midY };
  };

  // Function to create curved arrow for bidirectional edges
  const createCurvedArrow = (from, to, curveDirection = 1) => {
    const fromPos = nodePositions[from];
    const toPos = nodePositions[to];
    
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return null; // Same node
    
    const unitX = dx / distance;
    const unitY = dy / distance;
    
    const perpX = -unitY * curveDirection;
    const perpY = unitX * curveDirection;
    
    const startX = fromPos.x + unitX * nodeRadius;
    const startY = fromPos.y + unitY * nodeRadius;
    const endX = toPos.x - unitX * nodeRadius;
    const endY = toPos.y - unitY * nodeRadius;
    
    const curveOffset = Math.max(30, distance * 0.2);
    const controlX = (startX + endX) / 2 + perpX * curveOffset;
    const controlY = (startY + endY) / 2 + perpY * curveOffset;
    
    const labelX = (startX + endX) / 2 + perpX * (curveOffset * 0.6);
    const labelY = (startY + endY) / 2 + perpY * (curveOffset * 0.6);
    
    const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    
    return { path, labelX, labelY };
  };

  // Check if there are bidirectional edges
  const hasBidirectionalEdge = (from, to) => {
    return graphData[to] && graphData[to].some(([target]) => target === from);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Directed Graph Visualization</h2>
      
      <div className="text-sm text-gray-600 mb-4">
        Nodes: {allNodes.length} | Total Edges: {Object.values(graphData).reduce((sum, edges) => sum + edges.length, 0)}
      </div>
      
      <svg width={svgWidth} height={svgHeight} className="border border-gray-300 bg-white rounded-lg shadow-lg">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#374151"
            />
          </marker>
        </defs>
        
        {/* Render edges */}
        {Object.entries(graphData).map(([from, edges]) =>
          edges.map(([to, weight], index) => {
            // Skip if target node doesn't exist or is the same as source
            if (!nodePositions[to] || from === to) return null;
            
            const isBidirectional = hasBidirectionalEdge(from, to);
            
            if (isBidirectional) {
              const curveDirection = from < to ? 1 : -1;
              const curveResult = createCurvedArrow(from, to, curveDirection);
              
              if (!curveResult) return null;
              
              const { path, labelX, labelY } = curveResult;
              
              return (
                <g key={`${from}-${to}-${index}`}>
                  <path
                    d={path}
                    stroke="#374151"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                  <circle cx={labelX} cy={labelY} r="12" fill="white" stroke="#374151" strokeWidth="1" />
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-sm font-semibold fill-gray-700"
                  >
                    {weight}
                  </text>
                </g>
              );
            } else {
              const arrowResult = calculateArrowProps(from, to);
              
              if (!arrowResult) return null;
              
              const { startX, startY, endX, endY, midX, midY } = arrowResult;
              
              return (
                <g key={`${from}-${to}-${index}`}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#374151"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <circle cx={midX} cy={midY} r="12" fill="white" stroke="#374151" strokeWidth="1" />
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-sm font-semibold fill-gray-700"
                  >
                    {weight}
                  </text>
                </g>
              );
            }
          })
        )}
        
        {/* Render nodes */}
        {allNodes.map(node => (
          <g key={node}>
            <circle
              cx={nodePositions[node].x}
              cy={nodePositions[node].y}
              r={nodeRadius}
              fill="#3B82F6"
              stroke="#1E40AF"
              strokeWidth="3"
            />
            <text
              x={nodePositions[node].x}
              y={nodePositions[node].y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-lg font-bold fill-white"
            >
              {node}
            </text>
          </g>
        ))}
      </svg>
      
      <div className="mt-6 p-4 bg-white rounded-lg shadow border max-w-2xl">
        <h3 className="font-semibold text-gray-800 mb-2">Graph Data:</h3>
        <div className="text-sm text-gray-600 space-y-1">
          {Object.entries(graphData).map(([from, edges]) => (
            <div key={from}>
              <span className="font-medium">{from}:</span> {
                edges.length > 0 
                  ? edges.map(([to, weight]) => `${to}(${weight})`).join(', ')
                  : 'no outgoing edges'
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DirectedGraph;