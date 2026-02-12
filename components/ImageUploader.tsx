import React, { useRef, useState, useEffect } from 'react';
import { UploadCloudIcon } from './icons';

interface ImageUploaderProps {
    currentImageUrl: string;
    onImageChange: (newImageUrl: string) => void;
    label: string;
    isLoading?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImageUrl, onImageChange, label, isLoading: parentIsLoading }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = useState(currentImageUrl);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!isUploading) {
            setImageUrl(currentImageUrl);
        }
    }, [currentImageUrl, isUploading]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`/api/upload-image?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST',
                body: file,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setImageUrl(data.url);
            onImageChange(data.url);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al subir la imagen.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div
                className="relative w-full h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 transition-all overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
            >
                {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <UploadCloudIcon className="h-10 w-10 mb-2" />
                        <span className="text-xs font-semibold">Subir Imagen</span>
                    </div>
                )}
                
                {(isUploading || parentIsLoading) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>
        </div>
    );
};

export default ImageUploader;