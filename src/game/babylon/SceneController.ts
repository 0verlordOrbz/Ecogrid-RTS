/**
 * Babylon.js Scene Controller for EcoGrid
 * High-performance 3D WebGL renderer with responsive multi-touch / mouse controls,
 * dynamic atmospheric lighting, Red Alert style ghost blueprinting, and camera presets.
 */

import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  Color3,
  Color4,
  Mesh,
  AbstractMesh,
  PointerEventTypes,
  TransformNode,
} from '@babylonjs/core';
import { MeshFactory, TileMeshBundle } from './MeshFactory';
import { GridTile, WeatherState, BuildingType } from '../types';

export class SceneController {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private resizeObserver?: ResizeObserver;

  // Grid Root Node for orientation and transforms
  public gridRootNode: TransformNode;

  private sunLight: DirectionalLight;
  private ambientLight: HemisphericLight;
  private meshFactory: MeshFactory;

  private tileMeshes: Map<string, TileMeshBundle> = new Map();
  private selectionRing: Mesh;
  private hoverRing: Mesh;
  private placementFootprint: Mesh;
  private ghostMesh: Mesh | null = null;
  private activeBuildType: BuildingType | null = null;
  private validityChecker?: (x: number, z: number, bldg: BuildingType) => { valid: boolean; reason?: string };

  private selectedCoords: { x: number; z: number } | null = null;
  private highlightedCoords: { x: number; z: number } | null = null;
  private windTurbineRotators: Mesh[] = [];
  private currentWindSpeed: number = 8.5;
  private hasInitializedCameraTarget: boolean = false;

