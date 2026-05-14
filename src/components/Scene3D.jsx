import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera } from "@react-three/drei";
import ROSLIB from "roslib";
import * as THREE from "three";

const RobotModel = ({ ros }) => {
  const [jointStates, setJointStates] = useState({});

  useEffect(() => {
    if (!ros) return;

    // 関節状態を取得
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
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Base */}
        <mesh position={[0, 0, 0.1335]}>
          <cylinderGeometry args={[0.1, 0.1, 0.2]} />
          <meshStandardMaterial color="black" />
        </mesh>

        {/* Link 1 */}
        <group position={[0, 0, 0.267]} rotation={[0, 0, jointPositions.joint1]}>
          <mesh position={[0, 0, 0.08]}>
            <cylinderGeometry args={[0.08, 0.08, 0.15]} />
            <meshStandardMaterial color="black" />
          </mesh>

          {/* Link 2 */}
          <group
            position={[0, 0, 0]}
            rotation={[-1.5708, 0, jointPositions.joint2]}
          >
            <mesh position={[0.02675, -0.14225, 0]}>
              <boxGeometry args={[0.0535, 0.2845, 0.08]} />
              <meshStandardMaterial color="black" />
            </mesh>

            {/* Link 3 */}
            <group
              position={[0.0535, -0.2845, 0]}
              rotation={[0, 0, jointPositions.joint3]}
            >
              <mesh position={[0.03875, 0.17125, 0]}>
                <boxGeometry args={[0.0775, 0.3425, 0.07]} />
                <meshStandardMaterial color="black" />
              </mesh>

              {/* Link 4 */}
              <group
                position={[0.0775, 0.3425, 0]}
                rotation={[-1.5708, 0, jointPositions.joint4]}
              >
                <mesh position={[0, 0, 0.03]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.06]} />
                  <meshStandardMaterial color="black" />
                </mesh>

                {/* Link 5 */}
                <group
                  position={[0, 0, 0]}
                  rotation={[1.5708, 0, jointPositions.joint5]}
                >
                  <mesh position={[0.038, 0.0485, 0]}>
                    <boxGeometry args={[0.076, 0.097, 0.06]} />
                  <meshStandardMaterial color="black" />
                </mesh>

                  {/* Link 6 (End Effector) */}
                  <group
                    position={[0.076, 0.097, 0]}
                    rotation={[-1.5708, 0, jointPositions.joint6]}
                  >
                    <mesh position={[0, 0, 0.04]}>
                      <boxGeometry args={[0.05, 0.05, 0.08]} />
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
