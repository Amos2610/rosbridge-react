import { useState } from "react";
import RosConnection from "./components/RosConnection";
import AccountTab from "./components/AccountTab";
import CameraView from "./components/CameraView";
import ExecutePermissionPanel from "./components/ExecutePermissionPanel";
import LangGraphTab from "./components/LangGraphTab";
import LogTab from "./components/LogTab";
import TalkTab from "./components/TalkTab";

const LeftScreenPage = () => {
  const [activeTab, setActiveTab] = useState("talk");
  const [ros, setRos] = useState(null);

  const leftTabs = [
    { id: "talk", label: "Talk", component: <TalkTab ros={ros} /> },
    { id: "log", label: "Log", component: <LogTab ros={ros} /> },
    { id: "graph", label: "Agent Graph", component: <LangGraphTab ros={ros} /> },
    { id: "account", label: "Account", component: <AccountTab /> },
  ];

  return (
    <div className="h-screen w-screen bg-white overflow-hidden font-sans">
      <RosConnection
        rosUrl="ws://localhost:9090"
        rosDomainId="89"
        setRos={setRos}
      />
      <div className="w-full h-full flex flex-col overflow-hidden bg-white">
          <div className="flex bg-white shrink-0 border-b">
            {leftTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 p-3 font-bold text-2xl border-b-4 transition-all duration-150 ${
                  activeTab === tab.id
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
          </div>

          <div className="flex-1 relative overflow-hidden bg-gray-50 min-h-0">
            {leftTabs.map((tab) => (
              <div
                key={tab.id}
                className={`absolute inset-0 ${activeTab === tab.id ? "block" : "hidden"}`}
              >
                {tab.component}
              </div>
            ))}
          </div>

          <ExecutePermissionPanel />
      </div>
    </div>
  );
};

const RightBottomPage = () => {
  const [ros, setRos] = useState(null);
  return (
    <div className="h-screen w-screen bg-white overflow-hidden font-sans">
      <RosConnection
        rosUrl="ws://localhost:9090"
        rosDomainId="89"
        setRos={setRos}
      />
      <div className="w-full h-full bg-gray-100 flex flex-col">
          <div className="bg-white border-b px-3 py-1 shrink-0">
            <span className="font-bold text-gray-700 text-sm">Camera View</span>
          </div>
          <div className="flex-1 min-h-0">
          {ros ? (
            <div className="h-full w-full grid grid-cols-3 gap-2">
              <div className="bg-white overflow-hidden shadow-sm">
                <CameraView ros={ros} topicName="/camera/hand_camera/color/image_raw" />
              </div>
              <div className="bg-white overflow-hidden shadow-sm">
                <CameraView ros={ros} topicName="/camera/left/color/image_raw" />
              </div>
              <div className="bg-white overflow-hidden shadow-sm">
                <CameraView ros={ros} topicName="/camera/right/color/image_raw" />
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
  );
};

function App() {
  const path = window.location.pathname;
  if (path === "/right-bottom"){
    return <RightBottomPage />;
  } else {
    return <LeftScreenPage />;
  }
}

export default App;
