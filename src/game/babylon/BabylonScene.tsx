/**
 * BabylonScene component
 * Mounts the 3D grid viewport with responsive touch/mouse controls,
 * camera view presets (Isometric, Birds-Eye, Ground), and automatic device adaptation.
 */

import React, { useEffect, useRef } from 'react';
import { SceneController } from './SceneController';
import { GridTile, WeatherState, BuildingType } from '../types';
import { DeviceType } from '../useDeviceType';
import { Focus, RotateCcw, RotateCw, ZoomIn, ZoomOut, Layers, Eye } from 'lucide-react';
import { sound } from '../audio';

interface BabylonSceneProps {
  tiles: GridTile[];
  weather: WeatherState;
  cleanPercentage: number;
  selectedTileCoords: { x: number; z: number } | null;
  onTileSelect: (x: number, z: number) => void;
  placementBuilding: BuildingType | null;
  onDeployBuilding: (x: number, z: number) => void;
  onCancelPlacement: () => void;
  validityChecker?: (x: number, z: number, bldg: BuildingType) => { valid: boolean; reason?: string };
  deviceType?: DeviceType;
  onUpgrade?: (tile: GridTile) => void;
  onDecommission?: (tile: GridTile) => void;
  onDemolish?: (tile: GridTile) => void;
  onQuickBuild?: (tile: GridTile, bldg: BuildingType) => void;
  onSelectBuildType?: (bldg: BuildingType | null) => void;
  onSetToolMode?: (mode: 'select' | 'build' | 'sell' | 'repair') => void;
  onRestartScenario?: () => void;
}

export const BabylonScene: React.FC<BabylonSceneProps> = ({
  tiles,
  weather,
  cleanPercentage,
  selectedTileCoords,
  onTileSelect,
  placementBuilding,
  onDeployBuilding,
  onCancelPlacement,
  validityChecker,
  deviceType = 'desktop',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<SceneController | null>(null);

  const onTileSelectRef = useRef(onTileSelect);
  onTileSelectRef.current = onTileSelect;

  const onDeployBuildingRef = useRef(onDeployBuilding);
  onDeployBuildingRef.current = onDeployBuilding;

  const onCancelPlacementRef = useRef(onCancelPlacement);
  onCancelPlacementRef.current = onCancelPlacement;

  const validityCheckerRef = useRef(validityChecker);
  validityCheckerRef.current = validityChecker;

  // Initialize Babylon.js Scene Controller
  useEffect(() => {
    if (!canvasRef.current) return;

    const controller = new SceneController(
      canvasRef.current,
      (x, z) => {
        onTileSelectRef.current(x, z);
      },
      (x, z) => {
        onDeployBuildingRef.current(x, z);
      },
      () => {
        onCancelPlacementRef.current();
      }
    );

    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  // Sync device type changes
  useEffect(() => {
    if (controllerRef.current && deviceType) {
      controllerRef.current.adjustForDevice(deviceType);
    }
  }, [deviceType]);

  // Update placement mode on controller
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setPlacementMode(placementBuilding, (x, z, bldg) => {
        if (validityCheckerRef.current) {
          return validityCheckerRef.current(x, z, bldg);
        }
        return { valid: true };
      });
    }
  }, [placementBuilding, validityChecker]);

  // Sync grid tiles
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.syncGrid(tiles);
    }
  }, [tiles]);

  // Sync selection ring
  useEffect(() => {
    if (controllerRef.current) {
      if (selectedTileCoords) {
        controllerRef.current.setSelectedTile(selectedTileCoords.x, selectedTileCoords.z);
      } else {
        controllerRef.current.clearSelection();
      }
    }
  }, [selectedTileCoords]);

  // Sync atmospheric effects
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.updateAtmosphere(weather, cleanPercentage);
    }
  }, [weather, cleanPercentage]);

  const handleResetCamera = () => {
    sound.playClick();
    controllerRef.current?.resetCameraView();
  };

  const handleRotateLeft = () => {
    sound.playClick();
    controllerRef.current?.rotateGrid(-Math.PI / 6);
  };

  const handleRotateRight = () => {
    sound.playClick();
    controllerRef.current?.rotateGrid(Math.PI / 6);
  };

  const handleZoomIn = () => {
    sound.playClick();
    controllerRef.current?.zoom(-4);
  };

  const handleZoomOut = () => {
    sound.playClick();
    controllerRef.current?.zoom(4);
  };

  const handleSetPreset = (preset: 'isometric' | 'birds_eye' | 'ground') => {
    sound.playClick();
    controllerRef.current?.setCameraPreset(preset);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#090d16]">
      <canvas
        ref={canvasRef}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full block outline-none cursor-crosshair active:cursor-crosshair touch-none"
      />

      {/* 3D Viewport Controls Dock (Responsive on mobile and desktop) */}
      <div className="absolute bottom-4 sm:bottom-6 left-3 sm:left-5 z-20 flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Center / Focus */}
        <button
          onClick={handleResetCamera}
          title="Center and Reset Camera View"
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md rounded-lg border border-slate-700/70 shadow-lg transition-colors cursor-pointer"
        >
          <Focus className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Center</span>
        </button>

        {/* Rotate Left / Right */}
        <div className="flex items-center bg-slate-900/90 border border-slate-700/70 rounded-lg backdrop-blur-md shadow-lg overflow-hidden">
          <button
            onClick={handleRotateLeft}
            title="Rotate Grid Counter-Clockwise (-30°)"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-r border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Rotate</span> ↺
          </button>
          <button
            onClick={handleRotateRight}
            title="Rotate Grid Clockwise (+30°)"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>↻</span>
          </button>
        </div>

        {/* Zoom In / Zoom Out */}
        <div className="flex items-center bg-slate-900/90 border border-slate-700/70 rounded-lg backdrop-blur-md shadow-lg overflow-hidden">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-r border-slate-800"
          >
            <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>

        {/* Camera Angle Presets (Isometric, Top-Down, Ground) */}
        <div className="hidden min-[480px]:flex items-center bg-slate-900/90 border border-slate-700/70 rounded-lg backdrop-blur-md shadow-lg overflow-hidden text-xs">
          <button
            onClick={() => handleSetPreset('isometric')}
            title="Isometric 45° Angle"
            className="px-2.5 py-1.5 font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-r border-slate-800"
          >
            Iso
          </button>
          <button
            onClick={() => handleSetPreset('birds_eye')}
            title="Top-Down Birds-Eye Map View"
            className="px-2.5 py-1.5 font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-r border-slate-800"
          >
            Top
          </button>
          <button
            onClick={() => handleSetPreset('ground')}
            title="Street-Level Low-Angle Perspective"
            className="px-2.5 py-1.5 font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Street
          </button>
        </div>
      </div>
    </div>
  );
};
