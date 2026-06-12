package service

import (
	"context"
	"fmt"

	"commercial-scout/internal/domain"
)

type TaskService struct {
	taskRepo domain.TaskRepository
	commRepo domain.CommunicationRepository
}

func NewTaskService(taskRepo domain.TaskRepository, commRepo domain.CommunicationRepository) *TaskService {
	return &TaskService{
		taskRepo: taskRepo,
		commRepo: commRepo,
	}
}

func (s *TaskService) CreateTask(ctx context.Context, t *domain.Task) error {
	if err := s.taskRepo.Create(ctx, t); err != nil {
		return err
	}

	// Create communication log
	comm := &domain.Communication{
		CompanyID: t.CompanyID,
		Type:      "system",
		Content:   fmt.Sprintf("Создана новая задача менеджером: %s", t.Title),
	}
	_ = s.commRepo.Create(ctx, comm)

	return nil
}

func (s *TaskService) UpdateStatus(ctx context.Context, id string, status string) (*domain.Task, error) {
	t, err := s.taskRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("task not found: %w", err)
	}

	oldStatus := t.Status
	t.Status = status

	if err := s.taskRepo.UpdateStatus(ctx, id, status); err != nil {
		return nil, fmt.Errorf("failed to update status in DB: %w", err)
	}

	// Log status change in communication history
	comm := &domain.Communication{
		CompanyID: t.CompanyID,
		Type:      "manager",
		Content:   fmt.Sprintf("Менеджер изменил статус задачи «%s» с «%s» на «%s».", t.Title, oldStatus, status),
	}
	_ = s.commRepo.Create(ctx, comm)

	return t, nil
}
