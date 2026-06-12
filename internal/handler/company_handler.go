package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"commercial-scout/internal/domain"
	"github.com/go-chi/chi/v5"
)

type CompanyHandler struct {
	scoutService domain.ScoutService
	llmAnalyzer  domain.LLMAnalyzer
}

func NewCompanyHandler(ss domain.ScoutService, la domain.LLMAnalyzer) *CompanyHandler {
	return &CompanyHandler{
		scoutService: ss,
		llmAnalyzer:  la,
	}
}

type runScoutRequest struct {
	Category string `json="category"`
	Region   string `json="region"`
}

func (h *CompanyHandler) RunScout(w http.ResponseWriter, r *http.Request) {
	var req runScoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	jobID, err := h.scoutService.TriggerScout(r.Context(), req.Category, req.Region)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": "Scouting and lead generation job successfully started",
		"job_id":  jobID,
	})
}

func (h *CompanyHandler) ListLeads(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	minScoringStr := q.Get("min_scoring")
	category := q.Get("category")
	companyType := q.Get("type")

	minScoring := 0
	if minScoringStr != "" {
		if val, err := strconv.Atoi(minScoringStr); err == nil {
			minScoring = val
		}
	}

	filter := domain.CompanyFilter{
		Type:       companyType,
		MinScoring: minScoring,
		Category:   category,
	}

	leads, err := h.scoutService.ListLeads(r.Context(), filter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(leads)
}

func (h *CompanyHandler) GetCompany(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "company ID is required", http.StatusBadRequest)
		return
	}

	company, err := h.scoutService.GetCompanyDetail(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(company)
}

func (h *CompanyHandler) GenerateProposal(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "company ID is required", http.StatusBadRequest)
		return
	}

	company, err := h.scoutService.GetCompanyDetail(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	if company.Analysis == nil {
		http.Error(w, "company does not have an active analysis record yet", http.StatusBadRequest)
		return
	}

	proposal, err := h.llmAnalyzer.GenerateOffer(r.Context(), company, company.Analysis)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"proposal": proposal,
	})
}
