import React, { useState, useEffect } from 'react';

// --- Graph Data Structures & Algorithms ---

const generateKahnsSteps = (nodes, edges) => {
  const steps = [];
  const inDegree = {};
  const adj = {};
  
  nodes.forEach(n => {
    inDegree[n.id] = 0;
    adj[n.id] = [];
  });
  
  edges.forEach(e => {
    adj[e.from].push(e.to);
    inDegree[e.to]++;
  });

  let queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
  const result = [];
  let processedEdges = [];

  const pushStep = (msg, activeNode = null, activeEdge = null) => {
    steps.push({
      msg,
      queue: [...queue],
      inDegree: { ...inDegree },
      result: [...result],
      processedEdges: [...processedEdges],
      activeNode,
      activeEdge
    });
  };

  pushStep('Initialized in-degrees. Nodes with in-degree 0 are added to the Queue.');

  while (queue.length > 0) {
    const u = queue.shift();
    result.push(u);
    pushStep(`Dequeued Node ${u}. Adding it to the topological order.`, u);

    for (let v of adj[u]) {
      const edgeStr = `${u}-${v}`;
      
      pushStep(`Evaluating edge ${u} → ${v}...`, u, edgeStr);
      
      inDegree[v]--;
      processedEdges.push(edgeStr);
      
      pushStep(`Removed edge ${u} → ${v}. Decremented in-degree of ${v} to ${inDegree[v]}.`, u);

      if (inDegree[v] === 0) {
        queue.push(v);
        pushStep(`Node ${v} now has an in-degree of 0. Adding to Queue.`, u);
      }
    }
  }

  if (result.length !== nodes.length) {
    pushStep('Cycle detected! The graph is not a valid DAG. Topological Sort failed.');
  } else {
    pushStep('Kahn\'s Algorithm complete! All nodes processed.');
  }

  return steps;
};

// --- The 3-State DFS Implementation ---
const generateDFSSteps = (nodes, edges) => {
  const steps = [];
  const adj = {};
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => adj[e.from].push(e.to));

  // 1. Initialize the State Tracker (UNVISITED, VISITING, VISITED)
  const state = {}; 
  nodes.forEach(n => state[n.id] = 'UNVISITED');
  
  const result = [];
  const callStack = [];
  
  const treeEdges = [];     
  const skippedEdges = [];  
  const cycleEdges = [];    
  let hasCycle = false;

  const pushStep = (msg, activeNode = null, activeEdge = null) => {
    steps.push({
      msg,
      visited: { ...state }, // Pass the 3 states to the UI
      result: [...result],
      callStack: [...callStack],
      treeEdges: [...treeEdges],
      skippedEdges: [...skippedEdges],
      cycleEdges: [...cycleEdges],
      activeNode,
      activeEdge
    });
  };

  pushStep('Initialized all nodes as UNVISITED.');

  const dfs = (u) => {
    if (hasCycle) return;
    
    // 2. Mark node as VISITING (in active call stack)
    state[u] = 'VISITING';
    callStack.push(u);
    pushStep(`Visiting Node ${u}. Marked as VISITING (Added to active Call Stack).`, u);

    for (let v of adj[u]) {
      const edgeStr = `${u}-${v}`;
      pushStep(`Node ${u} checking edge to ${v}...`, u, edgeStr);

      // 3. Cycle Check: Is the neighbor currently in our active stack?
      if (state[v] === 'VISITING') {
        hasCycle = true;
        cycleEdges.push(edgeStr);
        pushStep(`🚨 Cycle detected traversing ${u} → ${v}! Neighbor is currently VISITING. Graph is not a DAG.`, u, edgeStr);
        return;
      }
      
      // 4. Normal Traversal
      if (state[v] === 'UNVISITED') {
        treeEdges.push(edgeStr);
        dfs(v);
      } else if (state[v] === 'VISITED') {
        // Safe cross-edge to a fully processed node
        skippedEdges.push(edgeStr);
        pushStep(`Neighbor ${v} is already VISITED. Safe cross-edge, skipping.`, u, edgeStr);
      }
    }

    if (hasCycle) return;

    // 5. Node fully explored. Remove from active stack and add to result.
    state[u] = 'VISITED';
    callStack.pop();
    result.unshift(u); 
    pushStep(`Finished Node ${u}. All neighbors explored. Marked as VISITED and prepended to final order.`, u);
  };

  // 6. Initiate DFS from every unvisited node
  for (let n of nodes) {
    if (state[n.id] === 'UNVISITED' && !hasCycle) {
      pushStep(`Starting DFS from unvisited node ${n.id}.`, n.id);
      dfs(n.id);
    }
  }

  if (!hasCycle) {
    pushStep('DFS Complete! The topological order is ready.');
  }

  return steps;
};

