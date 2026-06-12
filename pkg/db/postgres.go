package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/lib/pq"
)

// ConnectDB establishes a connection to PostgreSQL and runs all SQL migrations in the migrations folder.
func ConnectDB(connStr string) (*sql.DB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Read migration schema files
	migrationDir := "migrations"
	files, err := os.ReadDir(migrationDir)
	if err != nil {
		// Fallback for parent directories
		migrationDir = filepath.Join("..", "..", "migrations")
		files, err = os.ReadDir(migrationDir)
		if err != nil {
			return nil, fmt.Errorf("failed to read migrations directory: %w", err)
		}
	}

	var sqlFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".sql") {
			sqlFiles = append(sqlFiles, f.Name())
		}
	}
	sort.Strings(sqlFiles) // Run in sorted order (000001, 000002, etc.)

	for _, sqlFile := range sqlFiles {
		filePath := filepath.Join(migrationDir, sqlFile)
		schemaBytes, err := os.ReadFile(filePath)
		if err != nil {
			return nil, fmt.Errorf("failed to read migration file %s: %w", sqlFile, err)
		}

		// Run migration
		if _, err := db.Exec(string(schemaBytes)); err != nil {
			return nil, fmt.Errorf("failed to run migration %s: %w", sqlFile, err)
		}
	}

	return db, nil
}
