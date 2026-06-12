package service

import (
	"context"

	"commercial-scout/internal/domain"
)

type SettingsService struct {
	repo domain.SettingsRepository
}

func NewSettingsService(repo domain.SettingsRepository) *SettingsService {
	return &SettingsService{repo: repo}
}

func (s *SettingsService) GetConfig(ctx context.Context) (*domain.ScoutConfig, error) {
	return s.repo.GetConfig(ctx)
}

func (s *SettingsService) SaveConfig(ctx context.Context, config *domain.ScoutConfig) error {
	return s.repo.SaveConfig(ctx, config)
}
