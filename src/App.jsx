import { useState } from "react";
import RosConnection from "./components/RosConnection";
import RVizPanel from "./components/RVizPanel";
import TalkTab from "./components/TalkTab";
import LogTab from "./components/LogTab";
import AccountTab from "./components/AccountTab";

function App() {
  const [ros, setRos] = useState(null);
  const [activeTab, setActiveTab] = useState("talk");

  const tabs = [
    { id: "talk", label: "Talk", component: <TalkTab ros={ros} /> },
    { id: "log", label: "Log", component: <LogTab ros={ros} /> },
    { id: "account", label: "Account", component: <AccountTab /> },
  ];

  return (
    <div className="h-screen w-screen flex bg-white">
      <RosConnection
        rosUrl="ws://localhost:9090"
        rosDomainId="89"
        setRos={setRos}
      />

      {/* Left Side - Tabs and Content */}
      <div className="w-1/2 flex flex-col border-r">
        {/* Tab Bar */}
        <div className="flex bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-3 font-bold text-3xl border-b-2 transition-colors duration-150 ${
                activeTab === tab.id
                  ? "bg-white text-gray-800 border-blue-500 hover:bg-white"
                  : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {tab.id === "account" ? (
                <div className="flex items-center justify-center gap-1">
                  <span>{tab.label}</span>
                  <img
                    src={"/nishidalab_logo.png"}
                    alt="logo"
                    className="w-8 h-8"
                  />
                </div>
              ) : (
                tab.label
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`absolute inset-0 ${activeTab === tab.id ? "block" : "hidden"}`}
            >
              {tab.component}
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - RViz Panel */}
      <div className="w-1/2">
        {ros ? (
          <RVizPanel ros={ros} />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">🔌</div>
              <p className="text-xl text-gray-600 mb-2">
                Waiting for ROS connection...
              </p>
              <p className="text-sm text-gray-500">
                Make sure rosbridge_server is running on ws://localhost:9090
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
