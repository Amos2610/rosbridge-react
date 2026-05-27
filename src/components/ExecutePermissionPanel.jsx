const ExecutePermissionPanel = ({ onYes, onNo, onStop, disabled = false }) => {
  return (
    <div className="bg-white shadow-md rounded-b-lg p-3 border-t-4 border-blue-500 shrink-0">
      <h3 className="text-sm font-bold mb-2 text-gray-800">実行許可</h3>
      <div className="flex items-center gap-3">
        <button
          onClick={onYes}
          disabled={disabled}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-xl shadow-sm"
        >
          YES
        </button>
        <button
          onClick={onNo}
          disabled={disabled}
          className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 font-bold py-3 rounded-xl transition-all active:scale-95 text-xl shadow-sm"
        >
          No
        </button>
        <button
          onClick={onStop}
          disabled={disabled}
          className="flex-none w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed shadow-lg active:scale-90 transition-all shrink-0"
        >
          <span className="text-white text-[10px] font-black leading-tight text-center">STOP</span>
        </button>
      </div>
    </div>
  );
};

export default ExecutePermissionPanel;
