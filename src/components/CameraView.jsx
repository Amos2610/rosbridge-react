import { useEffect, useState, useRef } from "react";
import ROSLIB from "roslib";

const CameraView = ({
  ros,
  topicName = "/camera/hand/color/image_raw",
  overlayTopicName = "/object_detection/grounded_sam2/image",
  overlayDuration = 5000
}) => {
  const canvasRef = useRef(null);
  const overlayTimeRef = useRef(0);
  const [overlayActive, setOverlayActive] = useState(false);

  useEffect(() => {
    if (!ros) return;

    const processImage = (message, isOverlay) => {
      if (isOverlay) {
        overlayTimeRef.current = Date.now();
        setOverlayActive(true);
        setTimeout(() => setOverlayActive(false), overlayDuration);
      } else {
        // If we are within the overlay duration, ignore the main camera feed
        if (Date.now() - overlayTimeRef.current < overlayDuration) {
          return;
        }
      }

      const canvas = canvasRef.current;
      if (!canvas || !message.data) return;
      const ctx = canvas.getContext("2d");

      // Handle CompressedImage
      if (message.format !== undefined) {
        let format = "jpeg";
        if (message.format.includes("png")) format = "png";
        else if (message.format.includes("jpeg")) format = "jpeg";

        const img = new Image();
        img.onload = () => {
          if (canvas.width !== img.width || canvas.height !== img.height) {
            canvas.width = img.width;
            canvas.height = img.height;
          }
          ctx.drawImage(img, 0, 0);
        };
        img.src = `data:image/${format};base64,${message.data}`;
        return;
      }

      // Handle Raw Image (sensor_msgs/Image)
      if (message.width === undefined || message.height === undefined) return;
      const width = message.width;
      const height = message.height;

      // Update canvas size if needed
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Extract bytes from base64 string or raw array
      let bytes;
      if (typeof message.data === "string") {
        try {
          const binaryString = window.atob(message.data);
          const len = binaryString.length;
          bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
        } catch (e) {
          console.error("Base64 decode failed:", e);
          return;
        }
      } else if (Array.isArray(message.data)) {
        // Some versions of rosbridge send uint8[] as JSON arrays
        bytes = new Uint8Array(message.data);
      } else {
        console.warn("Unknown message.data format:", typeof message.data);
        return;
      }

      // Create ImageData
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Handle rgb8 or bgr8
      const isBgr = message.encoding === "bgr8";

      for (let i = 0, j = 0; i < bytes.length; i += 3, j += 4) {
        data[j] = isBgr ? bytes[i + 2] : bytes[i];         // R
        data[j + 1] = bytes[i + 1];                        // G
        data[j + 2] = isBgr ? bytes[i] : bytes[i + 2];     // B
        data[j + 3] = 255;                                 // Alpha
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const mainTopic = new ROSLIB.Topic({
      ros: ros,
      name: topicName,
      messageType: "sensor_msgs/msg/Image",
    });

    const overlayTopic = new ROSLIB.Topic({
      ros: ros,
      name: overlayTopicName,
      messageType: "sensor_msgs/msg/Image",
      qos: {
        reliability: "reliable",
        durability: "transient_local",
        history: "keep_last",
        depth: 1
      }
    });

    mainTopic.subscribe((message) => processImage(message, false));
    overlayTopic.subscribe((message) => processImage(message, true));

    return () => {
      mainTopic.unsubscribe();
      overlayTopic.unsubscribe();
    };
  }, [ros, topicName, overlayTopicName, overlayDuration]);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-gray-800">Camera View</h3>
        {overlayActive && (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            Detection Overlay Active
          </span>
        )}
      </div>
      <div className="flex-1 w-full overflow-hidden rounded-md bg-gray-200 flex items-center justify-center relative">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
};

export default CameraView;
