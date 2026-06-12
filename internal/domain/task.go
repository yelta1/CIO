package domain

import (
	"context"
	"time"
)

// Task represents a pipeline activity for a sales manager.
type Task struct {
	ID          string     `json:"id"`
	CompanyID   string     `json:"company_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"` // 'new', 'in_progress', 'closed'
	DueDate     *time.Time `json:"due_date,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// TaskRepository defines database operations for tasks.
type TaskRepository interface {
	Create(ctx context.Context, task *Task) error
	UpdateStatus(ctx context.Context, id string, status string) error
	ListByCompanyID(ctx context.Context, companyID string) ([]*Task, error)
	GetByID(ctx context.Context, id string) (*Task, error)
}

// TaskService defines business actions on tasks.
type TaskService interface {
	CreateTask(ctx context.Context, task *Task) error
	UpdateStatus(ctx context.Context, id string, status string) (*Task, error)
}
