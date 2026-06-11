"use client";

import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import WineCard from "../components/WineCard";
import WineDetailsModal from "../components/WineDetailsModal";
import { Search, SlidersHorizontal, Info, Wine as WineIcon, Sparkles } from "lucide-react";

interface Wine {
  id: string;
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
}

const WINE_TYPES = ["Todos", "Tinto", "Blanco", "Rosado", "Cava", "Champagne", "Naranja", "Otro"];

export default function ShowcasePage() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [filteredWines, setFilteredWines] = useState<Wine[]>([]);
  
  // Filtering & Sorting states
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "rating-desc" | "rating-asc">("date-desc");

  // Selection states
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Fetch wines from Firestore (Real-time updates)
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "wines"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const winesList: Wine[] = [];
        snapshot.forEach((doc) => {
          winesList.push({ id: doc.id, ...doc.data() } as Wine);
        });
        setWines(winesList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching wines:", error);
        setToastMessage("Error al cargar los vinos.");
        setToastType("error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter and sort wines when states change
  useEffect(() => {
    let result = [...wines];

    // 1. Filter by search input
    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (wine) =>
          wine.name.toLowerCase().includes(searchLower) ||
          wine.winery.toLowerCase().includes(searchLower) ||
          wine.restaurant.toLowerCase().includes(searchLower) ||
          (wine.grapes && wine.grapes.toLowerCase().includes(searchLower)) ||
          (wine.notes && wine.notes.toLowerCase().includes(searchLower)) ||
          (wine.event && wine.event.toLowerCase().includes(searchLower))
      );
    }

    // 2. Filter by type pill
    if (selectedType !== "Todos") {
      result = result.filter((wine) => wine.type === selectedType);
    }

    // 3. Apply sorting
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "rating-desc") {
        return b.rating - a.rating;
      }
      if (sortBy === "rating-asc") {
        return a.rating - b.rating;
      }
      return 0;
    });

    setFilteredWines(result);
  }, [wines, search, selectedType, sortBy]);

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const handleWineDeleted = () => {
    triggerToast("Registro de vino eliminado correctamente.", "success");
  };

  return (
    <div className="container">
      {/* Toast Alert */}
      <div className={`toast ${toastMessage ? "show" : ""} ${toastType}`}>
        <span>{toastMessage}</span>
      </div>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 className="page-title">El Corcho Guardado</h1>
        <p className="page-subtitle">Nuestra vitrina de recuerdos compartidos</p>
      </div>

      {/* Warning if Firebase is not setup */}
      {!isFirebaseConfigured && (
        <div className="glass" style={{ padding: "24px", marginBottom: "24px", textAlign: "center" }}>
          <Info size={36} style={{ color: "var(--cork-base)", marginBottom: "12px" }} />
          <h3 style={{ marginBottom: "8px" }}>¡Bienvenido a El Corcho Guardado!</h3>
          <p style={{ fontSize: "0.9rem", marginBottom: "16px" }}>
            Para ver y registrar tus vinos, primero debes vincular tu proyecto de Firebase.
          </p>
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px", fontSize: "0.8rem", textAlign: "left", lineHeight: 1.5 }}>
            <p style={{ fontWeight: 600, color: "var(--cork-base)", marginBottom: "4px" }}>Instrucciones rápidas:</p>
            1. Abre el archivo <code>.env.local</code> en la raíz del proyecto.<br />
            2. Introduce tus claves de Firebase Firestore y Storage.<br />
            3. Guarda el archivo y reinicia el servidor de desarrollo.
          </div>
        </div>
      )}

      {isFirebaseConfigured && (
        <>
          {/* Search Bar & Sort Dropdown */}
          <div className="search-wrapper">
            <div className="search-input-container">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar vino, bodega, rinconcito, evento..."
                className="form-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <select
                className="form-select"
                style={{ paddingRight: "30px", fontSize: "0.85rem", width: "auto" }}
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Recientes primero</option>
                <option value="date-asc">Antiguos primero</option>
                <option value="rating-desc">Mejor valorados</option>
                <option value="rating-asc">Peor valorados</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="filter-pills">
            {WINE_TYPES.map((type) => (
              <button
                key={type}
                className={`filter-pill ${selectedType === type ? "active" : ""}`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "var(--text-muted)" }}>Descorchando la vitrina...</p>
            </div>
          ) : filteredWines.length > 0 ? (
            /* Wines list */
            <div className="wines-grid">
              {filteredWines.map((wine) => (
                <WineCard
                  key={wine.id}
                  wine={wine}
                  onClick={() => setSelectedWine(wine)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="empty-state glass">
              <WineIcon size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">No hay vinos</h3>
              <p className="empty-state-desc">
                {search || selectedType !== "Todos"
                  ? "Ningún vino coincide con los filtros aplicados actualmente."
                  : "Aún no habéis registrado ningún vino. ¡Id a algún rinconcito y descorchad una botella!"}
              </p>
              {!search && selectedType === "Todos" && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--cork-base)", fontSize: "0.85rem", fontStyle: "italic" }}>
                  <Sparkles size={14} />
                  <span>Accede para empezar a registrar.</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Wine Details Modal */}
      {selectedWine && (
        <WineDetailsModal
          wine={selectedWine}
          onClose={() => setSelectedWine(null)}
          onDeleted={handleWineDeleted}
        />
      )}
    </div>
  );
}
