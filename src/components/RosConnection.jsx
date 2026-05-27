import { useEffect } from "react";
import ROSLIB from "roslib";

const RosConnection = ({ rosUrl, setRos }) => {
  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: rosUrl,
    });

    ros.on("connection", () => {
      console.log("Connected to ROSBridge WebSocket server.");
      const statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.innerHTML = "Connected";
        statusEl.className = "text-green-600 font-semibold";
      }
      setRos(ros);
    });

    ros.on("error", (error) => {
      console.log("Error connecting to ROSBridge:", error);
      const statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.innerHTML = "Error";
        statusEl.className = "text-red-600 font-semibold";
      }
    });

    ros.on("close", () => {
      console.log("Connection to ROSBridge closed.");
      const statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.innerHTML = "Disconnected";
        statusEl.className = "text-gray-500 font-semibold";
      }
      setRos(null);
    });

    return () => {
      ros.close();
    };
  }, [rosUrl, setRos]);

  return null;
};

export default RosConnection;
