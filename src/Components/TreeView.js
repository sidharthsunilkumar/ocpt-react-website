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
import './HomePage.css';

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
      case 'tau':
        return { backgroundColor: '#f6ce6aff', color: 'black' };
      case 'flower':
        return { backgroundColor: '#fbbf24', color: 'black' };
      default:
        return { backgroundColor: '#6b7280', color: 'white' };
    }
  };

  const getNodeLabel = (label, position) => {
    const positionText = position ? ` [${position[0]},${position[1]}]` : '';
    switch (label) {
      case 'sequence': return `Sequence →${positionText}`;
      case 'parallel': return `Parallel ∥${positionText}`;
      case 'exclusive': return `Exclusive ⊗${positionText}`;
      case 'redo': return `Redo ↻${positionText}`;
      case 'tau': return `τ${positionText}`;
      default: return `${label}${positionText}`;
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
        width: '140px',
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
          <div style={{ marginBottom: '8px', wordWrap: 'break-word' }}>
            {`Flower Model${data.position ? ` [${data.position[0]},${data.position[1]}]` : ''}`}
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.2', wordWrap: 'break-word' }}>
            {data.children.map((child, index) => (
              <div key={index} style={{ wordWrap: 'break-word' }}>{child}</div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ wordWrap: 'break-word' }}>
          {getNodeLabel(data.originalLabel, data.position)}
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
  const [nodeHierarchy, setNodeHierarchy] = React.useState({});

  const transformToReactFlowFormat = (ocptData) => {
    if (!ocptData || !ocptData.length) return { nodes: [], edges: [], hierarchy: {} };

    const nodes = [];
    const edges = [];
    const hierarchy = {};
    let nodeId = 0;

    const processNode = (
      node,
      parentId = null,
      depth = 0,
      siblingIndex = 0,
      totalSiblings = 1,
      parentX = 400
    ) => {
      const currentNodeId = `node-${nodeId++}`;
      if (parentId) {
        if (!hierarchy[parentId]) {
          hierarchy[parentId] = [];
        }
        hierarchy[parentId].push(currentNodeId);
      }

      const minHorizontalSpacing = 180;
      const verticalSpacing = 100;
      const maxSpreadWidth = 800;

      let nodeX;
      let nodeY = 50 + depth * verticalSpacing;

      if (totalSiblings === 1) {
        nodeX = parentX;
      } else {
        const effectiveSpacing = Math.min(minHorizontalSpacing, maxSpreadWidth / totalSiblings);
        const totalWidth = (totalSiblings - 1) * effectiveSpacing;
        const startX = parentX - totalWidth / 2;
        nodeX = startX + siblingIndex * effectiveSpacing;
      }

      const position = { x: nodeX, y: nodeY };

      // FLOWER → treated as leaf
      if (node.label === "flower") {
        const children = node.children || [];
        const childLabels = children.map((child) => child.label);

        nodes.push({
          id: currentNodeId,
          type: "custom",
          position,
          data: {
            originalLabel: "flower",
            children: childLabels,
            position: node.position || null,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        if (parentId) {
          edges.push({
            id: `edge-${parentId}-${currentNodeId}`,
            source: parentId,
            target: currentNodeId,
            type: "default",
            animated: false,
            style: { stroke: "#333", strokeWidth: 2 },
          });
        }

        return currentNodeId;
      }

      // REGULAR NODE
      nodes.push({
        id: currentNodeId,
        type: "custom",
        position,
        data: {
          originalLabel: node.label,
          position: node.position || null,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${currentNodeId}`,
          source: parentId,
          target: currentNodeId,
          type: "default",
          animated: false,
          style: { stroke: "#333", strokeWidth: 2 },
        });
      }

      if (node.children && node.label !== "flower") {
        const childrenCount = node.children.length;
        node.children.forEach((child, index) => {
          processNode(child, currentNodeId, depth + 1, index, childrenCount, nodeX);
        });
      }

      return currentNodeId;
    };

    /**
     * Post-processing
     * - Parent X = average(children X) except flower
     * - Fix overlaps iteratively
     */
    const optimizePositions = (nodes, hierarchy) => {
      const minHorizontalSpacing = 180;
      const MAX_ITER = 25;
      let iter = 0;
      let changed = true;

      while (changed && iter < MAX_ITER) {
        iter++;
        changed = false;

        // Adjust parents
        for (const parentId in hierarchy) {
          const parent = nodes.find((n) => n.id === parentId);
          if (!parent) continue;
          if (parent.data.originalLabel === "flower") continue; // skip flowers

          const children = hierarchy[parentId].map((cid) => nodes.find((n) => n.id === cid)).filter(Boolean);
          if (children.length > 0) {
            const avgX = children.reduce((sum, c) => sum + c.position.x, 0) / children.length;
            if (Math.abs(parent.position.x - avgX) > 2) {
              parent.position.x = parent.position.x * 0.7 + avgX * 0.3; // smooth move
              changed = true;
            }
          }
        }

        // Fix overlaps per level
        const levels = {};
        nodes.forEach((node) => {
          const y = node.position.y;
          if (!levels[y]) levels[y] = [];
          levels[y].push(node);
        });

        for (const y in levels) {
          const levelNodes = levels[y].sort((a, b) => a.position.x - b.position.x);
          for (let i = 1; i < levelNodes.length; i++) {
            const prev = levelNodes[i - 1];
            const curr = levelNodes[i];
            const dx = curr.position.x - prev.position.x;
            if (dx < minHorizontalSpacing) {
              curr.position.x = prev.position.x + minHorizontalSpacing;
              changed = true;
            }
          }
        }
      }

      return nodes;
    };

    processNode(data[0]);
    optimizePositions(nodes, hierarchy);

    return { nodes, edges, hierarchy };
  };

  const flowData = useMemo(() => transformToReactFlowFormat(data), [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  React.useEffect(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
    setNodeHierarchy(flowData.hierarchy || {});
  }, [flowData, setNodes, setEdges]);

  const getAllDescendants = (nodeId, hierarchy) => {
    const descendants = [];
    const children = hierarchy[nodeId] || [];

    for (const child of children) {
      descendants.push(child);
      descendants.push(...getAllDescendants(child, hierarchy));
    }

    return descendants;
  };

  const onNodesChangeHandler = React.useCallback((changes) => {
    const moveChanges = changes.filter(change => change.type === 'position' && change.position);
    const otherChanges = changes.filter(change => change.type !== 'position' || !change.position);

    if (moveChanges.length > 0) {
      setNodes((currentNodes) => {
        const updatedNodes = [...currentNodes];
        const nodeMap = new Map(updatedNodes.map(node => [node.id, node]));
        const processedNodes = new Set();

        moveChanges.forEach(change => {
          if (processedNodes.has(change.id)) return;
          const movingNode = nodeMap.get(change.id);
          if (!movingNode) return;

          const deltaX = change.position.x - movingNode.position.x;
          const deltaY = change.position.y - movingNode.position.y;
          movingNode.position = { ...change.position };
          processedNodes.add(change.id);

          const descendants = getAllDescendants(change.id, nodeHierarchy);
          descendants.forEach(descendantId => {
            const descendantNode = nodeMap.get(descendantId);
            if (descendantNode && !processedNodes.has(descendantId)) {
              descendantNode.position = {
                x: descendantNode.position.x + deltaX,
                y: descendantNode.position.y + deltaY
              };
              processedNodes.add(descendantId);
            }
          });
        });

        return updatedNodes;
      });
    }

    if (otherChanges.length > 0) {
      onNodesChange(otherChanges);
    }
  }, [nodeHierarchy, onNodesChange]);

  if (!data || !data.length) {
    return <div>No tree data available</div>;
  }

  return (
    <div className="tree-view-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
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
