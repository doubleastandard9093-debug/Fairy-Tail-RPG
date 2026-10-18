# Fairy Tail RPG — Babylon Starter Prototype

This branch contains a minimal Vite + TypeScript + Babylon.js starter project for the Fairy Tail RPG prototype.

Quick start

1. Install dependencies

```bash
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Open http://localhost:5173

Notes

- Put a glTF/glb character at `public/assets/character.glb` to test model loading. If absent, a colored box placeholder is used.
- This prototype is intentionally minimal (camera, ground, placeholder/player, WASD movement). Use it as a starting point for third-person controller, animations, and world streaming.

Next steps

- Add a proper third-person character controller and animation blending.
- Integrate a physics engine (cannon-es / rapier) for collision and character movement.
- Add asset pipeline (glTF export from Blender, texture compression).
- Implement chunked world streaming and navmesh-based AI.
