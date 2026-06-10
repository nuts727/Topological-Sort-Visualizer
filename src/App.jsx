import React, { useState, useEffect } from 'react';

// --- Pseudocode Definitions ---
const KAHN_CODE = [
  "indegree[v] = 0; queue <- {v: deg=0}", 
  "while queue ≠ ∅:",                     
  "  u = queue.pop()",                    
  "  result.add(u)",                      
  "  for v in adj[u]:",                   
  "    deg[v]--",                         
  "    if deg[v] == 0:",                  
  "      queue.add(v)"                    
];

const DFS_CODE = [
  "stack = []; visited = {}",             
  "def dfs(u):",                          
  "  visited[u] = GRAY",                  
  "  for v in adj[u]:",                   
  "    if visited[v] == GRAY: abort()",   
  "    if visited[v] == WHITE:",          
  "      dfs(v)",                         
  "  visited[u] = BLACK",                 
  "  stack.push(u)"                       
];

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

  const pushStep = (msg, activeNode = null, activeEdge = null, codeLine = null) => {
    steps.push({
      msg,
      queue: [...queue],
      inDegree: { ...inDegree },
      result: [...result],
      processedEdges: [...processedEdges],
      activeNode,
      activeEdge,
      codeLine
    });
  };

  pushStep('Initialized in-degrees. Nodes with in-degree 0 are added to the Queue.', null, null, 0);

  while (queue.length > 0) {
    pushStep('Checking if queue is empty...', null, null, 1);
    
    const u = queue.shift();
    pushStep(`Dequeued Node ${u}.`, u, null, 2);
    
    result.push(u);
    pushStep(`Added ${u} to the topological order.`, u, null, 3);

    pushStep(`Preparing to check neighbors of ${u}...`, u, null, 4);
    for (let v of adj[u]) {
      const edgeStr = `${u}-${v}`;
      pushStep(`Evaluating edge ${u} → ${v}...`, u, edgeStr, 4);
      
      inDegree[v]--;
      processedEdges.push(edgeStr);
      pushStep(`Removed edge ${u} → ${v}. Decremented in-degree of ${v} to ${inDegree[v]}.`, u, null, 5);

      pushStep(`Checking if in-degree of ${v} is 0.`, u, null, 6);
      if (inDegree[v] === 0) {
        queue.push(v);
        pushStep(`Node ${v} now has an in-degree of 0. Adding to Queue.`, u, null, 7);
      }
    }
  }

  if (result.length !== nodes.length) {
    pushStep('Cycle detected! The graph is not a valid DAG. Topological Sort failed.', null, null, null);
  } else {
    pushStep('Kahn\'s Algorithm complete! All nodes processed.', null, null, null);
  }

  return steps;
};

