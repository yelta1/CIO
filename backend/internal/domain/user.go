package domain

import (
	"context"
	"time"
)

// User represents a system operator (admin or manager) authorized to access the scout CRM.
type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"` // Hidden from JSON serialization
	Role         string    `json:"role"` // 'admin' or 'manager'
	CreatedAt    time.Time `json:"created_at"`
}

// UserRepository defines database operations for users.
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByUsername(ctx context.Context, username string) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
}
