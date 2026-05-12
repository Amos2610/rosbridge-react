import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera } from "@react-three/drei";
import ROSLIB from "roslib";
import * as THREE from "three";

const RobotModel = ({ ros }) => {
  const [jointStates, setJointStates] = useState({});

  useEffect(() => {
    if (!ros) return;

    const jointStatesTopic = new ROSLIB.Topic({
      ros: ros,
      name: "/joint_states",
      messageType: "sensor_msgs/JointState",
    });

    jointStatesTopic.subscribe((message) => {
      const states = {};
      message.name.forEach((name, index) => {
        states[name] = message.position[index] || 0;
      });
      setJointStates(states);
    });

    return () => {
      jointStatesTopic.unsubscribe();
    };
  }, [ros]);

  // XArm6の簡易モデル（URDFが取得できない場合のフォールバック）
  const renderXArm6Model = () => {
    const jointPositions = {
      joint1: jointStates.joint1 || 0,
      joint2: jointStates.joint2 || 0,
      joint3: jointStates.joint3 || 0,
      joint4: jointStates.joint4 || 0,
      joint5: jointStates.joint5 || 0,
      joint6: jointStates.joint6 || 0,
    };

    return (
      <group>
        {/* Base */}
        <mesh position={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.1, 0.1, 0.2]} />
          <meshStandardMaterial color="black" />
        </mesh>

        {/* Link 1 */}
        <group rotation={[0, 0, jointPositions.joint1]}>
          <mesh position={[0, 0, 0.2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.15]} />
            <meshStandardMaterial color="black" />
          </mesh>

          {/* Link 2 */}
          <group
            rotation={[jointPositions.joint2, 0, 0]}
            position={[0, 0, 0.35]}
          >
            <mesh position={[0.2, 0, 0]}>
              <boxGeometry args={[0.4, 0.06, 0.06]} />
              <meshStandardMaterial color="black" />
            </mesh>

            {/* Link 3 */}
            <group
              rotation={[jointPositions.joint3, 0, 0]}
              position={[0.4, 0, 0]}
            >
              <mesh position={[0.15, 0, 0]}>
                <boxGeometry args={[0.3, 0.05, 0.05]} />
                <meshStandardMaterial color="black" />
              </mesh>

              {/* Link 4 */}
              <group
                rotation={[0, 0, jointPositions.joint4]}
                position={[0.3, 0, 0]}
              >
                <mesh position={[0, 0, 0.05]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.1]} />
                  <meshStandardMaterial color="black" />
                </mesh>

                {/* Link 5 */}
                <group
                  rotation={[jointPositions.joint5, 0, 0]}
                  position={[0, 0, 0.15]}
                >
                  <mesh position={[0.05, 0, 0]}>
                    <boxGeometry args={[0.1, 0.04, 0.04]} />
                    <meshStandardMaterial color="black" />
                  </mesh>

                  {/* Link 6 (End Effector) */}
                  <group
                    rotation={[0, 0, jointPositions.joint6]}
                    position={[0.1, 0, 0]}
                  >
                    <mesh position={[0.05, 0, 0]}>
                      <boxGeometry args={[0.1, 0.03, 0.03]} />
                      <meshStandardMaterial color="black" />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    );
  };

  return renderXArm6Model();
};

const CoordinateAxes = () => {
  return (
    <group>
      {/* X軸 - 赤 */}
      <mesh position={[0, 0, 0]}>
        <arrowHelper
          args={[
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            0.5,
            0xff0000,
          ]}
        />
      </mesh>
      {/* Y軸 - 緑 */}
      <mesh position={[0, 0, 0]}>
        <arrowHelper
          args={[
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            0.5,
            0x00ff00,
          ]}
        />
      </mesh>
      {/* Z軸 - 青 */}
      <mesh position={[0, 0, 0]}>
        <arrowHelper
          args={[
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 0),
            0.5,
            0x0000ff,
          ]}
        />
      </mesh>
    </group>
  );
};

const Scene3D = ({ ros }) => {
  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[2, 2, 2]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Grid args={[20, 20]} />

        {/* 座標軸 */}
        <CoordinateAxes />

        {/* ロボットモデル */}
        {ros && <RobotModel ros={ros} />}
      </Canvas>
    </div>
  );
};

export default Scene3D;
