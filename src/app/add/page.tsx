"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, isFirebaseConfigured } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { Star, Upload, Trash2, ArrowLeft, Loader2, Save, Sparkles } from "lucide-react";

const WINE_TYPES = ["Tinto", "Blanco", "Rosado", "Cava", "Champagne", "Naranja", "Espumoso", "Generoso", "Otro"];

export default function AddWinePage() {
  const { user, isAuthorized, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("Tinto");
  const [winery, setWinery] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [event, setEvent] = useState("");
  const [grapes, setGrapes] = useState("");
  const [rating, setRating] = useState(5);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: File[] = [];
      const newPreviews: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          setError("Una de las imágenes supera el límite de 10 MB.");
          return;
        }
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
      setImageFiles((prev) => [...prev, ...newFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
      setError("");
    }
  };

  const removeImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized || !user) return;

    setLoading(true);
    setError("");

    try {
      const imageUrls: string[] = [];
      const imagePaths: string[] = [];

      // 1. Upload all images to Storage if selected
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const timestamp = Date.now() + i; // prevent duplicate filename keys
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const path = `wines/${user.uid}/${timestamp}_${safeName}`;
        
        const imageRef = ref(storage, path);
        const uploadResult = await uploadBytes(imageRef, file);
        const url = await getDownloadURL(uploadResult.ref);
        
        imageUrls.push(url);
        imagePaths.push(path);
      }

      // 2. Save document to Firestore
      const wineData = {
        name,
        type,
        winery: winery || "Sin Bodega/D.O.",
        restaurant: restaurant || "Sin Rinconcito",
        event: event || "",
        grapes: grapes || "Sin especificar",
        rating,
        date,
        notes,
        imageUrl: imageUrls[0] || "",      // primary image for backward compatibility
        imagePath: imagePaths[0] || "",    // primary image path for backward compatibility
        imageUrls,                          // all image URLs
        imagePaths,                         // all image paths
        createdBy: user.uid,
        creatorEmail: user.email,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "wines"), wineData);

      setSuccess(true);
      
      // Clear form
      setName("");
      setType("Tinto");
      setWinery("");
      setRestaurant("");
      setEvent("");
      setGrapes("");
      setRating(5);
      setNotes("");
      setImageFiles([]);
      setImagePreviews([]);

      // Redirect after short delay
      setTimeout(() => {
        router.push("/");
      }, 1500);

    } catch (err: any) {
      console.error("Error saving wine:", err);
      setError("No se pudo guardar el vino. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <p>Cargando información de acceso...</p>
      </div>
    );
  }

  // Restrict access to non-authorized users
  if (!isAuthorized) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 16px" }}>
        <div className="glass" style={{ padding: "32px 20px" }}>
          <h2 style={{ color: "var(--wine-color)", marginBottom: "16px" }}>Acceso Restringido</h2>
          <p style={{ marginBottom: "24px" }}>
            No tienes permisos para añadir registros de vinos. Inicia sesión con una cuenta autorizada.
          </p>
          <button className="btn" onClick={() => router.push("/login")}>
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
        <button 
          onClick={() => router.push("/")} 
          style={{ background: "none", border: "none", color: "var(--cork-base)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
      </div>

      <h1 className="page-title">Nuevo Recuerdo</h1>
      <p className="page-subtitle">Guarda los detalles de tu experiencia</p>

      {success && (
        <div style={{ background: "rgba(46, 125, 50, 0.15)", border: "1px solid #2e7d32", color: "#a5d6a7", padding: "16px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
          <Sparkles size={18} />
          <span>¡Vino guardado con éxito! Redirigiendo...</span>
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(114, 47, 55, 0.15)", border: "1px solid var(--wine-color)", color: "#ff9eaf", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass" style={{ padding: "24px" }}>
        {/* Wine Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="wine-name">Nombre del Vino *</label>
          <input
            id="wine-name"
            type="text"
            className="form-input"
            placeholder="ej. Protos Crianza, Mauro, Vega Sicilia..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {/* Type & Date */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="wine-type">Tipo *</label>
            <select
              id="wine-type"
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
            >
              {WINE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="wine-date">Fecha *</label>
            <input
              id="wine-date"
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Winery/D.O. & Restaurant */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="wine-winery">Bodega / D.O.</label>
            <input
              id="wine-winery"
              type="text"
              className="form-input"
              placeholder="ej. Ribera del Duero"
              value={winery}
              onChange={(e) => setWinery(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="wine-restaurant">Rinconcito</label>
            <input
              id="wine-restaurant"
              type="text"
              className="form-input"
              placeholder="ej. El Celler de Can Roca, terraza de casa..."
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Grapes & Event */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="wine-grapes">Variedad de Uva(s)</label>
            <input
              id="wine-grapes"
              type="text"
              className="form-input"
              placeholder="ej. Tempranillo, Verdejo..."
              value={grapes}
              onChange={(e) => setGrapes(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="wine-event">Evento / Contexto</label>
            <input
              id="wine-event"
              type="text"
              className="form-input"
              placeholder="ej. Cumpleaños, cena de Navidad..."
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Rating (Stars) */}
        <div className="form-group">
          <label className="form-label">Puntuación</label>
          <div className="star-rating">
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1;
              return (
                <button
                  key={i}
                  type="button"
                  className="star-btn"
                  onClick={() => setRating(starValue)}
                  disabled={loading}
                  aria-label={`Calificar con ${starValue} estrellas`}
                >
                  <Star
                    size={28}
                    fill={starValue <= rating ? "var(--star-color)" : "transparent"}
                    color={starValue <= rating ? "var(--star-color)" : "rgba(255,255,255,0.2)"}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label" htmlFor="wine-notes">Notas Personales</label>
          <textarea
            id="wine-notes"
            className="form-textarea"
            placeholder="Aroma, sabor, maridaje, anécdotas de la velada..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <label className="form-label">Fotos de la Botella (Etiqueta delantera/trasera)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleImagesChange}
            disabled={loading}
          />
          
          <div 
            className="image-upload-wrapper"
            onClick={() => fileInputRef.current?.click()}
            style={{ marginBottom: "16px" }}
          >
            <Upload size={32} style={{ color: "var(--cork-base)", marginBottom: "8px" }} />
            <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--cork-light)" }}>
              Hacer foto o seleccionar archivos
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Puedes subir varias imágenes (ej. etiqueta de delante y de detrás)
            </p>
          </div>

          {imagePreviews.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "12px" }}>
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview" style={{ width: "100%", height: "100px", position: "relative", margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={`Foto ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={(e) => removeImage(index, e)}
                    disabled={loading}
                    aria-label="Quitar imagen"
                    style={{ position: "absolute", top: "4px", right: "4px", width: "24px", height: "24px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          className="btn" 
          disabled={loading || !name} 
          style={{ marginTop: "12px" }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Guardando en la bodega...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Guardar en el Corcho</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
