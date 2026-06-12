package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"commercial-scout/internal/domain"
)

type CommunicationRepository struct {
	db *sql.DB
}

func NewCommunicationRepository(db *sql.DB) *CommunicationRepository {
	return &CommunicationRepository{db: db}
}

func (r *CommunicationRepository) Create(ctx context.Context, c *domain.Communication) error {
	query := `
		INSERT INTO communications (company_id, type, content, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id, created_at
	`
	err := r.db.QueryRowContext(ctx, query, c.CompanyID, c.Type, c.Content).
		Scan(&c.ID, &c.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert communication: %w", err)
	}
	return nil
}

func (r *CommunicationRepository) ListByCompanyID(ctx context.Context, companyID string) ([]*domain.Communication, error) {
	query := `
		SELECT id, company_id, type, content, created_at
		FROM communications
		WHERE company_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query communications: %w", err)
	}
	defer rows.Close()

	var comms []*domain.Communication
	for rows.Next() {
		var c domain.Communication
		err := rows.Scan(&c.ID, &c.CompanyID, &c.Type, &c.Content, &c.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan communication row: %w", err)
		}
		comms = append(comms, &c)
	}
	return comms, nil
}
