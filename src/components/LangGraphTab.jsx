import React, { useEffect, useState, useRef } from "react";
import ROSLIB from "roslib";

export default function LangGraphTab({ ros }) {
  const [displayNode, setDisplayNode] = useState("idle");
  const [nodeQueue, setNodeQueue] = useState([]);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!ros) return;

    const stateListener = new ROSLIB.Topic({
      ros: ros,
      name: "/langgraph_current_state",
      messageType: "std_msgs/String",
    });

    stateListener.subscribe((message) => {
      setNodeQueue((prev) => [...prev, message.data]);
    });

    return () => {
      stateListener.unsubscribe();
    };
  }, [ros]);

  // キューを監視し、一定時間ごとに一つずつ表示を切り替える
  useEffect(() => {
    if (nodeQueue.length > 0 && !isProcessing.current) {
      isProcessing.current = true;

      const nextNode = nodeQueue[0];
      setDisplayNode(nextNode);

      // 最低表示時間を1200msに設定し、瞬間的な遷移を防ぐ 
      setTimeout(() => {
        setNodeQueue((prev) => prev.slice(1));
        isProcessing.current = false;
      }, 1200);
    }
  }, [nodeQueue]);

  // グラフデータの座標とラベル
  const nodes = [
    { id: "classify_intent", label: "対話管理", x: 310, y: 30 },

    { id: "handle_chat_or_intro", label: "雑談", x: 20, y: 120 },
    { id: "clarify_task", label: "内容を確認する", x: 165, y: 120 },
    { id: "extract_task", label: "やることを決める", x: 310, y: 120 },
    { id: "handle_agent", label: "エージェント", x: 455, y: 120 },
    { id: "cancel_task", label: "キャンセル", x: 600, y: 120 },
    { id: "publish_task", label: "実行する", x: 745, y: 120 },

    { id: "detect_objects", label: "物体を探す", x: 165, y: 210 },
    { id: "ground_task", label: "対象を確認する", x: 310, y: 210 },
    { id: "monitor_execution", label: "ロボットの動作を監視", x: 745, y: 210 },

    { id: "estimate_grasp", label: "つかみ方を考える", x: 165, y: 300 },
    { id: "assemble_skills", label: "動きを組み立てる", x: 310, y: 300 },
    { id: "explain_result", label: "結果を教える", x: 745, y: 300 },

    { id: "simulate_task", label: "画面で確認する", x: 310, y: 390 },
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

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 overflow-auto">
      <div className="p-3 border-b bg-white flex justify-between items-center shadow-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-800">エージェントの状態</h2>
          <p className="text-gray-500 text-xs">AIが今何を考えているかを表示しています</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 処理がたまっている場合はオレンジ色で点滅 */}
          <span className="relative flex h-2.5 w-2.5">
            {displayNode !== "idle" && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${nodeQueue.length > 2 ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${displayNode === 'idle' ? 'bg-gray-400' : 'bg-blue-500'}`}></span>
          </span>
          <span className="text-xs font-semibold text-gray-600">
            {displayNode === "idle" ? "待機中" : "実行中"}
          </span>
        </div>
      </div>

      <div className="flex-1 relative overflow-auto p-6 min-w-[880px] min-h-[500px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:18px_18px]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <marker id="arrowhead" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 9 3, 0 6" fill="#cbd5e1" />
            </marker>
            <marker id="arrowhead-active" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 9 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>
          {edges.map((edge, i) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            let startX, startY, endX, endY, cp1X, cp1Y, cp2X, cp2Y;

            if (fromNode.y === toNode.y) {
              if (fromNode.x < toNode.x) {
                startX = fromNode.x + nodeWidth;
                startY = fromNode.y + nodeHeight / 2;
                endX = toNode.x;
                endY = toNode.y + nodeHeight / 2;
              } else {
                startX = fromNode.x;
                startY = fromNode.y + nodeHeight / 2;
                endX = toNode.x + nodeWidth;
                endY = toNode.y + nodeHeight / 2;
              }
              cp1X = startX + (endX - startX) / 2;
              cp1Y = startY;
              cp2X = startX + (endX - startX) / 2;
              cp2Y = endY;
            } else {
              startX = fromNode.x + nodeWidth / 2;
              startY = fromNode.y + nodeHeight;
              endX = toNode.x + nodeWidth / 2;
              endY = toNode.y;

              const curveFactor = (endY - startY) / 2;
              cp1X = startX;
              cp1Y = startY + curveFactor;
              cp2X = endX;
              cp2Y = endY - curveFactor;

              if (edge.from === "ground_task" && edge.to === "simulate_task") {
                cp1X = startX + 120;
                cp2X = endX + 120;
              }
            }

            const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
            const isActiveEdge = displayNode === edge.from;

            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={isActiveEdge ? "#3b82f6" : "#e2e8f0"}
                strokeWidth={isActiveEdge ? "2.2" : "1.8"}
                markerEnd={isActiveEdge ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                className="transition-all duration-800"
              />
            );
          })}
        </svg>

        {nodes.map((node) => {
          const isActive = displayNode === node.id;
          return (
            <div
              key={node.id}
              className={`absolute flex items-center justify-center rounded-lg shadow-sm border-2 font-bold text-xs text-center px-2 leading-tight transition-all duration-800 ${isActive
                ? "bg-blue-50 border-blue-500 text-blue-700 shadow-blue-100 shadow-md scale-105 z-10"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              style={{
                left: node.x,
                top: node.y,
                width: nodeWidth,
                height: nodeHeight,
              }}
            >
              {node.label}
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}