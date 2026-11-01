import * as THREE from "./lib/three.module.js";
const approach=(a,b,r)=>a+(b-a)*r;
export function createChaseCamera(aspect=16/9) {
  const camera=new THREE.PerspectiveCamera(68,aspect,.1,360);
  camera.position.set(0,7,-12);
  const target=new THREE.Vector3();
  return {
    camera,
    reset(boat) { camera.position.set(boat.x-Math.sin(boat.heading)*10,boat.y+5.6,boat.z-Math.cos(boat.heading)*10); },
    update(boat,dt) {
      const s=Math.min(1,boat.speed/48);
      const behind=9.3+s*2.5;
      const ease=1-Math.exp(-Math.min(dt,.05)*4.2);
      const desired=new THREE.Vector3(
        boat.x-Math.sin(boat.heading)*behind,
        boat.y+4.5+s*1.1+Math.min(boat.yOffset*.2,2),
        boat.z-Math.cos(boat.heading)*behind);
      camera.position.lerp(desired,ease);
      target.set(boat.x+Math.sin(boat.heading)*(8+s*5),boat.y+1.5,boat.z+Math.cos(boat.heading)*(8+s*5));
      camera.lookAt(target);
      camera.rotation.z=approach(camera.rotation.z,-boat.steer*.027,ease);
      camera.fov=approach(camera.fov,67+s*9+(boat.boostTime>0?8:0),ease);
      camera.updateProjectionMatrix();
    },
    resize(width,height){camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();}
  };
}