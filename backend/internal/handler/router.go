package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Handlers struct {
	CompanyHandler  *CompanyHandler
	TaskHandler     *TaskHandler
	AuthHandler     *AuthHandler
	SettingsHandler *SettingsHandler
}

func NewRouter(h *Handlers, authMW *AuthMiddleware) http.Handler {
	r := chi.NewRouter()

	// Base middlewares
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	// API Routes
	r.Route("/api", func(r chi.Router) {
		// Public Routes
		r.Post("/auth/login", h.AuthHandler.Login)

		// Protected Routes (requires valid JWT token)
		r.Group(func(r chi.Router) {
			r.Use(authMW.RequireAuth)

			r.Get("/auth/me", h.AuthHandler.Me)
			r.Post("/scout/run", h.CompanyHandler.RunScout)
			r.Get("/leads", h.CompanyHandler.ListLeads)
			r.Get("/companies/{id}", h.CompanyHandler.GetCompany)
			r.Post("/companies/{id}/proposal", h.CompanyHandler.GenerateProposal)

			r.Put("/tasks/{id}/status", h.TaskHandler.UpdateTaskStatus)

			// Settings endpoints (Read is for any authenticated user, Write is AdminOnly)
			r.Get("/settings", h.SettingsHandler.GetSettings)
			
			r.Group(func(r chi.Router) {
				r.Use(authMW.AdminOnly)
				r.Put("/settings", h.SettingsHandler.SaveSettings)
			})
		})
	})

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