  private onTileSelectedCallback?: (tileX: number, tileZ: number) => void;
  private onDeployBuildingCallback?: (tileX: number, tileZ: number) => void;
  private onCancelPlacementCallback?: () => void;
  private pointerDownStart: { x: number; y: number; time: number } | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    onTileSelected?: (tileX: number, tileZ: number) => void,
    onDeployBuilding?: (tileX: number, tileZ: number) => void,
    onCancelPlacement?: () => void
  ) {
    this.canvas = canvas;
    this.onTileSelectedCallback = onTileSelected;
    this.onDeployBuildingCallback = onDeployBuilding;
    this.onCancelPlacementCallback = onCancelPlacement;

    // 1. Initialize Babylon Engine
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    // 2. Initialize Scene
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.08, 0.12, 0.18, 1.0);

    // 3. Keep atmospheric fog disabled so grid tile colors remain stable and consistent
    this.scene.fogMode = Scene.FOGMODE_NONE;

    // 4. ArcRotateCamera with responsive boundaries and multi-touch support
    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 640;
    const initialRadius = isNarrow ? 36 : 28;

    this.camera = new ArcRotateCamera(
      'main_camera',
      -Math.PI / 3,
      Math.PI / 3.2,
      initialRadius,
      new Vector3(7.5, 0, 7.5),
      this.scene
    );
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 8;
    this.camera.upperRadiusLimit = 55;
    this.camera.lowerBetaLimit = 0.15;
    this.camera.upperBetaLimit = Math.PI / 2.15;
    this.camera.wheelPrecision = 20;
    this.camera.pinchPrecision = 40; // Smooth mobile pinch zoom

    // 5. Lights
    this.ambientLight = new HemisphericLight('ambient_light', new Vector3(0, 1, 0), this.scene);
    this.ambientLight.intensity = 0.55;
    this.ambientLight.groundColor = new Color3(0.12, 0.15, 0.18);

    this.sunLight = new DirectionalLight('sun_light', new Vector3(-1, -2, -1), this.scene);
    this.sunLight.intensity = 1.1;
    this.sunLight.diffuse = new Color3(1.0, 0.96, 0.88);

    // 6. Grid Root Node & Selection Markers
    this.gridRootNode = new TransformNode('grid_root_node', this.scene);
    this.meshFactory = new MeshFactory(this.scene);

    this.selectionRing = this.meshFactory.createSelectionRing();
    this.selectionRing.name = 'selection_ring';
    this.selectionRing.parent = this.gridRootNode;

    this.hoverRing = this.meshFactory.createSelectionRing();
    this.hoverRing.name = 'hover_ring';
    this.hoverRing.parent = this.gridRootNode;
    if (this.hoverRing.material) {
      (this.hoverRing.material as any).diffuseColor = new Color3(0.8, 0.9, 0.3);
      (this.hoverRing.material as any).emissiveColor = new Color3(0.4, 0.5, 0.1);
    }

    // Footprint
    this.placementFootprint = this.meshFactory.createPlacementFootprint();
    this.placementFootprint.parent = this.gridRootNode;

    // 7. Setup Pointer Interaction
    this.setupPointerEvents();

    // 8. Render Loop
    this.engine.runRenderLoop(() => {
      this.updateAnimations();
      this.scene.render();
    });

    // 9. Automatic Resizing via ResizeObserver and window events
    this.setupAutoResize();
  }

  private setupAutoResize() {
    window.addEventListener('resize', this.handleResize);

    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  public handleResize = () => {
    if (!this.engine) return;
    this.engine.resize();

    // Adjust camera radius dynamically if aspect ratio is narrow or portrait
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isPortrait = h > w;
      if (w < 640 || isPortrait) {
        if (this.camera.radius < 32) {
          this.camera.radius = 36;
        }
      }
    }
  };

  /**
   * Adjusts camera settings based on active device type
   */
  public adjustForDevice(deviceType: 'mobile' | 'tablet' | 'desktop' | 'large') {
    if (deviceType === 'mobile') {
      this.camera.radius = Math.max(this.camera.radius, 34);
      this.camera.lowerRadiusLimit = 10;
      this.camera.upperRadiusLimit = 58;
      this.camera.wheelPrecision = 15;
      this.camera.pinchPrecision = 35;
    } else if (deviceType === 'tablet') {
      this.camera.lowerRadiusLimit = 8;
      this.camera.upperRadiusLimit = 48;
      this.camera.wheelPrecision = 20;
    } else {
      this.camera.lowerRadiusLimit = 8;
      this.camera.upperRadiusLimit = 44;
      this.camera.wheelPrecision = 24;
    }
    this.engine.resize();
  }

  public rotateGrid(deltaRad: number) {
    this.gridRootNode.rotation.y += deltaRad;
  }

  public zoom(delta: number) {
    const nextRadius = this.camera.radius + delta;
    this.camera.radius = Math.max(this.camera.lowerRadiusLimit || 8, Math.min(this.camera.upperRadiusLimit || 50, nextRadius));
  }

  public setCameraPreset(preset: 'isometric' | 'birds_eye' | 'ground' | 'center') {
    if (preset === 'birds_eye') {
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = 0.12; // Top-Down view
      this.camera.radius = 34;
    } else if (preset === 'isometric') {
      this.camera.alpha = -Math.PI / 4;
      this.camera.beta = Math.PI / 3.2; // 45 degree angle
      this.camera.radius = 28;
    } else if (preset === 'ground') {
      this.camera.alpha = -Math.PI / 4;
      this.camera.beta = Math.PI / 2.2; // Low angle street perspective
      this.camera.radius = 16;
    } else {
      this.resetCameraView();
    }
  }

  public setPlacementMode(
    buildingType: BuildingType | null,
    validator?: (x: number, z: number, bldg: BuildingType) => { valid: boolean; reason?: string }
  ) {
    this.activeBuildType = buildingType;
    this.validityChecker = validator;

    // Dispose old ghost
    if (this.ghostMesh) {
      this.ghostMesh.dispose(false, true);
      this.ghostMesh = null;
    }

    if (!buildingType || buildingType === 'empty') {
      this.placementFootprint.isVisible = false;
      return;
    }

    // Create new ghost structure parented to gridRootNode
    this.ghostMesh = this.meshFactory.createGhostBuilding(buildingType, true);
    this.ghostMesh.parent = this.gridRootNode;
    this.ghostMesh.isVisible = false;
    this.placementFootprint.isVisible = false;
  }

  public updateCallbacks(
    onTileSelected?: (tileX: number, tileZ: number) => void,
    onDeployBuilding?: (tileX: number, tileZ: number) => void,
    onCancelPlacement?: () => void
  ) {
    this.onTileSelectedCallback = onTileSelected;
    this.onDeployBuildingCallback = onDeployBuilding;
    this.onCancelPlacementCallback = onCancelPlacement;
  }

  /**
   * Tags a building root and all child sub-meshes recursively with tile coordinates
   */
  public tagHierarchyWithTile(rootNode: any, tileX: number, tileZ: number, buildingType: string) {
    const tagNode = (node: any) => {
      if (!node) return;
      node.metadata = { ...(node.metadata || {}), tileX, tileZ, buildingType, isBuilding: true };
      if (node.name && !node.name.includes(`${tileX}_${tileZ}`)) {
        node.name = `bldg_${tileX}_${tileZ}_${node.name}`;
      }
      if (node instanceof AbstractMesh) {
        node.isPickable = true;
      }
      const children = node.getChildren ? node.getChildren() : [];
      children.forEach(tagNode);
    };
    tagNode(rootNode);
  }

  private setupPointerEvents() {
    this.scene.onPointerObservable.add((pointerInfo) => {
      // Right Click (Button 2) -> Cancel Placement Mode
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {
        if (this.activeBuildType) {
          if (this.onCancelPlacementCallback) {
            this.onCancelPlacementCallback();
          }
        } else {
          this.clearSelection();
        }
        return;
      }

      // Predicate: Exclude ghosts and helper rings from tile picking
      const pickPredicate = (mesh: AbstractMesh) => {
        if (!mesh.isPickable) return false;
        if (mesh.name.startsWith('ghost_')) return false;
        if (mesh.name === 'placement_footprint' || mesh.name === 'selection_ring' || mesh.name === 'hover_ring') {
          return false;
        }
        return true;
      };

      // Record down point to differentiate tap vs camera drag/pan on touch and mouse
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        const isLeftOrTouch = pointerInfo.event.button === 0 || pointerInfo.event.button === undefined;
        if (isLeftOrTouch) {
          this.pointerDownStart = {
            x: this.scene.pointerX,
            y: this.scene.pointerY,
            time: Date.now(),
          };
        }
      } else if (pointerInfo.type === PointerEventTypes.POINTERUP || pointerInfo.type === PointerEventTypes.POINTERTAP) {
        const isLeftOrTouch = pointerInfo.event.button === 0 || pointerInfo.event.button === undefined;
        if (isLeftOrTouch && this.pointerDownStart) {
          const dx = this.scene.pointerX - this.pointerDownStart.x;
          const dy = this.scene.pointerY - this.pointerDownStart.y;
          const dist = Math.hypot(dx, dy);
          const duration = Date.now() - this.pointerDownStart.time;
          this.pointerDownStart = null;

          // Only treat as selection if not dragged (dist < 14px and duration < 600ms)
          if (dist < 14 && duration < 600) {
            let pickResult = pointerInfo.pickInfo;
            if (!pickResult || !pickResult.hit || !pickResult.pickedMesh || !pickPredicate(pickResult.pickedMesh)) {
              pickResult = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                pickPredicate
              );
            }

            if (pickResult && pickResult.hit && pickResult.pickedMesh) {
              const mesh = pickResult.pickedMesh;
              const tileData = this.findTileDataFromMesh(mesh, pickResult.pickedPoint);
              if (tileData) {
                if (this.activeBuildType) {
                  if (this.onDeployBuildingCallback) {
                    this.onDeployBuildingCallback(tileData.x, tileData.z);
                  }
                } else {
                  this.setSelectedTile(tileData.x, tileData.z);
                  if (this.onTileSelectedCallback) {
                    this.onTileSelectedCallback(tileData.x, tileData.z);
                  }
                }
              }
            }
          }
        }
      } else if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        let pickResult = pointerInfo.pickInfo;
        if (!pickResult || !pickResult.hit || !pickResult.pickedMesh || !pickPredicate(pickResult.pickedMesh)) {
          pickResult = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            pickPredicate
          );
        }

        if (pickResult && pickResult.hit && pickResult.pickedMesh) {
          const tileData = this.findTileDataFromMesh(pickResult.pickedMesh, pickResult.pickedPoint);
          if (tileData) {
            this.canvas.style.cursor = this.activeBuildType ? 'crosshair' : 'pointer';

            const spacing = 2.15;
            const key = `${tileData.x}_${tileData.z}`;
            const bundle = this.tileMeshes.get(key);
            const surfaceY = bundle ? bundle.surfaceY : 0.35;

            if (this.activeBuildType && this.ghostMesh) {
              this.hoverRing.isVisible = false;

              this.placementFootprint.position = new Vector3(tileData.x * spacing, surfaceY + 0.04, tileData.z * spacing);
              this.placementFootprint.isVisible = true;

              this.ghostMesh.position = new Vector3(tileData.x * spacing, surfaceY, tileData.z * spacing);
              this.ghostMesh.isVisible = true;

              let isValid = true;
              if (this.validityChecker) {
                const res = this.validityChecker(tileData.x, tileData.z, this.activeBuildType);
                isValid = res.valid;
              }

              const matName = isValid ? 'mat_ghost_valid' : 'mat_ghost_invalid';
              const ghostMat = (this.meshFactory as any).materials?.get(matName);
              if (ghostMat) {
                this.ghostMesh.getChildMeshes(false).forEach((m) => {
                  m.material = ghostMat;
                });
              }

              const footMat = (this.placementFootprint.material as any);
              if (footMat) {
                if (isValid) {
                  footMat.diffuseColor = new Color3(0.1, 0.9, 0.4);
                  footMat.emissiveColor = new Color3(0.05, 0.5, 0.2);
                } else {
                  footMat.diffuseColor = new Color3(0.9, 0.15, 0.15);
                  footMat.emissiveColor = new Color3(0.5, 0.05, 0.05);
                }
              }
            } else {
              this.setHoverTile(tileData.x, tileData.z);
            }
          } else {
            this.clearHover();
            this.canvas.style.cursor = 'default';
          }
        } else {
          this.clearHover();
          this.canvas.style.cursor = 'default';
        }
      }
    });
  }

  private findTileDataFromMesh(
    mesh: AbstractMesh,
    pickedPoint?: Vector3 | null
  ): { x: number; z: number } | null {
    if (mesh.metadata && mesh.metadata.tileX !== undefined && mesh.metadata.tileZ !== undefined) {
      return { x: mesh.metadata.tileX, z: mesh.metadata.tileZ };
    }

    if (mesh.parent && mesh.parent.metadata && (mesh.parent.metadata as any).tileX !== undefined) {
      return { x: (mesh.parent.metadata as any).tileX, z: (mesh.parent.metadata as any).tileZ };
    }

    for (const [key, bundle] of this.tileMeshes.entries()) {
      if (bundle.rootMesh === mesh) {
        const [kx, kz] = key.split('_').map((n) => parseInt(n, 10));
        return { x: kx, z: kz };
      }
      if (bundle.buildingRoot) {
        const children = bundle.buildingRoot.getChildMeshes(false);
        if (children.includes(mesh as Mesh)) {
          const [kx, kz] = key.split('_').map((n) => parseInt(n, 10));
          return { x: kx, z: kz };
        }
      }
    }

    if (pickedPoint) {
      const spacing = 2.15;
      const gx = Math.round(pickedPoint.x / spacing);
      const gz = Math.round(pickedPoint.z / spacing);
      const key = `${gx}_${gz}`;
      if (this.tileMeshes.has(key)) {
        return { x: gx, z: gz };
      }
    }

    return null;
  }

  public setSelectedTile(x: number, z: number) {
    this.selectedCoords = { x, z };
    const spacing = 2.15;
    const key = `${x}_${z}`;
    const bundle = this.tileMeshes.get(key);
    const surfaceY = bundle ? bundle.surfaceY : 0.35;
    this.selectionRing.position = new Vector3(x * spacing, surfaceY + 0.06, z * spacing);
    this.selectionRing.isVisible = true;
  }

  public clearSelection() {
    this.selectedCoords = null;
    this.selectionRing.isVisible = false;
  }

  public setHoverTile(x: number, z: number) {
    this.highlightedCoords = { x, z };

    if (this.selectedCoords && this.selectedCoords.x === x && this.selectedCoords.z === z) {
      this.hoverRing.isVisible = false;
      return;
    }
    const spacing = 2.15;
    const key = `${x}_${z}`;
    const bundle = this.tileMeshes.get(key);
    const surfaceY = bundle ? bundle.surfaceY : 0.35;
    this.hoverRing.position = new Vector3(x * spacing, surfaceY + 0.05, z * spacing);
    this.hoverRing.isVisible = true;
  }

  public clearHover() {
    this.highlightedCoords = null;
    this.hoverRing.isVisible = false;
  }

  public syncGrid(tiles: GridTile[]) {
    const activeKeys = new Set<string>();
    this.windTurbineRotators = [];

    tiles.forEach((tile) => {
      const key = `${tile.x}_${tile.z}`;
      activeKeys.add(key);

      const existing = this.tileMeshes.get(key);
      const spacing = 2.15;

      if (existing && existing.terrain !== tile.terrain) {
        if (existing.buildingRoot) existing.buildingRoot.dispose(false, true);
        existing.rootMesh.dispose();
        this.tileMeshes.delete(key);
      }

      const current = this.tileMeshes.get(key);

      if (!current) {
        const baseMesh = this.meshFactory.createTileBase(tile.x, tile.z, tile.terrain);
        baseMesh.parent = this.gridRootNode;
        const surfaceY = (baseMesh.metadata as any)?.surfaceY || 0.35;
        let buildingRoot: Mesh | undefined;
        let rotators: Mesh[] = [];

        if (tile.building !== 'empty') {
          const surfacePos = new Vector3(tile.x * spacing, surfaceY, tile.z * spacing);
          const bldg = this.meshFactory.createBuilding(tile.building, surfacePos, tile.level);
          bldg.root.parent = this.gridRootNode;
          bldg.root.metadata = { ...(bldg.root.metadata || {}), level: tile.level };
          this.tagHierarchyWithTile(bldg.root, tile.x, tile.z, tile.building);
          buildingRoot = bldg.root;
          if (bldg.rotators) {
            rotators = bldg.rotators;
            this.windTurbineRotators.push(...bldg.rotators);
          }
        }

        this.tileMeshes.set(key, {
          rootMesh: baseMesh,
          terrain: tile.terrain,
          surfaceY,
          buildingRoot,
          rotatorMeshes: rotators,
          tileData: tile,
        });
      } else {
        current.tileData = tile;
        current.surfaceY = (current.rootMesh.metadata as any)?.surfaceY || 0.35;

        const currentBldgName = current.buildingRoot ? current.buildingRoot.name : '';
        const currentLevel = (current.buildingRoot?.metadata as any)?.level || 1;
        const expectedBuilding = tile.building;

        if (tile.building === 'empty') {
          if (current.buildingRoot) {
            current.buildingRoot.dispose(false, true);
            current.buildingRoot = undefined;
            current.rotatorMeshes = [];
          }
        } else if (!currentBldgName.includes(expectedBuilding) || currentLevel !== tile.level) {
          if (current.buildingRoot) {
            current.buildingRoot.dispose(false, true);
            current.buildingRoot = undefined;
            current.rotatorMeshes = [];
          }

          const surfacePos = new Vector3(tile.x * spacing, current.surfaceY, tile.z * spacing);
          const bldg = this.meshFactory.createBuilding(tile.building, surfacePos, tile.level);
          bldg.root.parent = this.gridRootNode;
          bldg.root.metadata = { ...(bldg.root.metadata || {}), level: tile.level };
          this.tagHierarchyWithTile(bldg.root, tile.x, tile.z, tile.building);
          current.buildingRoot = bldg.root;
          if (bldg.rotators) {
            current.rotatorMeshes = bldg.rotators;
            this.windTurbineRotators.push(...bldg.rotators);
          }
        } else if (current.rotatorMeshes) {
          this.windTurbineRotators.push(...current.rotatorMeshes);
        }
      }
    });

    this.tileMeshes.forEach((bundle, key) => {
      if (!activeKeys.has(key)) {
        if (bundle.buildingRoot) bundle.buildingRoot.dispose(false, true);
        bundle.rootMesh.dispose();
        this.tileMeshes.delete(key);
      }
    });

    if (!this.hasInitializedCameraTarget && tiles.length > 0) {
      this.hasInitializedCameraTarget = true;
      const maxX = Math.max(...tiles.map((t) => t.x));
      const maxZ = Math.max(...tiles.map((t) => t.z));
      const spacing = 2.15;
      this.camera.setTarget(new Vector3((maxX * spacing) / 2, 0.4, (maxZ * spacing) / 2));
    }
  }

  public updateAtmosphere(weather: WeatherState, _cleanPct?: number) {
    this.currentWindSpeed = weather.windSpeedMs;

    const hour = weather.timeOfDay;
    const isDay = hour >= 5.5 && hour <= 18.5;

    if (isDay) {
      const dayProgress = (hour - 6) / 12;
      const sunAngle = dayProgress * Math.PI;
      const sunX = -Math.cos(sunAngle) * 2;
      const sunY = -Math.sin(sunAngle) * 2.5;
      const sunZ = -0.8;
      this.sunLight.direction = new Vector3(sunX, sunY, sunZ);

      if (hour < 7.5 || hour > 16.5) {
        this.sunLight.diffuse = new Color3(1.0, 0.88, 0.72);
        this.sunLight.intensity = 0.95;
      } else {
        this.sunLight.diffuse = new Color3(1.0, 0.98, 0.92);
        this.sunLight.intensity = 1.15;
      }
      this.ambientLight.intensity = 0.55;
      // Stable daytime sky backdrop: never alters tile colors on grid updates
      this.scene.clearColor = new Color4(0.07, 0.11, 0.16, 1.0);
    } else {
      this.sunLight.direction = new Vector3(0.5, -2, 0.5);
      this.sunLight.diffuse = new Color3(0.4, 0.5, 0.7);
      this.sunLight.intensity = 0.4;
      this.ambientLight.intensity = 0.35;
      // Stable nighttime sky backdrop
      this.scene.clearColor = new Color4(0.03, 0.05, 0.08, 1.0);
    }

    // Weather-specific lighting adjustments (without altering base tile colors)
    if (weather.activeAlert?.type === 'typhoon') {
      this.sunLight.intensity = Math.min(this.sunLight.intensity, 0.5);
    } else if (weather.activeAlert?.type === 'wildfire_haze') {
      this.sunLight.intensity = Math.min(this.sunLight.intensity, 0.7);
    }
  }

  private updateAnimations() {
    const rotationStep = (this.currentWindSpeed / 10) * 0.08;
    this.windTurbineRotators.forEach((rotator) => {
      rotator.rotation.z += rotationStep;
    });

    if (this.selectionRing.isVisible) {
      const t = Date.now() * 0.003;
      const s = 1.0 + Math.sin(t) * 0.04;
      this.selectionRing.scaling = new Vector3(s, s, s);
    }
  }

  public resetCameraView() {
    this.camera.alpha = -Math.PI / 3;
    this.camera.beta = Math.PI / 3.2;
    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 640;
    this.camera.radius = isNarrow ? 36 : 28;
  }

  public dispose() {
    window.removeEventListener('resize', this.handleResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.scene.dispose();
    this.engine.dispose();
  }
}
