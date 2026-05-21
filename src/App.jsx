import { useState, useEffect, useRef } from "react";
import ROSLIB from "roslib";
import RosConnection from "./components/RosConnection";
import RVizPanel from "./components/RVizPanel";
import TalkTab from "./components/TalkTab";
import LogTab from "./components/LogTab";
import AccountTab from "./components/AccountTab";
import LangGraphTab from "./components/LangGraphTab";

function App() {
  const [ros, setRos] = useState(null);
  const [activeTab, setActiveTab] = useState("talk");
  const [activeRightTab, setActiveRightTab] = useState("rviz");
  const [language, setLanguage] = useState("ja");
  const languageTopic = useRef(null);

  // ROS接続時に /ui_language トピックを初期化し、現在の言語を Publish
  useEffect(() => {
    if (!ros) {
      languageTopic.current = null;
      return;
    }
    languageTopic.current = new ROSLIB.Topic({
      ros,
      name: "/ui_language",
      messageType: "std_msgs/String",
    });
    // 接続直後に現在の言語設定を送信
    languageTopic.current.publish(
      new ROSLIB.Message({ data: language })
    );
  }, [ros]);

  const toggleLanguage = () => {
    const nextLang = language === "ja" ? "en" : "ja";
    setLanguage(nextLang);
    if (languageTopic.current) {
      languageTopic.current.publish(
        new ROSLIB.Message({ data: nextLang })
      );
    }
  };

  const leftTabs = [
    { id: "talk", label: "Talk", component: <TalkTab ros={ros} /> },
    { id: "log", label: "Log", component: <LogTab ros={ros} /> },
    { id: "account", label: "Account", component: <AccountTab /> },
  ];

  const rightTabs = [
    { id: "rviz", label: "RViz", component: <RVizPanel ros={ros} /> },
    { id: "graph", label: "Agent Graph", component: <LangGraphTab ros={ros} /> },
  ];

  return (
    <div className="h-screen w-screen flex bg-white overflow-hidden font-sans">
      <RosConnection
        rosUrl="ws://localhost:9090"
        setRos={setRos}
      />

      <div className="w-1/2 flex flex-col border-r h-full overflow-hidden">
        <div className="flex bg-white shrink-0 border-b items-stretch">
          {leftTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-3 font-bold text-2xl border-b-4 transition-all duration-150 ${activeTab === tab.id
                ? "bg-white text-gray-800 border-blue-500"
                : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-50"
                }`}
            >
              {tab.id === "account" ? (
                <div className="flex items-center justify-center gap-2">
                  <span>{tab.label}</span>
                  <img src="/nishidalab_logo.png" alt="logo" className="w-6 h-6" />
                </div>
              ) : (
                tab.label
              )}
            </button>
          ))}
          {/* 言語切り替えボタン */}
          <button
            onClick={toggleLanguage}
            title={language === "ja" ? "Switch to English" : "日本語に切り替え"}
            className="w-20 flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-200 border-b-4 border-transparent transition-all duration-300 shrink-0"
          >
            <span className={`text-base transition-all duration-300 ${language === "en" ? "hue-rotate-180 opacity-80" : ""}`}>🌐</span>
            <span className={`text-sm font-bold w-6 text-center transition-colors duration-300 ${language === "ja" ? "text-red-600" : "text-blue-600"}`}>
              {language === "ja" ? "JA" : "EN"}
            </span>
          </button>
        </div>
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          {leftTabs.map((tab) => (
            <div key={tab.id} className={`absolute inset-0 ${activeTab === tab.id ? "block" : "hidden"}`}>
              {tab.component}
            </div>
          ))}
        </div>
      </div>

      <div className="w-1/2 flex flex-col h-full overflow-hidden">
        {ros ? (
          <>
            <div className="flex bg-white shrink-0 border-b">
              {rightTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRightTab(tab.id)}
                  className={`flex-1 p-3 font-bold text-2xl border-b-4 transition-all duration-150 ${activeRightTab === tab.id
                    ? "bg-white text-gray-800 border-blue-500"
                    : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-50"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 relative overflow-hidden">
              {rightTabs.map((tab) => (
                <div key={tab.id} className={`absolute inset-0 ${activeRightTab === tab.id ? "block" : "hidden"}`}>
                  {tab.component}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">🔌</div>
              <p className="text-xl text-gray-600 mb-2">Waiting for ROS connection...</p>
              <p className="text-sm text-gray-500">Make sure rosbridge_server is running on ws://localhost:9090</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;