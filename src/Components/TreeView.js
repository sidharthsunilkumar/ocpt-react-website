import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Position,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node component for different node types
const CustomNode = ({ data }) => {
  const getNodeStyle = (label) => {
    switch (label) {
      case 'sequence': 
        return { backgroundColor: '#3b82f6', color: 'white' };
      case 'parallel': 
        return { backgroundColor: '#10b981', color: 'white' };
      case 'exclusive': 
        return { backgroundColor: '#ef4444', color: 'white' };
      case 'redo': 
        return { backgroundColor: '#f59e0b', color: 'white' };
      case 'flower': 
        return { backgroundColor: '#fbbf24', color: 'black' };
      default: 
        return { backgroundColor: '#6b7280', color: 'white' };
    }
  };

  const getNodeLabel = (label) => {
    switch (label) {
      case 'sequence': return 'Sequence →';
      case 'parallel': return 'Parallel ∥';
      case 'exclusive': return 'Exclusive ⊗';
      case 'redo': return 'Redo ↻';
      default: return label;
    }
  };

  const isFlower = data.originalLabel === 'flower';
  const style = getNodeStyle(data.originalLabel);

  return (
    <div 
      style={{
        ...style,
        padding: '10px',
        borderRadius: '8px',
        border: '2px solid #333',
        width: '140px', // Fixed width for all nodes
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        position: 'relative',
        wordWrap: 'break-word',
        overflow: 'hidden'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />
      {isFlower ? (
        <div>
          <div style={{ marginBottom: '8px', wordWrap: 'break-word' }}>Flower Model</div>
          <div style={{ fontSize: '10px', lineHeight: '1.2', wordWrap: 'break-word' }}>
            {data.children.map((child, index) => (
              <div key={index} style={{ wordWrap: 'break-word' }}>{child}</div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ wordWrap: 'break-word' }}>
          {getNodeLabel(data.originalLabel)}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function TreeView({ data }) {
  // Transform OCPT data to React Flow format
  const transformToReactFlowFormat = (ocptData) => {
    if (!ocptData || !ocptData.length) return { nodes: [], edges: [] };
    
    const nodes = [];
    const edges = [];
    let nodeId = 0;
    
    // Simple positioning algorithm
    const processNode = (node, parentId = null, depth = 0, siblingIndex = 0, totalSiblings = 1, parentX = 400) => {
      const currentNodeId = `node-${nodeId++}`;
      
      // Compact spacing settings
      const minHorizontalSpacing = 180; // Minimum space between siblings
      const verticalSpacing = 100; // Vertical distance between levels
      const maxSpreadWidth = 800; // Maximum width for spreading siblings
      
      // Calculate position for this node
      let nodeX;
      let nodeY = 50 + depth * verticalSpacing;
      
      if (totalSiblings === 1) {
        // Single child - place directly under parent
        nodeX = parentX;
      } else {
        // Multiple children - spread them out but keep compact
        const effectiveSpacing = Math.min(minHorizontalSpacing, maxSpreadWidth / totalSiblings);
        const totalWidth = (totalSiblings - 1) * effectiveSpacing;
        const startX = parentX - totalWidth / 2;
        nodeX = startX + siblingIndex * effectiveSpacing;
      }
      
      const position = { x: nodeX, y: nodeY };
      
      // Handle flower nodes specially
      if (node.label === 'flower') {
        const children = node.children || [];
        const childLabels = children.map(child => child.label);
        
        nodes.push({
          id: currentNodeId,
          type: 'custom',
          position,
          data: {
            originalLabel: 'flower',
            children: childLabels
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
        
        // Create edge to parent if exists
        if (parentId) {
          edges.push({
            id: `edge-${parentId}-${currentNodeId}`,
            source: parentId,
            target: currentNodeId,
            type: 'default',
            animated: false,
            style: { stroke: '#333', strokeWidth: 2 }
          });
        }
        
        return currentNodeId;
      }
      
      // Regular node processing
      nodes.push({
        id: currentNodeId,
        type: 'custom',
        position,
        data: {
          originalLabel: node.label
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
      
      // Create edge to parent if exists
      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${currentNodeId}`,
          source: parentId,
          target: currentNodeId,
          type: 'default',
          animated: false,
          style: { stroke: '#333', strokeWidth: 2 }
        });
      }
      
      // Process children (skip for flower nodes as they're handled above)
      if (node.children && node.label !== 'flower') {
        const childrenCount = node.children.length;
        node.children.forEach((child, index) => {
          processNode(child, currentNodeId, depth + 1, index, childrenCount, nodeX);
        });
      }
      
      return currentNodeId;
    };
    
    // Start processing from root
    processNode(data[0]);
    
    return { nodes, edges };
  };
  
  const flowData = useMemo(() => {
    const result = transformToReactFlowFormat(data);
    console.log('Generated nodes:', result.nodes);
    console.log('Generated edges:', result.edges);
    return result;
  }, [data]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Update nodes and edges when flowData changes
  React.useEffect(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
  }, [flowData, setNodes, setEdges]);
  
  if (!data || !data.length) {
    return <div>No tree data available</div>;
  }
  
  return (
    <div className="tree-view-wrapper" style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'default',
          style: { stroke: '#333', strokeWidth: 2 }
        }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background />
        <Controls />
        <MiniMap 
          style={{
            height: 120,
            backgroundColor: '#f8f9fa',
          }}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
