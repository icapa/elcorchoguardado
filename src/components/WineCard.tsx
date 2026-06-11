"use client";

import { Star, Wine as WineIcon } from "lucide-react";

interface WineCardProps {
  wine: {
    id?: string;
    name: string;
    type: string;
    winery: string;
    restaurant: string;
    rating: number;
    date: string;
    notes: string;
    imageUrl?: string;
    event?: string;
  };
  onClick: () => void;
}

export default function WineCard({ wine, onClick }: WineCardProps) {
  // Render star ratings
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={13}
        fill={index < rating ? "var(--star-color)" : "transparent"}
        color={index < rating ? "var(--star-color)" : "rgba(255,255,255,0.2)"}
      />
    ));
  };

  const wineTypeLower = wine.type.toLowerCase();
  
  return (
    <div className="wine-card glass" onClick={onClick}>
      <div className="wine-card-image">
        {wine.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wine.imageUrl} alt={wine.name} loading="lazy" />
        ) : (
          <WineIcon size={28} className="wine-card-fallback-image" />
        )}
      </div>

      <div className="wine-card-content">
        <div className="wine-card-header">
          <h3 className="wine-card-title">{wine.name}</h3>
          <span className={`wine-card-badge ${wineTypeLower}`}>
            {wine.type}
          </span>
        </div>

        <p className="wine-card-subtitle">{wine.winery}</p>

        <div className="wine-card-footer">
          <span className="wine-card-restaurant">{wine.restaurant}</span>
          <div className="wine-card-stars">
            {renderStars(wine.rating)}
          </div>
        </div>
      </div>
    </div>
  );
}
