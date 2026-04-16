
import React, { useRef, useState, useEffect } from 'react';
import { CameraIcon, RefreshCwIcon, CheckCircleIcon, XIcon } from './icons';

interface CameraCaptureProps {
    onCapture: (imageUrl: string) => void;
    label: string;
    aspectRatio?: 'video' | 'portrait' | 'id-card';
    folder?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, label, aspectRatio = 'video', folder = 'verifications' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };

    const handleConfirm = async () => {
        if (!capturedImage) return;
        
        setIsUploading(true);
        try {
            // Convert dataURL to Blob using fetch (most reliable for dataURLs)
            const blobResponse = await fetch(capturedImage);
            const blob = await blobResponse.blob();
            
            const filename = `capture_${Date.now()}.jpg`;

            // Upload to server
            const uploadResponse = await fetch(`/api/upload-image?filename=${encodeURIComponent(filename)}&folder=${encodeURIComponent(folder)}`, {
                method: 'POST',
                body: blob,
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                let errorMessage = "Upload failed";
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const { url } = await uploadResponse.json();
            onCapture(url);
        } catch (err) {
            console.error("Error uploading captured image:", err);
            alert(`Failed to process image: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setCapturedImage(null);
            startCamera();
        } finally {
            setIsUploading(false);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="w-full max-w-md mx-auto bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
            <div className="p-4 bg-slate-800/50 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                <div className="flex gap-1">
                    <div className={`w-2 h-2 rounded-full ${stream ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                </div>
            </div>

            <div className={`relative bg-black flex items-center justify-center overflow-hidden ${aspectRatio === 'id-card' ? 'aspect-[1.6/1]' : 'aspect-video'}`}>
                {error ? (
                    <div className="p-8 text-center">
                        <XIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-white text-sm font-bold">{error}</p>
                        <button onClick={startCamera} className="mt-4 px-6 py-2 bg-white/10 text-white rounded-full text-xs font-black">RETRY</button>
                    </div>
                ) : capturedImage ? (
                    <img src={capturedImage} className="w-full h-full object-cover" />
                ) : (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                        />
                        {aspectRatio === 'id-card' && (
                            <div className="absolute inset-0 border-[3px] border-dashed border-white/30 rounded-2xl m-8 pointer-events-none flex items-center justify-center">
                                <div className="text-white/20 font-black text-[10px] uppercase tracking-widest">Align ID Card Here</div>
                            </div>
                        )}
                        {aspectRatio === 'portrait' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-64 border-[3px] border-dashed border-white/30 rounded-full"></div>
                            </div>
                        )}
                    </>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                        <span className="text-xs font-black uppercase tracking-widest">Processing Securely...</span>
                    </div>
                )}
            </div>

            <div className="p-6 flex justify-center gap-4 bg-slate-900">
                {!capturedImage ? (
                    <button 
                        onClick={capturePhoto}
                        disabled={!stream}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all disabled:opacity-20"
                    >
                        <div className="w-12 h-12 border-4 border-slate-900 rounded-full"></div>
                    </button>
                ) : (
                    <div className="flex gap-4 w-full">
                        <button 
                            onClick={handleRetake}
                            className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCwIcon className="h-4 w-4" /> RETAKE
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircleIcon className="h-4 w-4" /> USE PHOTO
                        </button>
                    </div>
                )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;
