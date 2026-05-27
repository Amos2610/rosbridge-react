import { useEffect, useState } from "react";

const LogTab = ({ ros }) => {
  const [jointStates, setJointStates] = useState({});
  const [topics, setTopics] = useState([]);
  const [isJointConnected, setIsJointConnected] = useState(false);

  useEffect(() => {
    if (!ros) return;

    // Joint States subscription
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
      setIsJointConnected(true);
    });

    // Get topics
    ros.getTopics((result) => {
      setTopics(result.topics);
    });

    return () => {
      jointStatesTopic.unsubscribe();
      setIsJointConnected(false);
    };
  }, [ros]);

  return (
    <div className="h-full overflow-hidden flex flex-col p-4 space-y-4 bg-white">
      {/* Joint States Section */}
      <div className="bg-gray-50 rounded-lg p-4 flex-1 flex flex-col overflow-hidden">
        <h3 className="text-lg font-bold mb-3 text-gray-800 shrink-0">
          Joint States
        </h3>
        <div className="flex-1 overflow-y-auto">
          {isJointConnected && Object.keys(jointStates).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(jointStates).map(([jointName, state]) => (
                <div
                  key={jointName}
                  className="bg-white rounded border p-3 shadow-sm"
                >
                  <div className="font-semibold text-gray-800 mb-2">
                    {jointName}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Position:</span>
                      <div className="font-mono text-blue-600">
                        {state.position}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Velocity:</span>
                      <div className="font-mono text-green-600">
                        {state.velocity}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Effort:</span>
                      <div className="font-mono text-orange-600">
                        {state.effort}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No joint state data available
            </div>
          )}
        </div>
      </div>

      {/* Active Topics Section */}
      <div className="bg-gray-50 rounded-lg p-4 flex-1 flex flex-col overflow-hidden">
        <h3 className="text-lg font-bold mb-3 text-gray-800 shrink-0">
          Active Topics
        </h3>
        <div className="flex-1 overflow-y-auto">
          {topics.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {topics.map((topic, index) => (
                <div
                  key={index}
                  className="bg-white rounded border p-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                >
                  {topic}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No active topics
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogTab;
