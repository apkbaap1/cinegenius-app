// KALIYA-5 — the studio: a pale cool backdrop, a floor grid that scrolls with the distance travelled, a water
// surface that rises in for swimming, one key light with soft shadows and a room environment for the metal.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const BG = '#e3e9e8';

const FLOOR_VERT = /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FLOOR_FRAG = /* glsl */ `uniform vec3 uBg; uniform vec3 uFloor; uniform vec3 uLine; uniform float uScroll; uniform vec3 uC; uniform float uSea;
  varying vec3 vW;
  float grid(vec2 p, float s, float w){ vec2 g = abs(fract(p / s - 0.5) - 0.5) * s; vec2 fw = fwidth(p) * 1.2; vec2 l = 1.0 - smoothstep(vec2(w) - fw, vec2(w) + fw, g); return max(l.x, l.y); }
  void main(){
    vec2 p = vW.xz + vec2(uScroll, 0.0);
    float g1 = grid(p, 1.0, 0.006);
    float g5 = grid(p, 5.0, 0.014);
    vec3 col = mix(uFloor, uLine, g1 * 0.35 + g5 * 0.55);
    // sea bed: darker, cooler under the water
    col = mix(col, vec3(0.62, 0.74, 0.76) * (0.9 + 0.1 * g1), uSea * 0.75);
    float d = length(vW.xz - uC.xz);
    float fade = smoothstep(9.0, 26.0, d);
    gl_FragColor = vec4(mix(col, uBg, fade), 1.0);
  }`;
const WATER_VERT = /* glsl */ `uniform float uT; uniform float uScroll; varying vec3 vW; varying vec3 vN;
  void main(){
    vec3 p = position; vec4 w = modelMatrix * vec4(p,1.0);
    vec2 q = w.xz + vec2(uScroll, 0.0);
    float h = 0.025 * sin(q.x * 1.7 + uT * 1.6) + 0.018 * sin(q.y * 2.3 - uT * 1.2) + 0.01 * sin((q.x + q.y) * 4.1 + uT * 2.4);
    w.y += h;
    float dx = 0.025 * 1.7 * cos(q.x * 1.7 + uT * 1.6) + 0.01 * 4.1 * cos((q.x + q.y) * 4.1 + uT * 2.4);
    float dz = 0.018 * 2.3 * cos(q.y * 2.3 - uT * 1.2) + 0.01 * 4.1 * cos((q.x + q.y) * 4.1 + uT * 2.4);
    vN = normalize(vec3(-dx, 1.0, -dz));
    vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WATER_FRAG = /* glsl */ `uniform float uA; uniform vec3 uCam; uniform vec3 uBg; uniform vec3 uC; varying vec3 vW; varying vec3 vN;
  void main(){
    vec3 v = normalize(uCam - vW);
    float fr = pow(clamp(1.0 - max(dot(v, vN), 0.0), 0.0, 1.0), 3.0);
    vec3 deep = vec3(0.16, 0.42, 0.48);
    vec3 sky = vec3(0.86, 0.93, 0.94);
    vec3 col = mix(deep, sky, 0.25 + 0.65 * fr);
    vec3 L = normalize(vec3(0.5, 0.8, 0.3));
    float sp = pow(max(dot(reflect(-L, vN), v), 0.0), 60.0);
    col += sp * 0.5;
    float d = length(vW.xz - uC.xz);
    float fade = smoothstep(8.0, 22.0, d);
    gl_FragColor = vec4(mix(col, uBg, fade), uA * (0.55 + 0.3 * fr) * (1.0 - fade * 0.9));
  }`;

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(BG, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 200);

  scene.add(new THREE.HemisphereLight('#f4fbfb', '#9fb1ad', 0.9));
  const key = new THREE.DirectionalLight('#fff6ea', 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const sc = key.shadow.camera;
  Object.assign(sc, {left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 40});
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#cfe9ff', 0.9);
  rim.position.set(-6, 5, -7);
  scene.add(rim);

  const floorU = {
    uBg: {value: new THREE.Color(BG)},
    uFloor: {value: new THREE.Color('#dfe5e3')},
    uLine: {value: new THREE.Color('#9fb0ad')},
    uScroll: {value: 0},
    uC: {value: new THREE.Vector3()},
    uSea: {value: 0},
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShaderMaterial({uniforms: floorU, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG}));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  // shadows land on a transparent catcher over the shader floor
  const catcher = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({color: '#25403c', opacity: 0.28, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1}),
  );
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = 0.001;
  catcher.receiveShadow = true;
  scene.add(catcher);

  const waterU = {
    uT: {value: 0},
    uScroll: {value: 0},
    uA: {value: 0},
    uCam: {value: new THREE.Vector3()},
    uBg: {value: new THREE.Color(BG)},
    uC: {value: new THREE.Vector3()},
  };
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60, 160, 160),
    new THREE.ShaderMaterial({uniforms: waterU, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide}),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.2;
  water.renderOrder = 5;
  scene.add(water);

  const size = {w: 1600, h: 900};
  const resize = (w, h, pr) => {
    size.w = w;
    size.h = h;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const tgt = new THREE.Vector3();
  /** cam: {tx, ty, tz, az, el, d} in metres and radians; env: {scroll, swim, t} */
  const frame = (cam, env) => {
    tgt.set(cam.tx, cam.ty, cam.tz);
    camera.position.set(tgt.x + cam.d * Math.cos(cam.el) * Math.cos(cam.az), tgt.y + cam.d * Math.sin(cam.el), tgt.z + cam.d * Math.cos(cam.el) * Math.sin(cam.az));
    camera.lookAt(tgt);
    key.position.set(tgt.x + 5, 11, tgt.z + 6);
    key.target.position.copy(tgt);
    floorU.uScroll.value = env.scroll;
    floorU.uC.value.copy(tgt);
    floorU.uSea.value = env.swim;
    waterU.uScroll.value = env.scroll;
    waterU.uT.value = env.t;
    waterU.uA.value = env.swim;
    waterU.uCam.value.copy(camera.position);
    waterU.uC.value.copy(tgt);
    water.visible = env.swim > 0.01;
    catcher.material.opacity = 0.28 * (1 - 0.6 * env.swim);
    renderer.render(scene, camera);
  };

  const v = new THREE.Vector3();
  const project = (p) => {
    v.copy(p).project(camera);
    return {x: (v.x * 0.5 + 0.5) * size.w, y: (-v.y * 0.5 + 0.5) * size.h, visible: v.z < 1 && v.z > -1};
  };
  const setQuality = ({shadow}) => {
    if (key.shadow.mapSize.x !== shadow) {
      key.shadow.mapSize.set(shadow, shadow);
      key.shadow.map?.dispose();
      key.shadow.map = null;
    }
  };

  return {renderer, scene, camera, resize, frame, project, setQuality, size};
}
