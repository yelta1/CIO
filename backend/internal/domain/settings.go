package domain

import (
	"context"
)

// ScoutConfig represents system-wide config parameters for crawlers and qualification rules.
type ScoutConfig struct {
	MinScoringThreshold int      `json:"min_scoring_threshold"`
	EnabledSources      []string `json:"enabled_sources"`
	DefaultSearchRegion string   `json:"default_search_region"`
}

// SettingsRepository defines database operations to load/save settings.
type SettingsRepository interface {
	GetConfig(ctx context.Context) (*ScoutConfig, error)
	SaveConfig(ctx context.Context, config *ScoutConfig) error
}

// SettingsService defines business operations to configure scout behaviors.
type SettingsService interface {
	GetConfig(ctx context.Context) (*ScoutConfig, error)
	SaveConfig(ctx context.Context, config *ScoutConfig) error
}
