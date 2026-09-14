import React, { useState, useRef, useEffect } from 'react';
import { ApprovedProduct, ExtractedField } from '../types';
import { createApprovedProductFromScan } from '../services/productStorage';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { Camera, Upload, Check, X, RefreshCw, Sparkles, Image as ImageIcon, CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface CreateProfileByScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated: (product: ApprovedProduct) => void;
}

// Client-side image scaler to guarantee phone gallery photos upload quickly without exceeding payload limits
function optimizeImage(dataUrl: string, maxDimension = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve(dataUrl);
        return;
      }
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
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const CreateProfileByScanModal: React.FC<CreateProfileByScanModalProps> = ({
  isOpen,
  onClose,
  onProfileCreated
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'sample'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Staged static image for scanning
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('reference_label.jpg');

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Result state after analysis
  const [analyzed, setAnalyzed] = useState(false);
  const [detectedName, setDetectedName] = useState('');
  const [profileCategory, setProfileCategory] = useState('Packaged Commodity');
  const [extractedFields, setExtractedFields] = useState<Record<string, ExtractedField> | null>(null);
  const [editableForm, setEditableForm] = useState({
    product_name: '',
    net_quantity: '',
    mrp: '',
    unit_sale_price: '',
    manufacturer: '',
    consumer_care: '',
    country_of_origin: 'India',
    date_info: 'Valid Month and Year'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera helper
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please upload a file from your device instead.'
          : 'Unable to start camera. Please choose or upload a file from your device.'
      );
      setCameraActive(false);
    }
  };

  // Handle active tab changes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    if (activeTab === 'camera' && !selectedImage && !analyzed) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, selectedImage, analyzed]);

  if (!isOpen) return null;

  // Take static snapshot from camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setSelectedImage(dataUrl);
      setSelectedFileName('camera_snapshot.jpg');
      stopCamera();
    }
  };

  // Process file upload from device or gallery
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, or WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const optimized = await optimizeImage(reader.result);
        setSelectedImage(optimized);
        setSelectedFileName(file.name);
        setScanError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Pick a pre-loaded sample commodity
  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_PRODUCTS.find((s) => s.id === sampleId);
    if (sample) {
      setSelectedImage(sample.imageUrl);
      setSelectedFileName(`${sample.name}.jpg`);
      setScanError(null);
      // Run analysis directly on sample
      runAnalysis(sample.imageUrl, sampleId);
    }
  };

  // Send staged image to /api/analyze using the same logic as normal scan
  const runAnalysis = async (imgBase64?: string, sampleId?: string) => {
    const targetImage = imgBase64 || selectedImage;
    if (!targetImage && !sampleId) return;

    setIsScanning(true);
    setScanError(null);

    try {
      const payload = sampleId
        ? { sampleId }
        : { imageBase64: targetImage, fileName: selectedFileName };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.result) {
        throw new Error(data.error || 'Failed to analyze package label.');
      }

      const result = data.result;
      const fields = result.extractedFields || {};
      setExtractedFields(fields);

      const nameCandidate =
        fields['LM-002']?.rawValue ||
        result.commodityType ||
        'Approved Reference Product';
      setDetectedName(nameCandidate);
      setProfileCategory(result.commodityType || 'Packaged Commodity');

      setEditableForm({
        product_name: fields['LM-002']?.rawValue || nameCandidate,
        net_quantity: fields['LM-003']?.rawValue || '',
        mrp: fields['LM-005']?.rawValue || '',
        unit_sale_price: fields['LM-008']?.rawValue || '',
        manufacturer: fields['LM-001']?.rawValue || '',
        consumer_care: fields['LM-006']?.rawValue || '',
        country_of_origin: fields['LM-007']?.rawValue || 'India',
        date_info: fields['LM-004']?.rawValue || 'Valid Month and Year'
      });

      setAnalyzed(true);
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(
        err.message || 'Unable to scan package. Please ensure the image is clear and well-lit, then try again.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Save the approved product profile and start inspection
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detectedName.trim() || !selectedImage) return;

    // Create synthetic fields map from the confirmed form
    const syntheticFields: Record<string, ExtractedField> = {
      'LM-001': { ruleCode: 'LM-001', fieldName: 'Manufacturer', rawValue: editableForm.manufacturer, confidence: 1 },
      'LM-002': { ruleCode: 'LM-002', fieldName: 'Product Name', rawValue: editableForm.product_name, confidence: 1 },
      'LM-003': { ruleCode: 'LM-003', fieldName: 'Net Quantity', rawValue: editableForm.net_quantity, confidence: 1 },
      'LM-004': { ruleCode: 'LM-004', fieldName: 'Date Info', rawValue: editableForm.date_info, confidence: 1 },
      'LM-005': { ruleCode: 'LM-005', fieldName: 'MRP', rawValue: editableForm.mrp, confidence: 1 },
      'LM-006': { ruleCode: 'LM-006', fieldName: 'Consumer Care', rawValue: editableForm.consumer_care, confidence: 1 },
      'LM-007': { ruleCode: 'LM-007', fieldName: 'Country of Origin', rawValue: editableForm.country_of_origin, confidence: 1 },
      'LM-008': { ruleCode: 'LM-008', fieldName: 'Unit Sale Price', rawValue: editableForm.unit_sale_price, confidence: 1 }
    };

    const newProduct = createApprovedProductFromScan(
      detectedName.trim(),
      syntheticFields,
      selectedImage
    );

    // Reset and notify parent
    stopCamera();
    onProfileCreated(newProduct);
    onClose();
  };

  const handleRetake = () => {
    setAnalyzed(false);
    setSelectedImage(null);
    setScanError(null);
    setExtractedFields(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Create Reference Profile by Scanning
              </h3>
              <p className="text-xs text-slate-500">
                Scan the master product once. Its photo and declarations will be stored as the benchmark for continuous inspection.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Input / Image Selection Stage */}
        {!analyzed && (
          <div className="space-y-4">
            {/* Source Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setSelectedImage(null);
                  stopCamera();
                }}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Gallery / File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('camera');
                  setSelectedImage(null);
                }}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'camera'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Device Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('sample');
                  setSelectedImage(null);
                  stopCamera();
                }}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'sample'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Sample Packages</span>
              </button>
            </div>

            {/* Error banner */}
            {scanError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {/* TAB 1: Gallery / File Upload */}
            {activeTab === 'upload' && !selectedImage && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Choose Photo from Gallery or Files
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
                  Select a clear photograph of the product label (JPG, PNG, WEBP).
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white pointer-events-none"
                >
                  <span>Select Image</span>
                </button>
              </div>
            )}

            {/* TAB 2: Camera Capture (Static Photo Scan) */}
            {activeTab === 'camera' && !selectedImage && (
              <div className="space-y-3">
                {cameraError ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Camera Notice</p>
                      <p className="text-amber-800 mt-0.5">{cameraError}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-black aspect-4/3 max-h-[360px] flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                      />
                      {/* Viewfinder framing guide */}
                      <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <span className="w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                          <span className="w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                        </div>
                        <div className="text-center">
                          <span className="bg-black/60 text-white text-[11px] font-mono px-2.5 py-1 rounded backdrop-blur-xs">
                            Align master package label inside box
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                          <span className="w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center pt-1">
                      <button
                        type="button"
                        onClick={handleCaptureSnapshot}
                        disabled={!cameraActive}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture Static Photo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Sample Packages */}
            {activeTab === 'sample' && !selectedImage && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_PRODUCTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample.id)}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all flex items-center gap-3 bg-white"
                  >
                    <img
                      src={sample.imageUrl}
                      alt={sample.name}
                      className="w-12 h-14 object-cover rounded-md border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {sample.name}
                      </h5>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {sample.category}
                      </span>
                      <span className="text-[10px] text-blue-600 font-semibold mt-0.5 inline-block">
                        Select as benchmark →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Static Image Preview before submitting analysis */}
            {selectedImage && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-4/3 max-h-[320px] flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Selected package"
                    className="w-full h-full object-contain max-h-[320px]"
                  />
                  <div className="absolute top-3 left-3 bg-black/75 text-white px-2 py-0.5 rounded text-[11px] font-mono">
                    Master Reference Image
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={isScanning}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Choose Different Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runAnalysis()}
                    disabled={isScanning}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing & Extracting Details...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Scan & Extract Declarations</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Scanned Confirmation & Legal Metrology Review */}
        {analyzed && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Product successfully analyzed and extracted. Review specifications below:
                </span>
              </div>
              <button
                type="button"
                onClick={handleRetake}
                className="text-[11px] font-semibold text-emerald-800 underline hover:text-emerald-950"
              >
                Rescan photo
              </button>
            </div>

            {/* Thumbnail + Name Input */}
            <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Scanned master"
                  className="w-16 h-20 object-cover rounded-lg border border-slate-300 shrink-0 shadow-2xs"
                />
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-0.5">
                    Profile Reference Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={detectedName}
                    onChange={(e) => setDetectedName(e.target.value)}
                    placeholder="e.g. Tata Tea Gold 500g"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Category: <span className="text-slate-800 font-semibold">{profileCategory}</span>
                </div>
              </div>
            </div>

            {/* Key Declarations Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Commodity / Generic Name
                </label>
                <input
                  type="text"
                  value={editableForm.product_name}
                  onChange={(e) =>
                    setEditableForm({ ...editableForm, product_name: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Net Quantity (e.g. 500 g)
                </label>
                <input
                  type="text"
                  value={editableForm.net_quantity}
                  onChange={(e) =>
                    setEditableForm({ ...editableForm, net_quantity: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Maximum Retail Price (MRP)
                </label>
                <input
                  type="text"
                  value={editableForm.mrp}
                  onChange={(e) =>
                    setEditableForm({ ...editableForm, mrp: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono font-semibold text-emerald-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit Sale Price (USP)
                </label>
                <input
                  type="text"
                  value={editableForm.unit_sale_price}
                  onChange={(e) =>
                    setEditableForm({ ...editableForm, unit_sale_price: e.target.value })
                  }
                  placeholder="e.g. ₹0.30 / g"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Manufacturer / Packer Details
              </label>
              <input
                type="text"
                value={editableForm.manufacturer}
                onChange={(e) =>
                  setEditableForm({ ...editableForm, manufacturer: e.target.value })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Country of Origin
                </label>
                <input
                  type="text"
                  value={editableForm.country_of_origin}
                  onChange={(e) =>
                    setEditableForm({ ...editableForm, country_of_origin: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consumer Care Phone/Email
                </label>
                <input
                  type="text"
                  value={editableForm.consumer_care}
                  onChange={(e) =>
                    setEditableForm({ ...editableForm, consumer_care: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Save as Parent Reference & Start Inspection</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
