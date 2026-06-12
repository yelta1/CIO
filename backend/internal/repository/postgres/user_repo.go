package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"commercial-scout/internal/domain"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, u *domain.User) error {
	query := `
		INSERT INTO users (username, password_hash, role, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id, created_at
	`
	err := r.db.QueryRowContext(ctx, query, u.Username, u.PasswordHash, u.Role).
		Scan(&u.ID, &u.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}
	return nil
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT id, username, password_hash, role, created_at
		FROM users
		WHERE username = $1
	`
	row := r.db.QueryRowContext(ctx, query, username)

	var u domain.User
	err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	query := `
		SELECT id, username, password_hash, role, created_at
		FROM users
		WHERE id = $1
	`
	row := r.db.QueryRowContext(ctx, query, id)

	var u domain.User
	err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}
	return &u, nil
}
