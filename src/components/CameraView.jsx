import { useEffect, useState, useRef } from "react";

const CameraView = ({
  ros,
  topicName = "/camera/hand/color/image_raw",
  overlayTopicName = null,
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
        if (Date.now() - overlayTimeRef.current < overlayDuration) return;
      }

      const canvas = canvasRef.current;
      if (!canvas || !message.data) return;
      const ctx = canvas.getContext("2d");

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

      if (message.width === undefined || message.height === undefined) return;
      const width = message.width;
      const height = message.height;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      let bytes;
      if (typeof message.data === "string") {
        const binaryString = window.atob(message.data);
        bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      } else if (Array.isArray(message.data)) {
        bytes = new Uint8Array(message.data);
      } else {
        return;
      }

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      const isBgr = message.encoding === "bgr8";

      for (let i = 0, j = 0; i < bytes.length; i += 3, j += 4) {
        data[j] = isBgr ? bytes[i + 2] : bytes[i];
        data[j + 1] = bytes[i + 1];
        data[j + 2] = isBgr ? bytes[i] : bytes[i + 2];
        data[j + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const mainTopic = new window.ROSLIB.Topic({ ros, name: topicName, messageType: "sensor_msgs/msg/Image" });
    mainTopic.subscribe((message) => processImage(message, false));

    let overlayTopic = null;
    if (overlayTopicName) {
      overlayTopic = new window.ROSLIB.Topic({ ros, name: overlayTopicName, messageType: "sensor_msgs/msg/Image" });
      overlayTopic.subscribe((message) => processImage(message, true));
    }

    return () => {
      mainTopic.unsubscribe();
      overlayTopic?.unsubscribe();
    };
  }, [ros, topicName, overlayTopicName, overlayDuration]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-200 relative overflow-hidden">
      {overlayActive && (
        <span className="absolute top-2 right-2 z-20 bg-green-500 text-white px-2 py-1 rounded-full text-[10px] font-bold animate-pulse shadow-md">
          Detection Overlay Active
        </span>
      )}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default CameraView;