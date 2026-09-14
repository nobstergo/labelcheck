import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, fileName: string) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera
  const startCamera = async (deviceId?: string) => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter((d) => d.kind === 'videoinput');
      setCameraDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings or upload a file.'
          : 'Unable to access device camera. Please upload an image file instead.'
      );
      setCameraActive(false);
    }
  };

  // Switch camera tab
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Capture snapshot from video
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedSnapshot(dataUrl);
      stopCamera();
    }
  };

  // File drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="image-uploader-container" className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload / Camera Mode Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1">
          <button
            id="tab-upload"
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setCapturedSnapshot(null);
            }}
            className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Label Image</span>
          </button>
          <button
            id="tab-camera"
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Capture with Device Camera</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="p-6 sm:p-8">
            <div
              id="drop-zone"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-slate-900 bg-slate-100/80 scale-[0.99]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileInput}
                className="hidden"
                id="file-input-field"
              />

              <div className="w-14 h-14 mx-auto rounded-full bg-slate-200/70 text-slate-700 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7" />
              </div>

              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Click or drag & drop packaged commodity label
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Supports clear photographs or flat scans of package Principal Display Panels (JPG, PNG, WEBP).
              </p>

              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs pointer-events-none"
              >
                <span>Browse Local File</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Camera Capture */}
        {activeTab === 'camera' && (
          <div className="p-6 sm:p-8 space-y-4">
            {cameraError ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Camera Access Notice</p>
                  <p className="text-amber-800">{cameraError}</p>
                </div>
              </div>
            ) : capturedSnapshot ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-black aspect-4/3 max-h-[420px] flex items-center justify-center">
                  <img
                    src={capturedSnapshot}
                    alt="Captured label"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 text-white px-2.5 py-1 rounded text-xs font-mono">
                    Captured Snapshot
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedSnapshot(null);
                      startCamera(selectedDeviceId);
                    }}
                    className="px-4 py-2 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => onImageSelected(capturedSnapshot, 'camera_capture.jpg')}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    <span>Inspect Captured Label</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-950 aspect-4/3 max-h-[420px] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Viewfinder overlay guide */}
                  <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-white/60 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between text-[11px] text-white/90 font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs self-start">
                      Align Package Label
                    </div>
                    <div className="text-[10px] text-white/80 text-center bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs self-center">
                      Ensure text is clear and in focus
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {cameraDevices.length > 1 && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>Camera:</span>
                      <select
                        value={selectedDeviceId}
                        onChange={(e) => {
                          setSelectedDeviceId(e.target.value);
                          startCamera(e.target.value);
                        }}
                        className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
                      >
                        {cameraDevices.map((d, i) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    id="btn-take-snapshot"
                    type="button"
                    onClick={takeSnapshot}
                    className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

