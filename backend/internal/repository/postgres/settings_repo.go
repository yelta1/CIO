package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"commercial-scout/internal/domain"
)

const configKey = "scout_config"

type SettingsRepository struct {
	db *sql.DB
}

func NewSettingsRepository(db *sql.DB) *SettingsRepository {
	return &SettingsRepository{db: db}
}

func (r *SettingsRepository) GetConfig(ctx context.Context) (*domain.ScoutConfig, error) {
	query := `SELECT value FROM system_settings WHERE key = $1`
	var valBytes []byte
	err := r.db.QueryRowContext(ctx, query, configKey).Scan(&valBytes)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Return default configuration if empty
			return &domain.ScoutConfig{
				MinScoringThreshold: 7,
				EnabledSources:      []string{"Kaspi", "2GIS", "Instagram"},
				DefaultSearchRegion: "Almaty",
			}, nil
		}
		return nil, fmt.Errorf("failed to fetch settings: %w", err)
	}

	var config domain.ScoutConfig
	if err := json.Unmarshal(valBytes, &config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal settings json: %w", err)
	}

	return &config, nil
}

func (r *SettingsRepository) SaveConfig(ctx context.Context, config *domain.ScoutConfig) error {
	valBytes, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal settings json: %w", err)
	}

	query := `
		INSERT INTO system_settings (key, value, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (key) DO UPDATE
		SET value = EXCLUDED.value, updated_at = NOW()
	`
	_, err = r.db.ExecContext(ctx, query, configKey, valBytes)
	if err != nil {
		return fmt.Errorf("failed to upsert settings: %w", err)
	}

	return nil
}
