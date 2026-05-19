import Scene3D from "./Scene3D";
import CameraView from "./CameraView";

const RVizPanel = ({ ros }) => {
  return (
    <div className="h-full bg-gray-100 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">

        <div className="flex-[40] bg-white shadow-sm rounded-lg flex flex-col overflow-hidden min-h-0">
          <div className="bg-gray-50 border-b px-3 py-1 flex shrink-0">
            <span className="font-bold text-gray-700 text-sm">3D Visualization (RViz)</span>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <Scene3D ros={ros} />
          </div>
        </div>

        {/* Camera View */}
        <div className="flex-[40] bg-white shadow-sm rounded-lg flex flex-col overflow-hidden min-h-0">
          <div className="bg-gray-50 border-b px-3 py-1 flex shrink-0">
            <span className="font-bold text-gray-700 text-sm">Camera View</span>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <CameraView ros={ros} topicName="/camera/hand_camera/color/image_raw" />
          </div>
        </div>

        <div className="flex-[20] bg-white shadow-md rounded-lg p-3 flex flex-col justify-center border-t-4 border-blue-500 min-h-0 shrink-0">
          <h3 className="text-sm font-bold mb-2 text-gray-800">実行許可</h3>
          <div className="flex items-center gap-3">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-xl shadow-sm">
              YES
            </button>
            <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all active:scale-95 text-xl shadow-sm">
              No
            </button>
            <button className="flex-none w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg active:scale-90 transition-all shrink-0">
              <span className="text-white text-[10px] font-black leading-tight text-center">STOP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RVizPanel;