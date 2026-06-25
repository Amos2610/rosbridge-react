import { useState, useEffect, useRef } from "react";
import RosConnection from "./components/RosConnection";
import CameraView from "./components/CameraView";
import ExecutePermissionPanel from "./components/ExecutePermissionPanel";
import LangGraphTab from "./components/LangGraphTab";
import LogTab from "./components/LogTab";
import TalkTab from "./components/TalkTab";

const LeftScreenPage = () => {
  const browserHost = window.location.hostname;
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";

  const robotHost = import.meta.env.VITE_ROBOT_HOST || browserHost;

  const rosbridgeUrl =
    import.meta.env.VITE_ROSBRIDGE_URL ||
    `${wsProtocol}://${robotHost}:9090`;

  const rvizVncUrl =
    import.meta.env.VITE_RVIZ_VNC_URL ||
    `http://${robotHost}:6080/vnc.html?autoconnect=true&resize=scale&show_dot=true`;

  const [activeTab, setActiveTab] = useState("talk");
  const [ros, setRos] = useState(null);
  const [language, setLanguage] = useState("ja");
  const languageTopic = useRef(null);
  const userInputTopic = useRef(null);
  const taskStopTopic = useRef(null);
  const [enableWebOsWideFix, setEnableWebOsWideFix] = useState(false);

  // ROS接続時に /ui_language トピックを初期化
  useEffect(() => {
    if (!ros) {
      languageTopic.current = null;
      return;
    }

    languageTopic.current = new window.ROSLIB.Topic({
      ros,
      name: "/ui_language",
      messageType: "std_msgs/String",
    });
    userInputTopic.current = new ROSLIB.Topic({
      ros,
      name: "/user_input",
      messageType: "std_msgs/String",
    });
    taskStopTopic.current = new ROSLIB.Topic({
      ros,
      name: "/rag_task_stop",
      messageType: "std_msgs/Bool",
    });

    return () => {
      languageTopic.current = null;
      userInputTopic.current = null;
      taskStopTopic.current = null;
    };
  }, [ros]);

  // ROS接続時と言語変更時に現在の言語を Publish
  useEffect(() => {
    if (!languageTopic.current) return;

    languageTopic.current.publish(
      new window.ROSLIB.Message({ data: language })
    );
  }, [ros, language]);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ua = navigator.userAgent;
      const isWebOs = /Web0S|webOS|LG\s?Browser|SmartTV|SMART-TV/i.test(ua);
      setEnableWebOsWideFix(isWebOs && w >= 1024 && h >= 600 && w > h);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleLanguage = () => {
    setLanguage((currentLanguage) =>
      currentLanguage === "ja" ? "en" : "ja"
    );
  };

  const handlePermissionYes = () => {
    userInputTopic.current?.publish(new ROSLIB.Message({ data: "yes" }));
  };

  const handlePermissionNo = () => {
    userInputTopic.current?.publish(new ROSLIB.Message({ data: "no" }));
  };

  const handlePermissionStop = () => {
    taskStopTopic.current?.publish(new ROSLIB.Message({ data: true }));
  };

  const leftTabs = [
    { id: "talk", label: "Talk", component: <TalkTab ros={ros} /> },
    { id: "log", label: "Log", component: <LogTab ros={ros} /> },
  ];

  return (
    <div className={`h-[100svh] w-screen bg-white overflow-hidden font-sans${enableWebOsWideFix ? " webos-wide-fix" : ""}`}>
      <RosConnection
        rosUrl={rosbridgeUrl}
        setRos={setRos}
      />

      <div className="h-full overflow-hidden bg-white w-full">
        <div className="h-full overflow-hidden bg-gray-50 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-2 p-2 webos-main-grid">
          <div className="min-h-0 bg-white rounded shadow-sm overflow-hidden flex flex-col">
            <div className="grid grid-cols-3 md:flex bg-white shrink-0 border-b items-stretch h-[52px]">
              {leftTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 p-2 md:p-3 font-bold text-lg md:text-2xl border-b-4 transition-all duration-150 ${
                    activeTab === tab.id
                      ? "bg-white text-gray-800 border-blue-500"
                      : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {/* 言語切り替えボタン（国旗のみ） */}
              <button
                onClick={toggleLanguage}
                title={language === "ja" ? "Switch to English" : "日本語に切り替え"}
                className="w-full md:w-14 flex items-center justify-center bg-gray-50 hover:bg-gray-200 border-b-4 border-transparent transition-all duration-300 shrink-0"
              >
                <span className="text-xl leading-none transition-transform duration-300 hover:scale-110">
                  {language === "ja" ? "🇯🇵" : "🇺🇸"}
                </span>
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden min-h-0">
              {leftTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`absolute inset-0 ${
                    activeTab === tab.id ? "block" : "hidden"
                  }`}
                >
                  {tab.component}
                </div>
              ))}
            </div>

            <ExecutePermissionPanel
              onYes={handlePermissionYes}
              onNo={handlePermissionNo}
              onStop={handlePermissionStop}
              disabled={!ros}
            />
          </div>

          <div className="hidden md:block min-h-0 bg-white rounded shadow-sm overflow-hidden">
            <LangGraphTab ros={ros} />
          </div>

          <div className="hidden md:grid gap-2 min-h-0" style={{ gridTemplateRows: "1fr auto" }}>
            <div className="bg-white rounded shadow-sm overflow-hidden min-h-0">
              <iframe
                src={rvizVncUrl}
                title="RViz noVNC"
                className="w-full h-full border-0"
                allow="fullscreen"
              />
            </div>

            <div className="bg-white rounded shadow-sm overflow-hidden min-h-0">
              {ros ? (
                <div className="w-full grid grid-cols-3 gap-2 p-2">
                  <div className="bg-white overflow-hidden shadow-sm rounded aspect-[4/3] max-h-[18vh]">
                    <CameraView ros={ros} topicName="/camera/hand_camera/color/image_raw" overlayTopicName="/object_detection/grounded_sam2/image" />
                  </div>
                  <div className="bg-white overflow-hidden shadow-sm rounded aspect-[4/3] max-h-[18vh]">
                    <CameraView ros={ros} topicName="/camera/left_camera/color/image_raw" />
                  </div>
                  <div className="bg-white overflow-hidden shadow-sm rounded aspect-[4/3] max-h-[18vh]">
                    <CameraView ros={ros} topicName="/camera/right_camera/color/image_raw" />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <p className="text-sm text-gray-500">Waiting for ROS connection...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return <LeftScreenPage />;
}

export default App;
