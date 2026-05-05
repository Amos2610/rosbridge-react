import { useState, useEffect, useRef } from "react";
import ROSLIB from "roslib";

const TalkTab = ({ ros }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentBotMessage, setCurrentBotMessage] = useState(null);

  // ROS Topics
  const userInputTopic = useRef(null);
  const responseStreamTopic = useRef(null);
  const responseTopic = useRef(null);

  // 自動スクロール用
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!ros) return;

    // ROS Topicの初期化
    userInputTopic.current = new ROSLIB.Topic({
      ros: ros,
      name: "/user_input",
      messageType: "std_msgs/String",
    });

    responseStreamTopic.current = new ROSLIB.Topic({
      ros: ros,
      name: "/chatbot_response_stream",
      messageType: "std_msgs/String",
    });

    responseTopic.current = new ROSLIB.Topic({
      ros: ros,
      name: "/chatbot_response",
      messageType: "std_msgs/String",
    });

    // ストリーミングチャンクの処理
    const handleStreamChunk = (chunk) => {
      setCurrentBotMessage((prev) => {
        const now = Date.now();

        if (!prev) {
          // 新しいメッセージ開始
          return {
            type: "ai",
            text: chunk,
            timestamp: new Date().toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            timestampMs: now,
            streaming: true,
          };
        } else {
          // 既存メッセージに追加（ストリーミング中の場合のみ）
          return {
            ...prev,
            text: (prev.text || "") + chunk,
            streaming: true,
          };
        }
      });
    };

    // 完了応答の処理
    const handleCompleteResponse = () => {
      setCurrentBotMessage((prev) => {
        if (prev && prev.streaming === true) {
          // 完了したメッセージをmessagesに追加
          // ただし、既にmessagesに存在する場合は追加しない（重複防止）
          setMessages((messages) => {
            // 同じタイムスタンプのメッセージが既に存在するかチェック
            const alreadyExists = messages.some(
              (msg) =>
                msg.type === "ai" &&
                msg.timestampMs === prev.timestampMs &&
                msg.text === prev.text
            );
            if (!alreadyExists) {
              return [...messages, { ...prev, streaming: false }];
            }
            return messages;
          });
        }
        // currentBotMessageをクリア
        return null;
      });
    };

    // ストリーミング応答の購読
    responseStreamTopic.current.subscribe((message) => {
      handleStreamChunk(message.data);
    });

    // 完了応答の購読
    responseTopic.current.subscribe(() => {
      handleCompleteResponse();
    });

    setIsConnected(true);

    return () => {
      responseStreamTopic.current?.unsubscribe();
      responseTopic.current?.unsubscribe();
      setIsConnected(false);
    };
  }, [ros]);

  // テキスト送信
  const handleSend = () => {
    if (!inputText.trim() || !isConnected) return;
    handleSendMessage(inputText);
    setInputText("");
    // テキストエリアの高さをリセット
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSendMessage = (text) => {
    const timestamp = new Date().toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const timestampMs = Date.now();

    // 新しいユーザーメッセージ送信時に、前のストリーミング中のメッセージがあれば保存
    setCurrentBotMessage((prev) => {
      if (prev && prev.streaming === true) {
        // ストリーミング中のメッセージとユーザーメッセージをまとめて追加
        // 重複チェック: 同じタイムスタンプのメッセージが既に存在しないことを確認
        setMessages((messages) => {
          const alreadyExists = messages.some(
            (msg) =>
              msg.type === "ai" &&
              msg.timestampMs === prev.timestampMs &&
              msg.text === prev.text
          );
          if (!alreadyExists) {
            return [
              ...messages,
              { ...prev, streaming: false },
              {
                type: "user",
                text: text,
                timestamp: timestamp,
                timestampMs: timestampMs,
              },
            ];
          } else {
            // AIメッセージが既に存在する場合は、ユーザーメッセージのみ追加
            // ユーザーメッセージも重複チェック
            const userAlreadyExists = messages.some(
              (msg) =>
                msg.type === "user" &&
                msg.timestampMs === timestampMs &&
                msg.text === text
            );
            if (!userAlreadyExists) {
              return [
                ...messages,
                {
                  type: "user",
                  text: text,
                  timestamp: timestamp,
                  timestampMs: timestampMs,
                },
              ];
            }
            return messages;
          }
        });
      } else {
        // ストリーミング中のメッセージがない場合は、ユーザーメッセージのみ追加
        setMessages((messages) => {
          // 同じタイムスタンプとテキストのユーザーメッセージが既に存在しないことを確認
          const alreadyExists = messages.some(
            (msg) =>
              msg.type === "user" &&
              msg.timestampMs === timestampMs &&
              msg.text === text
          );
          if (!alreadyExists) {
            return [
              ...messages,
              {
                type: "user",
                text: text,
                timestamp: timestamp,
                timestampMs: timestampMs,
              },
            ];
          }
          return messages;
        });
      }
      return null;
    });

    // ROSトピックに送信
    const message = new ROSLIB.Message({
      data: text,
    });
    userInputTopic.current.publish(message);
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
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // 最大高さ（px）
      textareaRef.current.style.height = `${Math.min(
        scrollHeight,
        maxHeight
      )}px`;
    }
  }, [inputText]);

  // メッセージをタイムスタンプでソート（currentBotMessageも含めて）
  const allMessages =
    currentBotMessage && currentBotMessage.streaming === true
      ? [...messages, currentBotMessage]
      : messages;

  const displayMessages = allMessages.sort((a, b) => {
    const timeA = a.timestampMs || 0;
    const timeB = b.timestampMs || 0;
    return timeA - timeB;
  });

  // 自動スクロール処理
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
            key={index}
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
