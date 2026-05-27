import { useState, useEffect, useRef } from "react";

const TalkTab = ({ ros }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [talkMode, setTalkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // ROS Topics
  const userInputTopic = useRef(null);
  const responseStreamTopic = useRef(null);
  const responseTopic = useRef(null);
  const talkModeTopic = useRef(null);
  const talkModeMutedTopic = useRef(null);
  const srStatusTopic = useRef(null);
  const srTranscriptTopic = useRef(null);

  // 自動スクロール用
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // バックエンドからの完結した文を新しい吹き出しとして追加する
  const addBotMessage = (text) => {
    if (!text || !text.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        type: "ai",
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestampMs: Date.now(),
      },
    ]);
  };

  useEffect(() => {
    if (!ros) return;

    userInputTopic.current = new window.ROSLIB.Topic({
      ros,
      name: "/user_input",
      messageType: "std_msgs/String",
    });

    responseStreamTopic.current = new window.ROSLIB.Topic({
      ros,
      name: "/chatbot_response_stream",
      messageType: "std_msgs/String",
    });

    responseTopic.current = new window.ROSLIB.Topic({
      ros,
      name: "/chatbot_response",
      messageType: "std_msgs/String",
    });

    talkModeTopic.current = new window.ROSLIB.Topic({
      ros,
      name: "/talk_mode",
      messageType: "std_msgs/Bool",
    });

    talkModeMutedTopic.current = new window.ROSLIB.Topic({
      ros,
      name: "/talk_mode_muted",
      messageType: "std_msgs/Bool",
    });

    srStatusTopic.current = new window.ROSLIB.Topic({
      ros,
      name: "/speech_recognition_status",
      messageType: "std_msgs/String",
    });

    srTranscriptTopic.current = new window.ROSLIB.Topic({
      ros,
      name: "/speech_recognition_transcript",
      messageType: "std_msgs/String",
    });

    // パブリッシュごとに独立した吹き出しを作成する
    responseStreamTopic.current.subscribe((message) => {
      addBotMessage(message.data);
    });

    // /chatbot_response はレガシー互換で購読するが現状は無害
    responseTopic.current.subscribe(() => {});

    srStatusTopic.current.subscribe((message) => {
      setIsListening(message.data === "listening");
      setIsProcessing(message.data === "processing");
    });

    // 音声認識トランスクリプトをユーザー発話として表示
    srTranscriptTopic.current.subscribe((message) => {
      const transcript = message.data.trim();
      if (!transcript) return;
      setMessages((prev) => [
        ...prev,
        {
          type: "user",
          text: transcript,
          timestamp: new Date().toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestampMs: Date.now(),
        },
      ]);
    });

    setIsConnected(true);

    return () => {
      responseStreamTopic.current?.unsubscribe();
      responseTopic.current?.unsubscribe();
      srStatusTopic.current?.unsubscribe();
      srTranscriptTopic.current?.unsubscribe();
      setIsConnected(false);
    };
  }, [ros]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    talkModeMutedTopic.current?.publish(new window.ROSLIB.Message({ data: nextMuted }));
  };

  const handleToggleTalkMode = () => {
    if (!isConnected) return;
    const nextTalkMode = !talkMode;
    setTalkMode(nextTalkMode);
    if (!nextTalkMode) {
      setIsMuted(false);
      setIsListening(false);
      talkModeMutedTopic.current?.publish(new window.ROSLIB.Message({ data: false }));
    }
    talkModeTopic.current?.publish(new window.ROSLIB.Message({ data: nextTalkMode }));
  };

  // トークモード中は 2 秒ごとにキープアライブを送信
  useEffect(() => {
    if (!talkMode || !isConnected) return;
    const timer = setInterval(() => {
      talkModeTopic.current?.publish(new window.ROSLIB.Message({ data: true }));
    }, 2000);
    return () => clearInterval(timer);
  }, [talkMode, isConnected]);

  const handleSendMessage = (text) => {
    if (!text.trim() || !isConnected) return;
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestampMs: Date.now(),
      },
    ]);
    userInputTopic.current.publish(new window.ROSLIB.Message({ data: text.trim() }));
  };

  const handleSend = () => {
    if (!inputText.trim() || !isConnected) return;
    handleSendMessage(inputText);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // テキストエリアの高さを自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [inputText]);

  const displayMessages = [...messages].sort(
    (a, b) => (a.timestampMs || 0) - (b.timestampMs || 0)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 接続状態表示 */}
      <div className="p-2 bg-gray-100 text-center">
        <span
          className={`text-sm ${
            isConnected ? "text-green-600" : "text-red-600"
          }`}
        >
          {isConnected ? "🟢 ROS接続中" : "🔴 ROS未接続"}
        </span>
      </div>

      {/* チャット履歴 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((msg, index) => (
          <div
            key={`${msg.timestampMs}-${index}`}
            className={`flex flex-col ${
              msg.type === "ai" ? "items-start" : "items-end"
            }`}
          >
            <div
              className={`flex ${
                msg.type === "ai" ? "justify-start" : "justify-end"
              }`}
            >
              {msg.type === "ai" && (
                <div className="mr-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg">🧠</span>
                  </div>
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.type === "ai"
                    ? "bg-linear-to-br from-amber-50 to-amber-100 text-gray-800 border border-amber-200"
                    : "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-md"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {msg.text}
                </p>
              </div>
              {msg.type === "user" && (
                <div className="ml-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <img
                      src={"/nishidalab_logo.png"}
                      alt="logo"
                      className="w-8 h-8"
                    />
                  </div>
                </div>
              )}
            </div>
            <p
              className={`text-xs mt-1 ${
                msg.type === "ai"
                  ? "text-gray-500 ml-10"
                  : "text-gray-500 mr-10"
              }`}
            >
              {msg.timestamp}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t p-4 bg-white">
        {talkMode && (
          <div className="flex items-center gap-1 mb-2 text-xs font-medium">
            {isMuted ? (
              <>
                <span className="inline-block w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-red-400">ミュート中</span>
              </>
            ) : isProcessing ? (
              <>
                <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-amber-500">思考中...</span>
              </>
            ) : isListening ? (
              <>
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-blue-500">聞いています...</span>
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-gray-400">待機中...</span>
              </>
            )}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力... (Shift+Enterで改行)"
            className="flex-1 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[44px] max-h-[120px] overflow-y-auto text-gray-500"
            rows={1}
            disabled={!isConnected}
          />
          {talkMode && (
            <button
              onClick={handleToggleMute}
              title={isMuted ? "クリックしてミュート解除" : "クリックしてミュート"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                isMuted
                  ? "bg-red-100 hover:bg-red-200"
                  : "bg-blue-100 hover:bg-blue-200"
              }`}
            >
              <img
                src={isMuted ? "/microphone_mute_red.svg" : "/microphone.svg"}
                alt={isMuted ? "muted" : "listening"}
                className="w-5 h-5"
              />
            </button>
          )}
          <button
            onClick={handleToggleTalkMode}
            disabled={!isConnected}
            title={talkMode ? "トークモード終了" : "クリックして音声入力を開始"}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
              isListening
                ? "bg-blue-500 ring-4 ring-blue-300 animate-pulse"
                : talkMode
                ? "bg-blue-500 hover:bg-blue-600 ring-2 ring-blue-200"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            <img
              src="/icons8-audio-wave-24.png"
              alt="voice input"
              className={`w-5 h-5 ${talkMode ? "" : "opacity-50"}`}
            />
          </button>
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputText.trim()}
            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:bg-gray-300 shrink-0"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TalkTab;
