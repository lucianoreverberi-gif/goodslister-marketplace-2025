
import React, { useEffect } from 'react';

interface SEOHeadProps {
    title: string;
    description?: string;
    image?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ 
    title, 
    description = "Rent adventure gear from locals. Kayaks, Bikes, RVs and more on Goodslister.", 
    image = "https://storage.googleapis.com/aistudio-marketplace-bucket/tool-project-logos/goodslister-logo.png" 
}) => {
    useEffect(() => {
        // Update Title
        document.title = `${title} | Goodslister`;

        // Helper to update meta tags
        const updateMeta = (name: string, content: string) => {
            let element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Standard Meta
        updateMeta('description', description);

        // Open Graph / Social
        updateMeta('og:title', title);
        updateMeta('og:description', description);
        updateMeta('og:image', image);
        updateMeta('og:type', 'website');
        
        // Twitter
        updateMeta('twitter:card', 'summary_large_image');
        updateMeta('twitter:title', title);
        updateMeta('twitter:description', description);
        updateMeta('twitter:image', image);

    }, [title, description, image]);

    return null; // This component doesn't render DOM elements itself
};

export default SEOHead;
