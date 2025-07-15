import { useState, useEffect } from 'react';
import { Group } from '@visx/group';
import { Tree } from '@visx/hierarchy';
import { hierarchy } from '@visx/hierarchy';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import TreeNode from './TreeNode';

interface TreeData {
  ots: string[];
  hierarchy: any;
}

const TreeViewer = () => {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<any>(null);

  const colorScale = scaleOrdinal(schemeCategory10);

  useEffect(() => {
    const loadTreeData = async () => {
      try {
        const response = await fetch('/trees/order_management_tree.json');
        if (!response.ok) {
          throw new Error('Failed to load tree data');
        }
        const data = await response.json();
        setTreeData(data);
        
        // Create hierarchy tree structure
        const hierarchyTree = hierarchy(data.hierarchy, (d: any) => d.children);
        setTree(hierarchyTree);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadTreeData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-lg">Loading tree data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!treeData || !treeData.hierarchy || !tree) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-lg">No tree data available</div>
      </div>
    );
  }

  const totalWidth = 1200;
  const totalHeight = 800;
  const margin = { top: 30, left: 30, right: 30, bottom: 70 };
  const innerWidth = totalWidth - margin.left - margin.right;
  const innerHeight = totalHeight - margin.top - margin.bottom;

  return (
    <div className="max-w-full mx-auto p-5">
      <h1 className="text-center text-2xl font-bold mb-8 text-gray-800">
        Order Management Process Tree
      </h1>
      
      {treeData.ots && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Object Types:</h3>
          <div className="flex flex-wrap gap-2">
            {treeData.ots.map((ot, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-200"
              >
                {ot}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-auto">
        <svg
          width={totalWidth}
          height={totalHeight}
          style={{
            cursor: 'grab',
          }}
        >
          <Group top={margin.top} left={margin.left}>
            <Tree
              root={tree}
              size={[innerWidth, innerHeight]}
              nodeSize={[120, 80]}
              separation={(a: any, b: any) => {
                return a.parent === b.parent ? 1 : 2;
              }}
            >
              {(tree: any) => (
                <Group top={0} left={0}>
                  {tree.links().map((link: any, i: number) => (
                    <line
                      key={i}
                      x1={link.source.x}
                      y1={link.source.y}
                      x2={link.target.x}
                      y2={link.target.y}
                      stroke="#e5e7eb"
                      strokeWidth={2}
                    />
                  ))}
                  {tree.descendants().map((node: any, key: number) => (
                    <TreeNode
                      key={key}
                      node={node}
                      colorScale={colorScale}
                    />
                  ))}
                </Group>
              )}
            </Tree>
          </Group>
        </svg>
      </div>
    </div>
  );
};

export default TreeViewer;
