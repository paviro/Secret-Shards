import { useState, useEffect, useRef, useCallback } from 'react';

export type CameraError = string | null;

export function useCamera(shouldInit = true) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
    const [error, setError] = useState<CameraError>(null);
    const [hasFlash, setHasFlash] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    
    // We use a ref for the active stream to ensure we can always access the current one for cleanup
    const activeStreamRef = useRef<MediaStream | null>(null);

    // Initialize cameras
    useEffect(() => {
        if (!shouldInit) return;

        let isMounted = true;

        const getCameras = async () => {
            try {
                // Request permission first to enumerate devices with labels
                // Prefer environment facing camera for initial permission request to help identify the back camera
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                
                // capturing the deviceId of the camera that was selected by default/preference
                const track = stream.getVideoTracks()[0];
                const settings = track.getSettings();
                const preferredDeviceId = settings.deviceId;

                // Stop the temporary stream immediately
                stream.getTracks().forEach(track => track.stop());

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');

                if (isMounted) {
                    setCameras(videoDevices);
                    
                    // Try to find the device that matched our preference
                    const preferredDevice = preferredDeviceId 
                        ? videoDevices.find(d => d.deviceId === preferredDeviceId)
                        : undefined;

                    // Prefer back camera (environment) if available
                    const backCamera = videoDevices.find(device =>
                        device.label.toLowerCase().includes('back') ||
                        device.label.toLowerCase().includes('rear') ||
                        device.label.toLowerCase().includes('environment') ||
                        device.label.toLowerCase().includes('outward')
                    );

                    if (videoDevices.length > 0) {
                        // Priority: 
                        // 1. The device that getUserMedia({facingMode: 'environment'}) picked
                        // 2. A device with a label indicating it's a back camera
                        // 3. The first available device
                        setCurrentCameraId(
                            preferredDevice?.deviceId ?? 
                            backCamera?.deviceId ?? 
                            videoDevices[0].deviceId
                        );
                    } else {
                        setError("No cameras found.");
                    }
                }
            } catch (err) {
                console.error("Error enumerating devices:", err);
                if (isMounted) setError("Camera permission denied or no camera available.");
            }
        };

        getCameras();

        return () => {
            isMounted = false;
        };
    }, [shouldInit]);

    const stopActiveStream = useCallback(() => {
        if (!activeStreamRef.current) return;
        activeStreamRef.current.getTracks().forEach(track => {
            if (track.readyState === 'live') {
                track.stop();
            }
        });
        activeStreamRef.current = null;
    }, []);

    // Start stream when camera changes
    useEffect(() => {
        if (!shouldInit || !currentCameraId || !videoRef.current) return;

        let isMounted = true;

        const startStream = async () => {
            try {
                // Stop any existing stream first
                stopActiveStream();

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: currentCameraId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });

                if (!isMounted) {
                    // If component unmounted while waiting for stream, stop it immediately
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                activeStreamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    try {
                        await videoRef.current.play();
                    } catch (e) {
                        if (e instanceof DOMException && e.name === 'AbortError') {
                             // Ignore abort errors (e.g. if play was interrupted by pause or load)
                        } else {
                             throw e;
                        }
                    }

                    // Check for flash capability
                    const track = stream.getVideoTracks()[0];
                    const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
                    setHasFlash(!!capabilities.torch);
                    setFlashOn(false);
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Error starting stream:", err);
                    setError("Failed to start camera stream.");
                }
            }
        };

        startStream();

        return () => {
            isMounted = false;
            stopActiveStream();
        };
    }, [currentCameraId, stopActiveStream, shouldInit]);

    const switchCamera = useCallback(() => {
        if (cameras.length <= 1) return;
        const currentIndex = cameras.findIndex(c => c.deviceId === currentCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        setCurrentCameraId(cameras[nextIndex].deviceId);
    }, [cameras, currentCameraId]);

    const toggleFlash = useCallback(async () => {
        if (!activeStreamRef.current) return;
        const track = activeStreamRef.current.getVideoTracks()[0];
        const newFlashState = !flashOn;
        try {
            await track.applyConstraints({
                advanced: [{ torch: newFlashState } as any]
            });
            setFlashOn(newFlashState);
        } catch (err) {
            console.error("Error toggling flash:", err);
        }
    }, [flashOn]);

    return {
        videoRef,
        cameras,
        currentCameraId,
        error,
        hasFlash,
        flashOn,
        switchCamera,
        toggleFlash,
        stopStream: stopActiveStream
    };
}
