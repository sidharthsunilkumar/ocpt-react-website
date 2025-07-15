import React from 'react';
import { HierarchyPointNode } from '@visx/hierarchy/lib/types';

interface TreeNodeProps {
  node: HierarchyPointNode<any>;
  colorScale: (value: string) => string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, colorScale }) => {
  const { x, y, data } = node;
  const nodeValue = data.value;
  
  // Handle activity nodes
  if (nodeValue && nodeValue.activity) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect
          width={100}
          height={60}
          rx={8}
          fill={colorScale('activity')}
          stroke="#333"
          strokeWidth={2}
        />
        <text
          x={50}
          y={20}
          textAnchor="middle"
          fontSize={12}
          fontWeight="bold"
          fill="#333"
        >
          {nodeValue.activity}
        </text>
        {nodeValue.ots && nodeValue.ots.length > 0 && (
          <text
            x={50}
            y={40}
            textAnchor="middle"
            fontSize={10}
            fill="#666"
          >
            {nodeValue.ots.map((ot: any) => ot.ot).join(', ')}
          </text>
        )}
      </g>
    );
  }

  // Handle operator nodes (sequence, parallel, xor)
  if (typeof nodeValue === 'string') {
    const getOperatorSymbol = (operator: string) => {
      switch (operator) {
        case 'sequence': return '→';
        case 'parallel': return '∥';
        case 'xor': return '⊕';
        default: return '•';
      }
    };

    const getOperatorColor = (operator: string) => {
      switch (operator) {
        case 'sequence': return colorScale('sequence');
        case 'parallel': return colorScale('parallel');
        case 'xor': return colorScale('xor');
        default: return colorScale('default');
      }
    };

    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle
          r={25}
          fill={getOperatorColor(nodeValue)}
          stroke="#333"
          strokeWidth={2}
        />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={16}
          fontWeight="bold"
          fill="#333"
        >
          {getOperatorSymbol(nodeValue)}
        </text>
        <text
          x={0}
          y={40}
          textAnchor="middle"
          fontSize={10}
          fill="#666"
        >
          {nodeValue}
        </text>
      </g>
    );
  }

  return null;
};

export default TreeNode;
