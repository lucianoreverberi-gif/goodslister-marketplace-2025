// @ts-ignore - face-api.js has no strict types
import * as faceapi from 'face-api.js';

/**
 * Face verification utility using face-api.js (TensorFlow.js models).
 * Runs 100% client-side - photos never leave the user's device.
 * Uses TinyFaceDetector + FaceLandmark68Net + FaceRecognitionNet.
 */

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Loads face-api.js models from CDN (one time). ~7MB total, cached after first load.
 */
export async function loadFaceModels(): Promise<void> {
    if (modelsLoaded) return;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        modelsLoaded = true;
    })();

    return loadPromise;
}

async function urlToImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image: ' + url.substring(0, 60)));
        img.src = url;
    });
}

/**
 * Extracts a 128-dimensional face descriptor (embedding) from an image URL.
 * Returns null if no face is detected.
 */
export async function getFaceDescriptor(imageUrl: string): Promise<Float32Array | null> {
    await loadFaceModels();
    const img = await urlToImage(imageUrl);
    const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    return detection?.descriptor || null;
}

export type FaceMatchTier = 'STRONG' | 'MODERATE' | 'WEAK' | 'NO_MATCH' | 'NO_FACE_DETECTED' | 'ERROR';

export interface FaceMatchResult {
    matched: boolean;
    distance: number;
    confidence: number; // 0-100 percent
    tier: FaceMatchTier;
    message: string;
}

/**
 * Compares two face images and returns a match result.
 * Distance thresholds (lower = more similar):
 *   < 0.4  = STRONG match (very high confidence, same person)
 *   < 0.5  = MODERATE match (high confidence)
 *   < 0.6  = WEAK match (borderline, review manually)
 *   >= 0.6 = NO_MATCH (different person)
 */
export async function compareFaces(idPhotoUrl: string, facePhotoUrl: string): Promise<FaceMatchResult> {
    try {
        const [idDesc, faceDesc] = await Promise.all([
            getFaceDescriptor(idPhotoUrl),
            getFaceDescriptor(facePhotoUrl),
        ]);

        if (!idDesc || !faceDesc) {
            return {
                matched: false,
                distance: 1.0,
                confidence: 0,
                tier: 'NO_FACE_DETECTED',
                message: 'No se detect\u00f3 una cara clara en una de las fotos. Intent\u00e1 con mejor iluminaci\u00f3n y encuadre.',
            };
        }

        const distance = faceapi.euclideanDistance(idDesc, faceDesc);
        // Convert distance to a friendly confidence percentage
        // Distance 0.0 = 100%, 0.6+ = 0%
        const confidence = Math.max(0, Math.min(100, Math.round((1 - distance / 0.7) * 100)));

        if (distance < 0.4) {
            return {
                matched: true,
                distance,
                confidence,
                tier: 'STRONG',
                message: 'Identidad verificada. Coincidencia fuerte (' + confidence + '%).',
            };
        }
        if (distance < 0.5) {
            return {
                matched: true,
                distance,
                confidence,
                tier: 'MODERATE',
                message: 'Identidad verificada. Coincidencia moderada (' + confidence + '%).',
            };
        }
        if (distance < 0.6) {
            return {
                matched: true,
                distance,
                confidence,
                tier: 'WEAK',
                message: 'Verificaci\u00f3n d\u00e9bil (' + confidence + '%). Confirm\u00e1 visualmente antes de continuar.',
            };
        }
        return {
            matched: false,
            distance,
            confidence,
            tier: 'NO_MATCH',
            message: 'La persona en la foto no coincide con el ID (' + confidence + '%). Tom\u00e1 otra foto o cancel\u00e1 el check-in.',
        };
    } catch (error: any) {
        console.error('Face comparison error:', error);
        return {
            matched: false,
            distance: 1.0,
            confidence: 0,
            tier: 'ERROR',
            message: 'Error en la verificaci\u00f3n. ' + (error?.message || 'Intent\u00e1 nuevamente.'),
        };
    }
}
