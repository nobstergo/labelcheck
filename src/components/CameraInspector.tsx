import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Play,
  Pause,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  ShieldAlert,
  Image as ImageIcon
} from 'lucide-react';
import { InspectionPackageStatus, ApprovedProduct } from '../types';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

interface CameraInspectorProps {
  onFrameCaptured: (base64Image: string) => Promise<void>;
  isAnalyzing: boolean;
  currentStatus: InspectionPackageStatus;
  statusMessage: string;
  onStopInspection: () => void;
  approvedProduct?: ApprovedProduct | null;
}

export const CameraInspector: React.FC<CameraInspectorProps> = ({
  onFrameCaptured,
  isAnalyzing,
  currentStatus,
  statusMessage,
  onStopInspection,
  approvedProduct
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const intervalIdRef = useRef<number | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Continuous auto-inspect mode (default false to prevent continuous loop quota exhaustion)
  const [autoInspect, setAutoInspect] = useState<boolean>(false);
  const [captureIntervalMs, setCaptureIntervalMs] = useState<number>(4500);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);
  const [showSamplePicker, setShowSamplePicker] = useState<boolean>(false);

  // Initialize camera
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setErrorMessage(null);

      // Stop existing stream if any
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);

      // Enumerate camera devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (!deviceId && videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasPermission(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Camera access permission was denied. You can still inspect test images or sample packages below.'
          : 'Camera device unavailable. You can use test packages or upload label photos to inspect.'
      );
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current);
      }
    };
  }, [startCamera]);

  // Capture frame and send to analysis pipeline with mutex protection
  const captureAndAnalyzeFrame = useCallback(
    async (force: boolean = false) => {
      if (!videoRef.current || !canvasRef.current) return;
      if (isProcessingRef.current || (isAnalyzing && !force)) return;

      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      isProcessingRef.current = true;
      setFlashEffect(true);
      setTimeout(() => setFlashEffect(false), 200);

      try {
        const canvas = canvasRef.current;
        const nativeWidth = video.videoWidth || 1280;
        const nativeHeight = video.videoHeight || 720;
        
        // Preserve exact aspect ratio when scaling to optimal inspection resolution
        const maxDimension = 1280;
        let targetWidth = nativeWidth;
        let targetHeight = nativeHeight;

        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth >= targetHeight) {
            targetHeight = Math.round((nativeHeight * maxDimension) / nativeWidth);
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round((nativeWidth * maxDimension) / nativeHeight);
            targetHeight = maxDimension;
          }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw preserving true image geometry
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

        // Convert frame to compressed JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        await onFrameCaptured(dataUrl);
      } catch (err) {
        console.error('Frame capture failed:', err);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [isAnalyzing, onFrameCaptured]
  );

  // Automated frame capture interval only when autoInspect is explicitly ON
  useEffect(() => {
    if (!autoInspect) {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    intervalIdRef.current = window.setInterval(() => {
      if (!isAnalyzing && !isProcessingRef.current) {
        captureAndAnalyzeFrame(false);
      }
    }, captureIntervalMs);

    return () => {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [autoInspect, captureIntervalMs, isAnalyzing, captureAndAnalyzeFrame]);

  // Handle manual test image upload with optimization
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      // Quick optimize to ensure phone gallery images don't exceed request limits
      const img = new Image();
      img.onload = async () => {
        let { width, height } = img;
        const maxDimension = 1600;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            await onFrameCaptured(canvas.toDataURL('image/jpeg', 0.88));
            return;
          }
        }
        await onFrameCaptured(dataUrl);
      };
      img.onerror = async () => {
        await onFrameCaptured(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle sample selection
  const handleSelectSample = async (sample: typeof SAMPLE_PRODUCTS[0]) => {
    setShowSamplePicker(false);
    await onFrameCaptured(sample.imageUrl);
  };

  // Status overlay indicator styling
  const renderStatusBadge = () => {
    if (isAnalyzing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/90 text-white backdrop-blur-xs border border-slate-700 shadow-sm animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Verifying with algorithm...</span>
        </span>
      );
    }

    switch (currentStatus) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/90 text-emerald-300 backdrop-blur-xs border border-emerald-600 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PASS (MATCHES PARENT)</span>
          </span>
        );
      case 'FOREIGN_PRODUCT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-950/90 text-purple-300 backdrop-blur-xs border border-purple-600 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>FOREIGN PRODUCT DETECTED</span>
          </span>
        );
      case 'FLAG':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/90 text-rose-300 backdrop-blur-xs border border-rose-600 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>FLAG (DISCREPANCY)</span>
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/90 text-amber-300 backdrop-blur-xs border border-amber-600 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>REVIEW NEEDED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/80 text-slate-300 backdrop-blur-xs border border-slate-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>READY TO INSPECT</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 space-y-3 shadow-2xs w-full max-w-full overflow-hidden">
      {/* Viewport Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              autoInspect ? 'bg-emerald-400' : 'bg-blue-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              autoInspect ? 'bg-emerald-500' : 'bg-blue-600'
            }`} />
          </div>
          <span className="text-xs font-bold text-slate-900">
            {autoInspect ? 'Live Video Continuous Stream' : 'Live Camera Inspector'}
          </span>
        </div>

        {/* Parent Reference Badge */}
        {approvedProduct && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs max-w-full">
            <span className="text-slate-500 text-[10px] font-mono shrink-0">Parent Benchmark:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[130px] sm:max-w-[200px]">
              {approvedProduct.name}
            </span>
          </div>
        )}
      </div>

      {/* Main Viewport Container */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-4/3 sm:aspect-16/10 flex items-center justify-center border border-slate-800 shadow-inner w-full max-w-full">
        {/* Live Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            hasPermission ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Hidden Canvas used for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Shutter flash effect */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white/70 z-20 pointer-events-none transition-opacity" />
        )}

        {/* Framing & Viewfinder HUD Overlay */}
        {hasPermission && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-10">
            {/* Top Bar inside Viewfinder */}
            <div className="flex items-center justify-between gap-2">
              {renderStatusBadge()}

              {autoInspect && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700 backdrop-blur-xs shrink-0">
                  AUTO-LOOP ({captureIntervalMs / 1000}s)
                </span>
              )}
            </div>

            {/* Visual Guideline Box */}
            <div className="relative mx-auto w-[85%] sm:w-4/5 h-3/5 border-2 border-dashed border-white/40 rounded-lg flex flex-col justify-between p-2 sm:p-2.5">
              <div className="flex justify-between text-[9px] sm:text-[10px] font-mono text-white/70">
                <span>[INSPECTION TARGET]</span>
                <span className="truncate max-w-[120px]">{approvedProduct?.name ? approvedProduct.name.slice(0, 18) : 'PACKAGING'}</span>
              </div>
              <div className="flex justify-between items-end text-[8px] sm:text-[9px] font-mono text-white/50">
                <span className="hidden xs:inline">ALIGN STATUTORY DECLARATIONS</span>
                <span>TAP INSPECT</span>
              </div>
            </div>

            {/* Bottom Status text inside viewfinder */}
            <div className="text-center px-1">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur-xs text-[10px] sm:text-[11px] text-slate-200 border border-slate-800 truncate max-w-full">
                {statusMessage || 'Position package and click "Inspect Next Item"'}
              </span>
            </div>
          </div>
        )}

        {/* Camera Permission / Fallback State */}
        {hasPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 sm:p-6 text-center text-white bg-slate-900/90 z-10">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold">Camera Mode Unavailable</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {errorMessage || 'Camera access not granted. You can test inspections using sample packages or file upload below.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-md text-xs font-semibold hover:bg-slate-100 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSamplePicker(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Pick Sample</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera and Inspection Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 w-full">
        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Main Inspection Trigger */}
          <button
            type="button"
            onClick={() => captureAndAnalyzeFrame(true)}
            disabled={isAnalyzing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all shadow-xs disabled:opacity-50 active:scale-95"
            title="Inspect current camera frame immediately"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Comparing...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Inspect Next</span>
              </>
            )}
          </button>

          {/* Continuous Auto-Inspect Toggle */}
          <button
            type="button"
            onClick={() => setAutoInspect((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
              autoInspect
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {autoInspect ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-600" />
                <span>Loop: ON</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-500" />
                <span>Loop: OFF</span>
              </>
            )}
          </button>

          {/* Upload Test Image */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
            title="Inspect an image file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Upload Test Photo</span>
            <span className="sm:hidden">Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Sample Picker Trigger */}
          <button
            type="button"
            onClick={() => setShowSamplePicker((prev) => !prev)}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Pick Test Package</span>
            <span className="sm:hidden">Samples</span>
          </button>

          {/* Stop Inspection Session */}
          <button
            type="button"
            onClick={onStopInspection}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors ml-auto sm:ml-0"
          >
            <Square className="w-3.5 h-3.5 text-slate-500" />
            <span>End</span>
          </button>
        </div>

        {/* Right: Camera device selector */}
        {devices.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 w-full sm:w-auto justify-end">
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                startCamera(e.target.value);
              }}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 font-medium max-w-full"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Sample Package Picker Dropdown */}
      {showSamplePicker && (
        <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Select a Test Package to Inspect Against Parent Profile:
            </span>
            <button
              type="button"
              onClick={() => setShowSamplePicker(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_PRODUCTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all flex items-center gap-2 group shadow-2xs"
              >
                <img
                  src={sample.imageUrl}
                  alt={sample.name}
                  className="w-8 h-10 object-cover rounded border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-900 block truncate group-hover:text-blue-700">
                    {sample.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {sample.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
