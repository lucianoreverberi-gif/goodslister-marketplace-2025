import React from 'react';

interface CategoryCardProps {
    name: string;
    imageUrl: string;
    onClick: (category: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, imageUrl, onClick }) => {
    return (
        <div 
            className="relative rounded-lg overflow-hidden cursor-pointer group h-48 shadow-md"
            onClick={() => onClick(name)}
        >
            <img src={imageUrl} alt={name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors"></div>
            <div className="absolute inset-0 flex items-center justify-center p-2">
                <h3 className="text-white text-xl font-bold text-center">{name}</h3>
            </div>
        </div>
    );
};

export default CategoryCard;