const generateDFSSteps = (nodes, edges) => {
  const steps = [];
  const adj = {};
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => adj[e.from].push(e.to));

  const state = {}; 
  nodes.forEach(n => state[n.id] = 'UNVISITED'); 
  
  const result = [];
  const callStack = [];
  
  const treeEdges = [];     
  const skippedEdges = [];  
  const cycleEdges = [];    
  let hasCycle = false;

  const pushStep = (msg, activeNode = null, activeEdge = null, codeLine = null) => {
    steps.push({
      msg,
      visited: { ...state }, 
      result: [...result],
      callStack: [...callStack],
      treeEdges: [...treeEdges],
      skippedEdges: [...skippedEdges],
      cycleEdges: [...cycleEdges],
      activeNode,
      activeEdge,
      codeLine
    });
  };

  pushStep('Initialized all nodes as UNVISITED (White).', null, null, 0);

  const dfs = (u) => {
    if (hasCycle) return;
    
    pushStep(`Entering dfs(${u})`, u, null, 1);

    state[u] = 'VISITING'; 
    callStack.push(u);
    pushStep(`Visiting Node ${u}. Marked as VISITING (GRAY). added to active Call Stack.`, u, null, 2);

    pushStep(`Preparing to check neighbors of ${u}...`, u, null, 3);
    for (let v of adj[u]) {
      const edgeStr = `${u}-${v}`;
      pushStep(`Node ${u} checking edge to ${v}...`, u, edgeStr, 3);

      pushStep(`Checking if neighbor ${v} is already GRAY (currently visiting)...`, u, edgeStr, 4);
      if (state[v] === 'VISITING') {
        hasCycle = true;
        cycleEdges.push(edgeStr);
        pushStep(`🚨 Cycle detected traversing ${u} → ${v}! Neighbor is GRAY. Aborting.`, u, edgeStr, 4);
        return;
      }
      
      pushStep(`Checking if neighbor ${v} is WHITE (unvisited)...`, u, edgeStr, 5);
      if (state[v] === 'UNVISITED') {
        treeEdges.push(edgeStr);
        pushStep(`Neighbor ${v} is WHITE. Traversing deeper.`, u, edgeStr, 6);
        dfs(v);
      } else if (state[v] === 'VISITED') {
        skippedEdges.push(edgeStr);
        pushStep(`Neighbor ${v} is BLACK (already fully visited). Skipping cross-edge.`, u, edgeStr, 3);
      }
    }

    if (hasCycle) return;

    state[u] = 'VISITED'; 
    callStack.pop();
    pushStep(`Finished Node ${u}. All neighbors explored. Marked as VISITED (BLACK).`, u, null, 7);
    
    result.unshift(u); 
    pushStep(`Pushed ${u} to final stack (prepended to topological order).`, u, null, 8);
  };

  for (let n of nodes) {
    if (state[n.id] === 'UNVISITED' && !hasCycle) {
      pushStep(`Starting DFS from unvisited node ${n.id}.`, n.id, null, null);
      dfs(n.id);
    }
  }

  if (!hasCycle) {
    pushStep('DFS Complete! The topological order is ready.', null, null, null);
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
  
  const [isDark, setIsDark] = useState(false);

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
  const currentCode = algo === 'KAHN' ? KAHN_CODE : DFS_CODE;
  
  // Logic to determine if the algorithm has finished
  const isFinished = steps.length > 0 && stepIdx >= steps.length - 1;

  let canvasCursor = 'cursor-default';
  if (mode === 'ADD_NODE') canvasCursor = 'cursor-crosshair';
  if (mode === 'MOVE') canvasCursor = draggedNode ? 'cursor-grabbing' : 'cursor-grab';

  const bgMain = isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800';
  const bgPanel = isDark ? 'bg-gray-800' : 'bg-white';
  const borderCol = isDark ? 'border-gray-700' : 'border-gray-200';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const btnOutline = isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800';

  return (
    <div className={`flex h-screen font-sans ${bgMain}`}>
      {/* LEFT PANEL */}
      <div className={`flex-1 flex flex-col border-r ${borderCol}`}>
        <div className={`p-4 border-b flex justify-between items-center shadow-sm z-10 ${bgPanel} ${borderCol}`}>
          <div className="flex gap-2">
            <button onClick={() => setMode('MOVE')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'MOVE' ? 'bg-blue-600 text-white' : btnOutline}`}>Move</button>
            <button onClick={() => setMode('ADD_NODE')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'ADD_NODE' ? 'bg-blue-600 text-white' : btnOutline}`}>+ Node</button>
            <button onClick={() => setMode('ADD_EDGE')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'ADD_EDGE' ? 'bg-blue-600 text-white' : btnOutline}`}>→ Edge</button>
            <button onClick={() => setMode('DELETE')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'DELETE' ? 'bg-red-600 text-white' : btnOutline}`}>Delete</button>
          </div>
          <div className="flex gap-4 items-center">
            <span className={`text-xs italic ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>Double-click node to rename</span>
            <button onClick={() => { setNodes([]); setEdges([]); }} className={`px-3 py-1 rounded-md text-sm font-medium ${btnOutline}`}>Clear All</button>
            
            <button onClick={() => setIsDark(!isDark)} className={`px-3 py-1 rounded-md text-sm font-medium border ${isDark ? 'border-gray-600 bg-gray-900 text-yellow-300' : 'border-gray-300 bg-white text-gray-800'}`}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        <div 
          className={`flex-1 overflow-hidden relative ${canvasCursor} ${isDark ? 'bg-gray-900' : 'bg-white'}`} 
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <svg className="w-full h-full absolute inset-0">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={isDark ? '#6B7280' : '#9CA3AF'} />
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
              
              let strokeColor = isDark ? '#4B5563' : '#9CA3AF';
              let strokeWidth = "2";
              let isDashed = false;
              let marker = 'arrowhead';
              
              const isActiveEdge = currentStep.activeEdge === edgeStr;

              if (algo === 'KAHN') {
                if (isActiveEdge) {
                  strokeColor = '#F59E0B'; 
                  strokeWidth = "4";
                  marker = 'arrowhead-active';
                } else if (currentStep.processedEdges?.includes(edgeStr)) {
                  strokeColor = '#EF4444'; 
                  isDashed = true;
                  marker = 'arrowhead-processed';
                }
              } else {
                if (isActiveEdge) {
                  strokeColor = '#F59E0B'; 
                  strokeWidth = "4";
                  marker = 'arrowhead-active';
                } else if (currentStep.cycleEdges?.includes(edgeStr)) {
                  strokeColor = '#EF4444'; 
                  strokeWidth = "4";
                  marker = 'arrowhead-processed';
                } else if (currentStep.treeEdges?.includes(edgeStr)) {
                  strokeColor = '#3B82F6'; 
                  strokeWidth = "3";
                  marker = 'arrowhead-tree';
                } else if (currentStep.skippedEdges?.includes(edgeStr)) {
                  strokeColor = isDark ? '#4B5563' : '#9CA3AF'; 
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
              let bgColor = isDark ? '#1F2937' : '#FFFFFF';
              let borderColor = isDark ? '#60A5FA' : '#3B82F6';
              
              if (algo === 'KAHN') {
                 if (currentStep.result?.includes(n.id)) { bgColor = isDark ? '#065F46' : '#D1FAE5'; borderColor = '#10B981'; } 
                 if (currentStep.activeNode === n.id) { bgColor = isDark ? '#854D0E' : '#FEF08A'; borderColor = '#EAB308'; } 
              } else {
                 if (currentStep.visited?.[n.id] === 'VISITED') { bgColor = isDark ? '#065F46' : '#D1FAE5'; borderColor = '#10B981'; } 
                 else if (currentStep.visited?.[n.id] === 'VISITING') { bgColor = isDark ? '#1E3A8A' : '#DBEAFE'; borderColor = '#3B82F6'; } 
                 
                 if (currentStep.activeNode === n.id) { bgColor = isDark ? '#854D0E' : '#FEF08A'; borderColor = '#EAB308'; }
              }

              if (selectedNode === n.id) { borderColor = '#EF4444'; bgColor = isDark ? '#7F1D1D' : '#FEE2E2'; }

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
                  <text textAnchor="middle" dy=".3em" className={`text-sm font-bold pointer-events-none select-none ${isDark ? 'fill-gray-100' : 'fill-gray-800'}`}>{n.id}</text>
                  
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

      {/* RIGHT PANEL */}
      <div className={`w-[450px] flex flex-col shadow-lg z-20 ${bgPanel}`}>
        
        {/* Controls */}
        <div className={`p-5 border-b ${borderCol}`}>
          <div className={`flex rounded-lg p-1 mb-4 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <button onClick={() => setAlgo('KAHN')} className={`flex-1 py-1 rounded-md text-sm font-medium ${algo === 'KAHN' ? (isDark ? 'bg-gray-700 text-white shadow' : 'bg-white shadow text-gray-800') : textMuted}`}>Kahn's (BFS)</button>
            <button onClick={() => setAlgo('DFS')} className={`flex-1 py-1 rounded-md text-sm font-medium ${algo === 'DFS' ? (isDark ? 'bg-gray-700 text-white shadow' : 'bg-white shadow text-gray-800') : textMuted}`}>Depth-First Search</button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setStepIdx(0)} disabled={stepIdx === 0} className={`px-3 py-2 rounded disabled:opacity-50 ${btnOutline}`}>⏮</button>
            <button onClick={() => setStepIdx(s => Math.max(0, s - 1))} disabled={stepIdx === 0} className={`px-3 py-2 rounded disabled:opacity-50 ${btnOutline}`}>◀</button>
            <button 
              onClick={() => {
                if (isFinished) {
                  setStepIdx(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying(!isPlaying);
                }
              }} 
              className="flex-1 py-2 bg-blue-600 text-white font-bold rounded shadow-sm hover:bg-blue-700"
            >
              {isPlaying ? 'Pause' : (isFinished ? 'Replay' : 'Play')}
            </button>
            <button onClick={() => setStepIdx(s => Math.min(steps.length - 1, s + 1))} disabled={stepIdx === steps.length - 1} className={`px-3 py-2 rounded disabled:opacity-50 ${btnOutline}`}>▶</button>
          </div>

          <div className={`flex items-center gap-4 text-sm ${textMuted}`}>
            <span>Speed:</span>
            <input type="range" min="200" max="2000" step="100" value={2200 - speed} onChange={(e) => setSpeed(2200 - parseInt(e.target.value))} className="flex-1" />
          </div>
        </div>

        {/* Step Text Explanation */}
        <div className={`p-5 border-b min-h-[90px] flex items-center ${isDark ? 'bg-blue-950 border-blue-900 text-blue-100' : 'bg-blue-50 border-blue-100 text-gray-800'}`}>
          <p className="text-sm font-medium leading-relaxed">{currentStep.msg || "Edit the graph or press play to begin."}</p>
        </div>

        {/* Interactive Pseudocode Block */}
        <div className={`p-4 font-mono text-sm border-b shadow-inner ${isDark ? 'bg-black text-blue-400 border-gray-900' : 'bg-gray-900 text-blue-300 border-gray-800'}`}>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Algorithm execution</h3>
          <div className="space-y-1">
            {currentCode.map((line, idx) => (
              <div 
                key={idx} 
                className={`px-2 py-1 rounded transition-colors duration-200 ${
                  currentStep.codeLine === idx ? 'bg-blue-600 text-white font-bold shadow-md' : (isDark ? 'text-gray-500' : 'text-gray-400')
                }`}
              >
                <pre className="m-0 bg-transparent">{line}</pre>
              </div>
            ))}
          </div>
        </div>

        {/* Data Structures State */}
        <div className={`flex-1 p-5 overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {algo === 'KAHN' ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Queue</h3>
                <div className={`flex flex-wrap gap-2 min-h-[40px] p-2 rounded border shadow-inner ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {currentStep.queue?.length === 0 ? <span className="text-gray-500 italic text-sm">Empty</span> : null}
                  {currentStep.queue?.map((n, i) => (
                    <span key={i} className={`px-3 py-1 font-bold rounded font-mono text-sm border ${isDark ? 'bg-yellow-900/50 text-yellow-200 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}`}>{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Topological Order (Result)</h3>
                <div className={`flex flex-wrap gap-2 min-h-[40px] p-2 rounded border shadow-inner ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {currentStep.result?.length === 0 ? <span className="text-gray-500 italic text-sm">Empty</span> : null}
                  {currentStep.result?.map((n, i) => (
                    <span key={i} className={`px-3 py-1 font-bold rounded font-mono text-sm border ${isDark ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-300'}`}>{n}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Call Stack (GRAY)</h3>
                <div className={`flex flex-col-reverse gap-1 min-h-[40px] p-2 rounded border shadow-inner ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                   {currentStep.callStack?.length === 0 ? <span className="text-gray-500 italic text-sm">Empty</span> : null}
                   {currentStep.callStack?.map((n, i) => (
                    <div key={i} className={`px-3 py-1 font-bold rounded font-mono text-sm text-center border ${isDark ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300'}`}>{n}</div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Topological Stack (BLACK)</h3>
                <div className={`flex flex-wrap gap-2 min-h-[40px] p-2 rounded border shadow-inner ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {currentStep.result?.length === 0 ? <span className="text-gray-500 italic text-sm">Empty</span> : null}
                  {currentStep.result?.map((n, i) => (
                    <span key={i} className={`px-3 py-1 font-bold rounded font-mono text-sm border ${isDark ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-300'}`}>{n}</span>
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