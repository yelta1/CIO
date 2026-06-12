package domain

import (
	"context"
	"time"
)

// Communication represents a log of a customer contact event.
type Communication struct {
	ID        string    `json:"id"`
	CompanyID string    `json:"company_id"`
	Type      string    `json:"type"` // 'email', 'phone', 'whatsapp', 'instagram'
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// CommunicationRepository defines database operations for communications history.
type CommunicationRepository interface {
	Create(ctx context.Context, comm *Communication) error
	ListByCompanyID(ctx context.Context, companyID string) ([]*Communication, error)
}
