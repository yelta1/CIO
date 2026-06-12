package handler

import (
	"encoding/json"
	"net/http"

	"commercial-scout/internal/domain"
)

type SettingsHandler struct {
	settingsService domain.SettingsService
}

func NewSettingsHandler(ss domain.SettingsService) *SettingsHandler {
	return &SettingsHandler{settingsService: ss}
}

// GetSettings loads configuration values from database.
func (h *SettingsHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	config, err := h.settingsService.GetConfig(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(config)
}

// SaveSettings upserts configuration rules.
func (h *SettingsHandler) SaveSettings(w http.ResponseWriter, r *http.Request) {
	var config domain.ScoutConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.settingsService.SaveConfig(r.Context(), &config)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(config)
}
