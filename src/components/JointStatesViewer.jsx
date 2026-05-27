import { useEffect, useState } from "react";

const JointStatesViewer = ({ ros }) => {
  const [jointStates, setJointStates] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!ros) return;

    const jointStatesTopic = new window.ROSLIB.Topic({
      ros: ros,
      name: "/joint_states",
      messageType: "sensor_msgs/JointState",
    });

    jointStatesTopic.subscribe((message) => {
      const states = {};
      message.name.forEach((name, index) => {
        states[name] = {
          position: message.position[index]?.toFixed(3) || "N/A",
          velocity: message.velocity[index]?.toFixed(3) || "N/A",
          effort: message.effort[index]?.toFixed(3) || "N/A",
        };
      });
      setJointStates(states);
      setIsConnected(true);
    });

    return () => {
      jointStatesTopic.unsubscribe();
      setIsConnected(false);
    };
  }, [ros]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-xl font-bold mb-3 text-gray-800">Joint States</h3>
      <div className="max-h-96 overflow-y-auto">
        {isConnected ? (
          <div className="space-y-2">
            {Object.entries(jointStates).map(([jointName, state]) => (
              <div key={jointName} className="border-b pb-2">
                <div className="font-semibold text-gray-700">{jointName}</div>
                <div className="text-sm text-gray-600 ml-2">
                  <div>Position: {state.position}</div>
                  <div>Velocity: {state.velocity}</div>
                  <div>Effort: {state.effort}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            No joint state data
          </div>
        )}
      </div>
    </div>
  );
};

export default JointStatesViewer;
