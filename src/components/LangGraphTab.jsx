import React, { useEffect, useState, useRef } from "react";

export default function LangGraphTab({ ros }) {
  const FADE_MS = 3000;
  // 実際に画面に表示されるアクティブなノード
  const [displayNode, setDisplayNode] = useState("idle");
  // 最後に取得した有効ステートを保持（idleで上書きしない）
  const [latchedNode, setLatchedNode] = useState("idle");

  // 状態遷移時の「直前の状態」を安全に維持し、不要な再レンダーでのクリアを防ぐRef群
  const prevNodeRef = useRef("idle");
  const currentNodeRef = useRef("idle");

  // displayNodeの変更をレンダー中に即座にRefへロック（再レンダー耐性を完全強化）
  if (displayNode !== currentNodeRef.current) {
    prevNodeRef.current = currentNodeRef.current;
    currentNodeRef.current = displayNode;
  }

  // 画面（右側パネル）が縦長かどうかを管理するステート
  const [isPortrait, setIsPortrait] = useState(false);
  const containerRef = useRef(null);
  // 届いた状態を一時的に溜めておくキュー
  const [nodeQueue, setNodeQueue] = useState([]);
  // 現在キューを処理中かどうかを管理するフラグ
  const isProcessing = useRef(false);
  const [recentActiveAt, setRecentActiveAt] = useState({});
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!ros) return;
    const stateListener = new window.ROSLIB.Topic({
      ros,
      name: "/langgraph_current_state",
      messageType: "std_msgs/String",
    });

    stateListener.subscribe((message) => {
      const next = (message?.data || "").trim();
      if (!next) return;
      setNodeQueue((prev) => [...prev, next]);
    });

    return () => stateListener.unsubscribe();
  }, [ros]);

  // コンテナのサイズを監視して、動的に縦長（Portrait）かを判定する
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // 高さが幅を上回っている場合は縦画面モードにする
        setIsPortrait(height > width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // グラフデータの座標とラベル（完全維持）
  const nodes = [
    { id: "classify_intent", label: "対話管理", x: 310, y: 30, px: 170, py: 30 },

    { id: "handle_chat_or_intro", label: "雑談", x: 20, y: 120, px: 20, py: 120 },
    { id: "clarify_task", label: "内容を確認する", x: 165, y: 120, px: 20, py: 210 },
    { id: "extract_task", label: "やることを決める", x: 310, y: 120, px: 170, py: 120 },
    { id: "handle_agent", label: "エージェント", x: 455, y: 120, px: 320, py: 120 },
    { id: "cancel_task", label: "キャンセル", x: 600, y: 120, px: 320, py: 210 },
    { id: "publish_task", label: "実行する", x: 745, y: 120, px: 320, py: 300 },

    { id: "detect_objects", label: "物体を探す", x: 165, y: 210, px: 20, py: 390 },
    { id: "ground_task", label: "対象を確認する", x: 310, y: 210, px: 170, py: 390 },
    { id: "monitor_execution", label: "ロボットの動作を監視", x: 745, y: 210, px: 320, py: 480 },

    { id: "estimate_grasp", label: "つかみ方を考える", x: 165, y: 300, px: 20, py: 570 },
    { id: "assemble_skills", label: "動きを組み立てる", x: 310, y: 300, px: 170, py: 570 },
    { id: "explain_result", label: "結果を教える", x: 745, y: 300, px: 320, py: 660 },

    { id: "simulate_task", label: "画面で確認する", x: 310, y: 390, px: 170, py: 750 },
  ];

  const edges = [
    { from: "classify_intent", to: "handle_chat_or_intro" },
    { from: "classify_intent", to: "clarify_task" },
    { from: "classify_intent", to: "extract_task" },
    { from: "classify_intent", to: "detect_objects" },
    { from: "classify_intent", to: "handle_agent" },
    { from: "classify_intent", to: "cancel_task" },
    { from: "classify_intent", to: "publish_task" },
    { from: "extract_task", to: "ground_task" },
    { from: "extract_task", to: "detect_objects" },
    { from: "clarify_task", to: "detect_objects" },
    { from: "detect_objects", to: "ground_task" },
    { from: "detect_objects", to: "estimate_grasp" },
    { from: "ground_task", to: "assemble_skills" },
    { from: "ground_task", to: "estimate_grasp" },
    { from: "ground_task", to: "simulate_task" },
    { from: "estimate_grasp", to: "assemble_skills" },
    { from: "assemble_skills", to: "simulate_task" },
    { from: "publish_task", to: "monitor_execution" },
    { from: "monitor_execution", to: "explain_result" },
  ];

  const nodeWidth = 140;
  const nodeHeight = 42;

  useEffect(() => {
    if (nodeQueue.length > 0 && !isProcessing.current) {
      isProcessing.current = true;
      const nextNode = nodeQueue[0];
      setDisplayNode(nextNode);
      setLatchedNode(nextNode);
      setRecentActiveAt((prev) => ({ ...prev, [nextNode]: Date.now() }));
      setTimeout(() => {
        setNodeQueue((prev) => prev.slice(1));
        isProcessing.current = false;
      }, 1000);
    }
  }, [nodeQueue]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 overflow-hidden">

      {/* ヘッダーエリア */}
      <div className="p-3 border-b bg-white flex justify-between items-center shadow-sm z-10 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-800">エージェントの状態</h2>
          <p className="text-gray-500 text-xs">AIが今何を考えているかを表示しています</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {latchedNode !== "idle" && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${nodeQueue.length > 2 ? "bg-orange-400" : "bg-blue-400"}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${latchedNode === 'idle' ? 'bg-gray-400' : 'bg-blue-500'}`}></span>
          </span>
          <span className="text-xs font-semibold text-gray-600">{latchedNode === "idle" ? "待機中" : "実行中"}</span>
        </div>
      </div>

      {/* グラフ描画エリア */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:18px_18px] flex items-center justify-center overflow-hidden"
      >
        <svg
          viewBox={isPortrait ? "0 0 480 830" : "0 0 910 460"}
          className="w-full h-auto max-h-full overflow-visible select-none"
        >
          <defs>
            <marker id="arrowhead" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 9 3, 0 6" fill="#cbd5e1" /></marker>
            <marker id="arrowhead-active" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 9 3, 0 6" fill="#3b82f6" /></marker>
          </defs>

          {/* エッジ（矢印線）のレンダリング */}
          {[...edges]
            .sort((a, b) => {
              const aActive = prevNodeRef.current === a.from && displayNode === a.to;
              const bActive = prevNodeRef.current === b.from && displayNode === b.to;
              return aActive === bActive ? 0 : aActive ? 1 : -1;
            })
            .map((edge) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const fromX = isPortrait ? fromNode.px : fromNode.x;
              const fromY = isPortrait ? fromNode.py : fromNode.y;
              const toX = isPortrait ? toNode.px : toNode.x;
              const toY = isPortrait ? toNode.py : toNode.y;

              let startX = fromX + nodeWidth / 2, startY = fromY + nodeHeight, endX = toX + nodeWidth / 2, endY = toY;

              if (fromY === toY) {
                if (fromX < toX) { startX = fromX + nodeWidth; startY = fromY + nodeHeight / 2; endX = toX; endY = toY + nodeHeight / 2; }
                else { startX = fromX; startY = fromY + nodeHeight / 2; endX = toX + nodeWidth; endY = toY + nodeHeight / 2; }
              }

              const isActiveEdge = prevNodeRef.current === edge.from && displayNode === edge.to;

              return (
                <path
                  // 【重要修正箇所】識別キーを固有かつ不変な文字列に変更し、入れ替わりによるウネウネ変形バグを完全防止
                  key={`${edge.from}-${edge.to}`}
                  d={`M ${startX} ${startY} C ${startX} ${startY + (endY - startY) / 2}, ${endX} ${endY - (endY - startY) / 2}, ${endX} ${endY}`}
                  fill="none"
                  stroke={isActiveEdge ? "#3b82f6" : "#e2e8f0"}
                  strokeWidth={isActiveEdge ? "2.2" : "1.8"}
                  markerEnd={isActiveEdge ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                  className="transition-all duration-800"
                />
              );
            })}

          {/* ノード（状態ボックス）のレンダリング */}
          {nodes.map((node) => {
            const isActive = latchedNode === node.id;
            const elapsedMs = nowMs - (recentActiveAt[node.id] || 0);
            const fadeProgress = Math.min(Math.max(elapsedMs / FADE_MS, 0), 1);
            const isFading = !isActive && elapsedMs < FADE_MS;
            const fadingStyle = isFading
              ? {
                backgroundColor: `rgba(219, 234, 254, ${0.18 * (1 - fadeProgress)})`,
                borderColor: `rgba(59, 130, 246, ${0.55 * (1 - fadeProgress)})`,
                color: `rgba(29, 78, 216, ${0.9 * (1 - fadeProgress)})`,
              }
              : undefined;
            return (
              <foreignObject
                key={node.id}
                x={isPortrait ? node.px : node.x}
                y={isPortrait ? node.py : node.y}
                width={nodeWidth}
                height={nodeHeight}
                className="overflow-visible"
              >
                <div
                  className={`w-full h-full flex items-center justify-center rounded-lg shadow-sm border-2 font-bold text-xs text-center px-2 leading-tight transition-all duration-800 ${isActive ? "bg-blue-50 border-blue-500 text-blue-700 shadow-md scale-105 z-10" : "bg-white border-gray-200 text-gray-600"
                    }`}
                  style={fadingStyle}
                >
                  {node.label}
                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                </div>
              </foreignObject>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
