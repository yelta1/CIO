package handler

import (
	"encoding/json"
	"net/http"

	"commercial-scout/internal/domain"
	"github.com/go-chi/chi/v5"
)

type TaskHandler struct {
	taskService domain.TaskService
}

func NewTaskHandler(ts domain.TaskService) *TaskHandler {
	return &TaskHandler{taskService: ts}
}

type updateTaskStatusRequest struct {
	Status string `json="status"`
}

func (h *TaskHandler) UpdateTaskStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "task ID is required", http.StatusBadRequest)
		return
	}

	var req updateTaskStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Status != "new" && req.Status != "in_progress" && req.Status != "closed" {
		http.Error(w, "invalid status; must be 'new', 'in_progress', or 'closed'", http.StatusBadRequest)
		return
	}

	task, err := h.taskService.UpdateStatus(r.Context(), id, req.Status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(task)
}
