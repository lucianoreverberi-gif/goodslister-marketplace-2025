import React, { useRef, useState } from 'react';
import { UploadCloudIcon } from './icons';

interface ImageUploaderProps {
    currentImageUrl: string;
    onImageChange: (newImageUrl: string) => void;
    label: string;
    isLoading?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImageUrl, onImageChange, label, isLoading }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && !isLoading) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClick = () => {
        if (!isLoading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div
                className={`mt-1 relative w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 transition-all group ${!isLoading ? 'cursor-pointer hover:border-cyan-500' : 'cursor-wait'}`}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <img src={currentImageUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />

                <div className={`absolute inset-0 bg-black transition-opacity duration-300 rounded-lg ${isHovered && !isLoading ? 'opacity-60' : 'opacity-20'}`}></div>

                {!isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <UploadCloudIcon className="w-8 h-8 mb-2" />
                        <span className="font-semibold">Change image</span>
                        <span className="text-xs mt-1">Click to upload a file</span>
                    </div>
                )}
                
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        <span className="mt-3 text-sm font-semibold">Uploading...</span>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    disabled={isLoading}
                />
            </div>
        </div>
    );
};

export default ImageUploader;