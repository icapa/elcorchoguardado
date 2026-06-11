"use client";

import { useEffect, useState } from "react";
import { X, Calendar, MapPin, Award, Tag, Trash2, Loader2, Wine as WineIcon, Sparkles } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

interface WineDetailsModalProps {
  wine: {
    id?: string;
    name: string;
    type: string;
    winery: string;
    restaurant: string;
    grapes?: string;
    rating: number;
    date: string;
    notes: string;
    imageUrl?: string;
    imagePath?: string;
    imageUrls?: string[];
    imagePaths?: string[];
    event?: string;
  };
  onClose: () => void;
  onDeleted: () => void;
}

export default function WineDetailsModal({ wine, onClose, onDeleted }: WineDetailsModalProps) {
  const { isAuthorized } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const displayImages = wine.imageUrls && wine.imageUrls.length > 0 
    ? wine.imageUrls 
    : (wine.imageUrl ? [wine.imageUrl] : []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDelete = async () => {
    if (!wine.id) return;
    if (!confirm(`¿Estás seguro de que quieres borrar el registro de "${wine.name}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      // 1. Delete all images from Storage if exist
      const pathsToDelete = wine.imagePaths && wine.imagePaths.length > 0
        ? wine.imagePaths
        : (wine.imagePath ? [wine.imagePath] : []);

      for (const path of pathsToDelete) {
        if (path) {
          const imageRef = ref(storage, path);
          await deleteObject(imageRef).catch((error) => {
            console.error("Error deleting image from Storage:", error);
          });
        }
      }

      // 2. Delete document from Firestore
      await deleteDoc(doc(db, "wines", wine.id));
      
      onDeleted();
      onClose();
    } catch (error) {
      console.error("Error deleting wine document:", error);
      alert("Error al borrar el vino. Por favor, inténtalo de nuevo.");
      setIsDeleting(false);
    }
  };

  // Format date nicely
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString + "T12:00:00").toLocaleDateString("es-ES", options);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
      >
        <div className="modal-header">
          <h2>Detalle del Vino</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Wine image */}
        <div className="modal-hero-image">
          {displayImages.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayImages[activeImgIndex]} alt={wine.name} />
          ) : (
            <WineIcon size={64} className="wine-card-fallback-image" />
          )}
        </div>

        {/* Thumbnail Selector */}
        {displayImages.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px", marginBottom: "16px" }}>
            {displayImages.map((url, index) => (
              <button
                key={index}
                onClick={() => setActiveImgIndex(index)}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "6px",
                  border: activeImgIndex === index ? "2px solid var(--cork-base)" : "1px solid rgba(255,255,255,0.15)",
                  padding: 0,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "rgba(0,0,0,0.2)",
                  transition: "all 0.2s ease",
                  transform: activeImgIndex === index ? "scale(1.05)" : "scale(1)"
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Vista previa ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}

        {/* Wine Name */}
        <h1 style={{ marginBottom: "16px", fontSize: "1.8rem" }}>{wine.name}</h1>

        {/* Metadata Grid */}
        <div className="modal-meta-grid">
          <div className="modal-meta-item">
            <span className="modal-meta-label">
              <Tag size={12} style={{ display: "inline", marginRight: "4px" }} />
              Tipo
            </span>
            <span className="modal-meta-value">{wine.type}</span>
          </div>

          <div className="modal-meta-item">
            <span className="modal-meta-label">
              <Award size={12} style={{ display: "inline", marginRight: "4px" }} />
              Bodega / D.O.
            </span>
            <span className="modal-meta-value">{wine.winery}</span>
          </div>

          <div className="modal-meta-item">
            <span className="modal-meta-label">
              <MapPin size={12} style={{ display: "inline", marginRight: "4px" }} />
              Rinconcito
            </span>
            <span className="modal-meta-value">{wine.restaurant}</span>
          </div>

          <div className="modal-meta-item">
            <span className="modal-meta-label">
              <Calendar size={12} style={{ display: "inline", marginRight: "4px" }} />
              Fecha
            </span>
            <span className="modal-meta-value">{formatDate(wine.date)}</span>
          </div>

          {wine.event && (
            <div className="modal-meta-item" style={{ gridColumn: "span 2" }}>
              <span className="modal-meta-label">
                <Sparkles size={12} style={{ display: "inline", marginRight: "4px" }} />
                Evento
              </span>
              <span className="modal-meta-value">{wine.event}</span>
            </div>
          )}
        </div>

        {/* Grapes */}
        {wine.grapes && wine.grapes !== "Sin especificar" && (
          <div style={{ marginBottom: "20px", background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "8px", borderLeft: "3px solid var(--cork-base)" }}>
            <span className="modal-meta-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.75rem" }}>Variedad de Uva(s)</span>
            <span style={{ fontSize: "0.95rem", color: "var(--text-color)", fontWeight: "500" }}>{wine.grapes}</span>
          </div>
        )}

        {/* Stars */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <span className="modal-meta-label" style={{ margin: 0 }}>Puntuación:</span>
          <div style={{ display: "flex", color: "var(--star-color)", gap: "2px" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Award 
                key={i} 
                size={18} 
                fill={i < wine.rating ? "var(--star-color)" : "transparent"}
                color={i < wine.rating ? "var(--star-color)" : "rgba(255,255,255,0.2)"}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        {wine.notes && (
          <div className="modal-notes-section">
            <h3 className="modal-notes-title">Notas personales</h3>
            <div className="modal-notes-content">
              {wine.notes}
            </div>
          </div>
        )}

        {/* Admin Delete Action */}
        {isAuthorized && (
          <button 
            className="btn" 
            style={{ 
              background: "linear-gradient(135deg, #d32f2f, #9a0007)", 
              marginTop: "10px" 
            }}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 size={18} />
                <span>Borrar Registro</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
