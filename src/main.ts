import "./style.css";
import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  ArcRotateCamera,
  MeshBuilder,
  Color3,
  Color4,
  StandardMaterial,
  Mesh,
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);

const scene = new Scene(engine);
scene.clearColor = new Color4(0.08, 0.1, 0.14, 1);

const camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 2,
  Math.PI / 3.2,
  10,
  new Vector3(0, 1.5, 0),
  scene
);
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 4;
camera.upperRadiusLimit = 20;
camera.wheelPrecision = 20;

new HemisphericLight("light", new Vector3(0, 1, 0), scene);

const ground = MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
const groundMat = new StandardMaterial("groundMat", scene);
groundMat.diffuseColor = new Color3(0.15, 0.35, 0.18);
ground.material = groundMat;

const player = MeshBuilder.CreateBox("player", { size: 1 }, scene);
player.position = new Vector3(0, 0.5, 0);

const playerMat = new StandardMaterial("playerMat", scene);
playerMat.diffuseColor = new Color3(0.8, 0.2, 0.2);
player.material = playerMat;

let avatar: Mesh | null = null;

async function tryLoadCharacter() {
  try {
    // Check if asset exists (HEAD)
    const response = await fetch("/assets/character.glb", { method: "HEAD" });
    if (!response.ok) {
      throw new Error("Asset missing");
    }

    SceneLoader.Append("/assets/", "character.glb", scene, (loadedScene) => {
      // pick a non-root mesh as avatar
      const loadedMesh = loadedScene.meshes.find((m) => m.name !== "__root__");
      if (loadedMesh) {
        avatar = loadedMesh as Mesh;
        avatar.position = new Vector3(0, 0, 0);
        avatar.scaling = new Vector3(0.65, 0.65, 0.65);
      }
    });
  } catch (e) {
    // fallback placeholder
    const placeholder = MeshBuilder.CreateBox("placeholder", { size: 1 }, scene);
    placeholder.position = new Vector3(0, 0.5, 0);
    const mat = new StandardMaterial("placeholderMat", scene);
    mat.diffuseColor = new Color3(0.2, 0.6, 1);
    placeholder.material = mat;
    avatar = placeholder;
  }
}

tryLoadCharacter();

const inputMap: Record<string, boolean> = {};

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    inputMap[key] = true;
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    inputMap[key] = false;
  }
});

scene.registerBeforeRender(() => {
  const moveX =
    (inputMap["d"] || inputMap["arrowright"] ? 1 : 0) -
    (inputMap["a"] || inputMap["arrowleft"] ? 1 : 0);

  const moveZ =
    (inputMap["s"] || inputMap["arrowdown"] ? 1 : 0) -
    (inputMap["w"] || inputMap["arrowup"] ? 1 : 0);

  if (moveX !== 0 || moveZ !== 0) {
    const direction = new Vector3(moveX, 0, moveZ);
    direction.normalize();
    const speed = 0.15;
    player.position.addInPlace(direction.scale(speed));

    // Keep camera focused on the player
    camera.target = player.position.clone();
    camera.target.y = 0.6;

    if (avatar) {
      avatar.position.x = player.position.x;
      avatar.position.z = player.position.z;
      avatar.rotation.y = Math.atan2(direction.x, direction.z);
    }
  }
});

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