// --- Main Component ---

export default function TopologicalSortVisualizer() {
  const [nodes, setNodes] = useState([{ id: 'A', x: 150, y: 100 }, { id: 'B', x: 300, y: 100 }, { id: 'C', x: 225, y: 250 }]);
  const [edges, setEdges] = useState([{ from: 'A', to: 'C' }, { from: 'B', to: 'C' }]);
  
  const [mode, setMode] = useState('MOVE'); 
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [algo, setAlgo] = useState('KAHN'); 
  
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  useEffect(() => {
    setIsPlaying(false);
    const newSteps = algo === 'KAHN' ? generateKahnsSteps(nodes, edges) : generateDFSSteps(nodes, edges);
    setSteps(newSteps);
    setStepIdx(0);
  }, [nodes, edges, algo]);

  useEffect(() => {
    let timer;
    if (isPlaying && stepIdx < steps.length - 1) {
      timer = setTimeout(() => setStepIdx(s => s + 1), speed);
    } else if (stepIdx >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, stepIdx, steps.length, speed]);

  const handleCanvasClick = (e) => {
    if (mode !== 'ADD_NODE') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newId = `N${nodes.length + 1}`;
    setNodes([...nodes, { id: newId, x, y }]);
  };

  const handleCanvasMouseMove = (e) => {
    if (mode === 'MOVE' && draggedNode) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setNodes(nodes.map(n => n.id === draggedNode ? { ...n, x, y } : n));
    }
  };

  const handleCanvasMouseUp = () => setDraggedNode(null);

  const handleNodeMouseDown = (e, nodeId) => {
    if (mode === 'MOVE') {
      e.stopPropagation();
      setDraggedNode(nodeId);
    }
  };

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    if (mode === 'DELETE') {
      setNodes(nodes.filter(n => n.id !== nodeId));
      setEdges(edges.filter(e => e.from !== nodeId && e.to !== nodeId));
    } else if (mode === 'ADD_EDGE') {
      if (!selectedNode) {
        setSelectedNode(nodeId);
      } else {
        if (selectedNode !== nodeId && !edges.find(e => e.from === selectedNode && e.to === nodeId)) {
          setEdges([...edges, { from: selectedNode, to: nodeId }]);
        }
        setSelectedNode(null);
      }
    }
  };

  const handleNodeDoubleClick = (e, oldId) => {
    e.stopPropagation();
    const newName = prompt("Enter a new name for this node (max 4 chars):", oldId);
    if (!newName || newName.trim() === "" || newName === oldId) return;

    const trimmedName = newName.trim().substring(0, 4);
    if (nodes.find(n => n.id === trimmedName)) {
      alert("A node with this name already exists!");
      return;
    }

    setNodes(nodes.map(n => n.id === oldId ? { ...n, id: trimmedName } : n));
    setEdges(edges.map(ed => ({
      from: ed.from === oldId ? trimmedName : ed.from,
      to: ed.to === oldId ? trimmedName : ed.to
    })));
  };

  const handleEdgeClick = (e, fromId, toId) => {
    e.stopPropagation();
    if (mode === 'DELETE') {
      setEdges(edges.filter(ed => ed.from !== fromId || ed.to !== toId));
    }
  };

  const currentStep = steps[stepIdx] || {};

  let canvasCursor = 'cursor-default';
  if (mode === 'ADD_NODE') canvasCursor = 'cursor-crosshair';
  if (mode === 'MOVE') canvasCursor = draggedNode ? 'cursor-grabbing' : 'cursor-grab';

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="flex-1 flex flex-col border-r border-gray-200">
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
          <div className="flex gap-2">
            <button onClick={() => setMode('MOVE')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'MOVE' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Move</button>
            <button onClick={() => setMode('ADD_NODE')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'ADD_NODE' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>+ Node</button>
            <button onClick={() => setMode('ADD_EDGE')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'ADD_EDGE' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>→ Edge</button>
            <button onClick={() => setMode('DELETE')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'DELETE' ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Delete</button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 italic mr-4">Double-click a node to rename</span>
            <button onClick={() => { setNodes([]); setEdges([]); }} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium">Clear All</button>
          </div>
        </div>

        <div 
          className={`flex-1 overflow-hidden relative bg-white ${canvasCursor}`} 
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <svg className="w-full h-full absolute inset-0">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
              </marker>
              <marker id="arrowhead-processed" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B" />
              </marker>
              <marker id="arrowhead-tree" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
              </marker>
            </defs>
            {edges.map((e, i) => {
              const n1 = nodes.find(n => n.id === e.from);
              const n2 = nodes.find(n => n.id === e.to);
              if (!n1 || !n2) return null;
              
              const edgeStr = `${e.from}-${e.to}`;
              
              let strokeColor = '#9CA3AF';
              let strokeWidth = "2";
              let isDashed = false;
              let marker = 'arrowhead';
              
              const isActiveEdge = currentStep.activeEdge === edgeStr;

              if (algo === 'KAHN') {
                if (isActiveEdge) {
                  strokeColor = '#F59E0B'; // Amber
                  strokeWidth = "4";
                  marker = 'arrowhead-active';
                } else if (currentStep.processedEdges?.includes(edgeStr)) {
                  strokeColor = '#EF4444'; // Red
                  isDashed = true;
                  marker = 'arrowhead-processed';
                }
              } else {
                if (isActiveEdge) {
                  strokeColor = '#F59E0B'; // Amber
                  strokeWidth = "4";
                  marker = 'arrowhead-active';
                } else if (currentStep.cycleEdges?.includes(edgeStr)) {
                  strokeColor = '#EF4444'; // Red Cycle
                  strokeWidth = "4";
                  marker = 'arrowhead-processed';
                } else if (currentStep.treeEdges?.includes(edgeStr)) {
                  strokeColor = '#3B82F6'; // Blue Tree Traversal
                  strokeWidth = "3";
                  marker = 'arrowhead-tree';
                } else if (currentStep.skippedEdges?.includes(edgeStr)) {
                  strokeColor = '#9CA3AF'; // Gray Skipped
                  isDashed = true;
                }
              }
              
              return (
                <g 
                  key={i} 
                  className={`group ${mode === 'DELETE' ? 'cursor-pointer' : ''}`} 
                  onClick={(event) => handleEdgeClick(event, e.from, e.to)}
                >
                  <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="transparent" strokeWidth="20" />
                  <line 
                    x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} 
                    stroke={strokeColor} 
                    strokeWidth={strokeWidth} 
                    markerEnd={`url(#${marker})`}
                    strokeDasharray={isDashed ? "5,5" : "0"}
                    className={`transition-all duration-300 ${mode === 'DELETE' ? 'group-hover:stroke-red-500 group-hover:stroke-[4px]' : ''}`}
                  />
                </g>
              );
            })}
            {nodes.map((n, i) => {
              let bgColor = '#FFFFFF';
              let borderColor = '#3B82F6';
              
              if (algo === 'KAHN') {
                 if (currentStep.result?.includes(n.id)) { bgColor = '#D1FAE5'; borderColor = '#10B981'; } 
                 if (currentStep.activeNode === n.id) { bgColor = '#FEF08A'; borderColor = '#EAB308'; } 
              } else {
                 if (currentStep.visited?.[n.id] === 'VISITED') { bgColor = '#D1FAE5'; borderColor = '#10B981'; } // Green
                 else if (currentStep.visited?.[n.id] === 'VISITING') { bgColor = '#DBEAFE'; borderColor = '#3B82F6'; } // Blue
                 
                 // Active node (yellow overrides others for the current step)
                 if (currentStep.activeNode === n.id) { bgColor = '#FEF08A'; borderColor = '#EAB308'; }
              }

              if (selectedNode === n.id) { borderColor = '#EF4444'; bgColor = '#FEE2E2'; }

              return (
                <g 
                  key={i} 
                  transform={`translate(${n.x}, ${n.y})`} 
                  onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
                  onClick={(e) => handleNodeClick(e, n.id)} 
                  onDoubleClick={(e) => handleNodeDoubleClick(e, n.id)}
                  className={`${mode === 'MOVE' ? (draggedNode === n.id ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'} ${mode === 'DELETE' ? 'hover:opacity-75' : ''}`}
                >
                  <circle r="20" fill={bgColor} stroke={borderColor} strokeWidth="3" className="transition-all duration-300" />
                  <text textAnchor="middle" dy=".3em" className="text-sm font-bold fill-gray-800 pointer-events-none select-none">{n.id}</text>
                  
                  {algo === 'KAHN' && currentStep.inDegree && currentStep.inDegree[n.id] !== undefined && (
                    <g transform="translate(15, -15)">
                      <circle r="10" fill="#EF4444" />
                      <text textAnchor="middle" dy=".3em" className="text-xs font-bold fill-white pointer-events-none select-none">{currentStep.inDegree[n.id]}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="w-1/3 bg-white flex flex-col shadow-lg z-20">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold mb-4">Algorithm Controls</h2>
          
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
            <button onClick={() => setAlgo('KAHN')} className={`flex-1 py-1 rounded-md text-sm font-medium ${algo === 'KAHN' ? 'bg-white shadow' : 'text-gray-500'}`}>Kahn's (BFS)</button>
            <button onClick={() => setAlgo('DFS')} className={`flex-1 py-1 rounded-md text-sm font-medium ${algo === 'DFS' ? 'bg-white shadow' : 'text-gray-500'}`}>Depth-First Search</button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setStepIdx(0)} disabled={stepIdx === 0} className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50">⏮</button>
            <button onClick={() => setStepIdx(s => Math.max(0, s - 1))} disabled={stepIdx === 0} className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50">◀</button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded shadow-sm hover:bg-blue-700">{isPlaying ? 'Pause' : 'Play'}</button>
            <button onClick={() => setStepIdx(s => Math.min(steps.length - 1, s + 1))} disabled={stepIdx === steps.length - 1} className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50">▶</button>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Speed:</span>
            <input type="range" min="200" max="2000" step="100" value={2200 - speed} onChange={(e) => setSpeed(2200 - parseInt(e.target.value))} className="flex-1" />
          </div>
        </div>

        <div className="p-6 bg-blue-50 border-b border-blue-100 min-h-[120px]">
          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Current Step Analysis</h3>
          <p className="text-gray-800 text-md leading-relaxed">{currentStep.msg || "Edit the graph or press play to begin."}</p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {algo === 'KAHN' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Queue</h3>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white rounded border border-gray-200 shadow-inner">
                  {currentStep.queue?.length === 0 ? <span className="text-gray-400 italic">Empty</span> : null}
                  {currentStep.queue?.map((n, i) => (
                    <span key={i} className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded font-mono text-sm">{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Topological Order (Result)</h3>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white rounded border border-gray-200 shadow-inner">
                  {currentStep.result?.length === 0 ? <span className="text-gray-400 italic">Empty</span> : null}
                  {currentStep.result?.map((n, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 border border-green-300 rounded font-mono text-sm">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Call Stack (VISITING)</h3>
                <div className="flex flex-col-reverse gap-1 min-h-[40px] p-2 bg-white rounded border border-gray-200 shadow-inner">
                   {currentStep.callStack?.length === 0 ? <span className="text-gray-400 italic text-sm">Empty</span> : null}
                   {currentStep.callStack?.map((n, i) => (
                    <div key={i} className="px-3 py-1 bg-blue-100 border border-blue-300 rounded font-mono text-sm text-center">{n}</div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Topological Order (VISITED)</h3>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white rounded border border-gray-200 shadow-inner">
                  {currentStep.result?.length === 0 ? <span className="text-gray-400 italic">Empty</span> : null}
                  {currentStep.result?.map((n, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 border border-green-300 rounded font-mono text-sm">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}