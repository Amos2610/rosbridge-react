import Scene3D from "./Scene3D";
import CameraView from "./CameraView";

const RVizPanel = ({ ros }) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* RViz タイトル */}
      <div className="bg-white border-b">
        <h2 className="text-3xl font-bold text-gray-800 p-3">RViz</h2>
      </div>

      {/* 3D Visualization and Camera */}
      <div className="flex-1 overflow-hidden flex flex-col p-1 gap-4">
        {/* 3D Visualization */}
        <div className="bg-white shadow-lg p-1 shrink-0 h-0 flex-1 flex flex-col">
          <h3 className="text-lg font-bold mb-2 text-gray-800">
            3D Visualization
          </h3>
          <div className="flex-1 overflow-hidden">
            <Scene3D ros={ros} />
          </div>
        </div>

        {/* Camera View */}
        <div className="bg-white shadow-lg p-1 shrink-0 h-0 flex-1 flex flex-col overflow-hidden">
          <CameraView ros={ros} topicName="/camera/hand/color/image_raw" />
        </div>
      </div>

      {/* 実行許可エリア */}
      <div className="bg-white border-t px-4 py-4 shrink-0">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">実行許可</h3>
        <div className="flex items-center gap-3">
          <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            YES
          </button>
          <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors">
            No
          </button>
          <button className="flex-none w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
            <span className="text-white text-xs font-bold text-center">
              STOP
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RVizPanel;
