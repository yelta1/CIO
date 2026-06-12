package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"commercial-scout/internal/domain"
)

type TaskRepository struct {
	db *sql.DB
}

func NewTaskRepository(db *sql.DB) *TaskRepository {
	return &TaskRepository{db: db}
}

func (r *TaskRepository) Create(ctx context.Context, t *domain.Task) error {
	query := `
		INSERT INTO tasks (company_id, title, description, status, due_date, created_at, updated_at)
		VALUES ($1, $2, $3, COALESCE(NULLIF($4, ''), 'new'), $5, NOW(), NOW())
		RETURNING id, status, created_at, updated_at
	`
	err := r.db.QueryRowContext(ctx, query, t.CompanyID, t.Title, t.Description, t.Status, t.DueDate).
		Scan(&t.ID, &t.Status, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert task: %w", err)
	}
	return nil
}

func (r *TaskRepository) GetByID(ctx context.Context, id string) (*domain.Task, error) {
	query := `
		SELECT id, company_id, title, description, status, due_date, created_at, updated_at
		FROM tasks
		WHERE id = $1
	`
	row := r.db.QueryRowContext(ctx, query, id)

	var t domain.Task
	err := row.Scan(&t.ID, &t.CompanyID, &t.Title, &t.Description, &t.Status, &t.DueDate, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("task not found: %w", err)
		}
		return nil, fmt.Errorf("failed to scan task: %w", err)
	}
	return &t, nil
}

func (r *TaskRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	query := `
		UPDATE tasks
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`
	res, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update task status: %w", err)
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("task not found: status update had no effect")
	}

	return nil
}

func (r *TaskRepository) ListByCompanyID(ctx context.Context, companyID string) ([]*domain.Task, error) {
	query := `
		SELECT id, company_id, title, description, status, due_date, created_at, updated_at
		FROM tasks
		WHERE company_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query tasks: %w", err)
	}
	defer rows.Close()

	var tasks []*domain.Task
	for rows.Next() {
		var t domain.Task
		err := rows.Scan(&t.ID, &t.CompanyID, &t.Title, &t.Description, &t.Status, &t.DueDate, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan task row: %w", err)
		}
		tasks = append(tasks, &t)
	}
	return tasks, nil
}
