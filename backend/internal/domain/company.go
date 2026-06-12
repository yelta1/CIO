package domain

import (
	"context"
	"encoding/json"
	"time"
)

// Company represents a commercial entity which can be a customer client or supplier manufacturer.
type Company struct {
	ID             string             `json:"id"`
	Name           string             `json:"name"`
	Type           string             `json:"type"` // 'client' or 'supplier'
	Category       string             `json:"category"`
	Website        string             `json:"website"`
	Contacts       ContactInfo        `json:"contacts"`
	Region         string             `json:"region"`
	CreatedAt      time.Time          `json:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at"`
	Analysis       *AnalysisResult    `json:"analysis,omitempty"`
	Tasks          []*Task            `json:"tasks,omitempty"`
	Communications []*Communication   `json:"communications,omitempty"`
}

// ContactInfo stores open contact details parsed from open sources.
type ContactInfo struct {
	Email     string `json:"email,omitempty"`
	Phone     string `json:"phone,omitempty"`
	WhatsApp  string `json:"whatsapp,omitempty"`
	Instagram string `json:"instagram,omitempty"`
}

// Scan database JSONB into ContactInfo
func (c *ContactInfo) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return json.Unmarshal([]byte(value.(string)), c)
	}
	return json.Unmarshal(bytes, c)
}

// Value serializes ContactInfo to JSONB
func (c ContactInfo) Value() (interface{}, error) {
	return json.Marshal(c)
}

// AnalysisResult stores the automated scoring, gaps, and recommendations.
type AnalysisResult struct {
	ID              string    `json:"id"`
	CompanyID       string    `json:"company_id"`
	Scoring         int       `json:"scoring"` // 1 to 10
	Gaps            []string  `json:"gaps"`    // e.g. ["Missing brand X", "No active site"]
	Recommendations string    `json:"recommendations"`
	AnalyzedAt      time.Time `json:"analyzed_at"`
}

// CompanyFilter contains criteria for filtering list queries.
type CompanyFilter struct {
	Type       string // 'client' or 'supplier'
	MinScoring int
	Category   string
}

// CompanyRepository defines database operations for companies and analyses.
type CompanyRepository interface {
	Create(ctx context.Context, company *Company) error
	GetByID(ctx context.Context, id string) (*Company, error)
	List(ctx context.Context, filter CompanyFilter) ([]*Company, error)
	Update(ctx context.Context, company *Company) error
	SaveAnalysis(ctx context.Context, analysis *AnalysisResult) error
}

// ScoutService defines business logic orchestration for Lead/Company Scouting.
type ScoutService interface {
	TriggerScout(ctx context.Context, category, region string) (string, error)
	ListLeads(ctx context.Context, filter CompanyFilter) ([]*Company, error)
	GetCompanyDetail(ctx context.Context, id string) (*Company, error)
}
