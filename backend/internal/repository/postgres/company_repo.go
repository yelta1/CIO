package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"commercial-scout/internal/domain"
	"github.com/lib/pq"
)

type CompanyRepository struct {
	db *sql.DB
}

func NewCompanyRepository(db *sql.DB) *CompanyRepository {
	return &CompanyRepository{db: db}
}

func (r *CompanyRepository) Create(ctx context.Context, c *domain.Company) error {
	query := `
		INSERT INTO companies (name, type, category, website, contacts, region, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	contactsJSON, err := json.Marshal(c.Contacts)
	if err != nil {
		return fmt.Errorf("failed to marshal contacts: %w", err)
	}

	err = r.db.QueryRowContext(ctx, query, c.Name, c.Type, c.Category, c.Website, contactsJSON, c.Region).
		Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert company: %w", err)
	}
	return nil
}

func (r *CompanyRepository) GetByID(ctx context.Context, id string) (*domain.Company, error) {
	query := `
		SELECT c.id, c.name, c.type, c.category, c.website, c.contacts, c.region, c.created_at, c.updated_at,
		       a.id, a.scoring, a.gaps, a.recommendations, a.analyzed_at
		FROM companies c
		LEFT JOIN analysis_results a ON c.id = a.company_id
		WHERE c.id = $1
	`
	row := r.db.QueryRowContext(ctx, query, id)

	var c domain.Company
	var contactsRaw []byte
	var analysisID sql.NullString
	var analysisScoring sql.NullInt32
	var analysisGaps []string
	var analysisRecs sql.NullString
	var analysisTime sql.NullTime

	err := row.Scan(
		&c.ID, &c.Name, &c.Type, &c.Category, &c.Website, &contactsRaw, &c.Region, &c.CreatedAt, &c.UpdatedAt,
		&analysisID, &analysisScoring, pq.Array(&analysisGaps), &analysisRecs, &analysisTime,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("company not found: %w", err)
		}
		return nil, fmt.Errorf("failed to scan company: %w", err)
	}

	if err := json.Unmarshal(contactsRaw, &c.Contacts); err != nil {
		return nil, fmt.Errorf("failed to unmarshal contacts: %w", err)
	}

	if analysisID.Valid {
		c.Analysis = &domain.AnalysisResult{
			ID:              analysisID.String,
			CompanyID:       c.ID,
			Scoring:         int(analysisScoring.Int32),
			Gaps:            analysisGaps,
			Recommendations: analysisRecs.String,
			AnalyzedAt:      analysisTime.Time,
		}
	}

	return &c, nil
}

func (r *CompanyRepository) List(ctx context.Context, filter domain.CompanyFilter) ([]*domain.Company, error) {
	query := `
		SELECT c.id, c.name, c.type, c.category, c.website, c.contacts, c.region, c.created_at, c.updated_at,
		       a.id, a.scoring, a.gaps, a.recommendations, a.analyzed_at
		FROM companies c
		LEFT JOIN analysis_results a ON c.id = a.company_id
		WHERE 1=1
	`
	var args []interface{}
	argCount := 1

	if filter.Type != "" {
		query += fmt.Sprintf(" AND c.type = $%d", argCount)
		args = append(args, filter.Type)
		argCount++
	}

	if filter.Category != "" {
		query += fmt.Sprintf(" AND c.category = $%d", argCount)
		args = append(args, filter.Category)
		argCount++
	}

	if filter.MinScoring > 0 {
		query += fmt.Sprintf(" AND a.scoring >= $%d", argCount)
		args = append(args, filter.MinScoring)
		argCount++
	}

	query += " ORDER BY c.created_at DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query companies list: %w", err)
	}
	defer rows.Close()

	var companies []*domain.Company
	for rows.Next() {
		var c domain.Company
		var contactsRaw []byte
		var analysisID sql.NullString
		var analysisScoring sql.NullInt32
		var analysisGaps []string
		var analysisRecs sql.NullString
		var analysisTime sql.NullTime

		err := rows.Scan(
			&c.ID, &c.Name, &c.Type, &c.Category, &c.Website, &contactsRaw, &c.Region, &c.CreatedAt, &c.UpdatedAt,
			&analysisID, &analysisScoring, pq.Array(&analysisGaps), &analysisRecs, &analysisTime,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan company row: %w", err)
		}

		if err := json.Unmarshal(contactsRaw, &c.Contacts); err != nil {
			return nil, fmt.Errorf("failed to unmarshal contacts: %w", err)
		}

		if analysisID.Valid {
			c.Analysis = &domain.AnalysisResult{
				ID:              analysisID.String,
				CompanyID:       c.ID,
				Scoring:         int(analysisScoring.Int32),
				Gaps:            analysisGaps,
				Recommendations: analysisRecs.String,
				AnalyzedAt:      analysisTime.Time,
			}
		}

		companies = append(companies, &c)
	}

	return companies, nil
}

func (r *CompanyRepository) Update(ctx context.Context, c *domain.Company) error {
	query := `
		UPDATE companies
		SET name = $1, type = $2, category = $3, website = $4, contacts = $5, region = $6, updated_at = NOW()
		WHERE id = $7
	`
	contactsJSON, err := json.Marshal(c.Contacts)
	if err != nil {
		return fmt.Errorf("failed to marshal contacts: %w", err)
	}

	_, err = r.db.ExecContext(ctx, query, c.Name, c.Type, c.Category, c.Website, contactsJSON, c.Region, c.ID)
	if err != nil {
		return fmt.Errorf("failed to update company: %w", err)
	}
	return nil
}

func (r *CompanyRepository) SaveAnalysis(ctx context.Context, a *domain.AnalysisResult) error {
	// Delete any existing analysis for this company to maintain 1-to-1 latest analysis relationship
	deleteQuery := `DELETE FROM analysis_results WHERE company_id = $1`
	_, _ = r.db.ExecContext(ctx, deleteQuery, a.CompanyID)

	insertQuery := `
		INSERT INTO analysis_results (company_id, scoring, gaps, recommendations, analyzed_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, analyzed_at
	`
	err := r.db.QueryRowContext(ctx, insertQuery, a.CompanyID, a.Scoring, pq.Array(a.Gaps), a.Recommendations).
		Scan(&a.ID, &a.AnalyzedAt)
	if err != nil {
		return fmt.Errorf("failed to insert analysis result: %w", err)
	}
	return nil
}
