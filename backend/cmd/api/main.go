package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"commercial-scout/internal/domain"
	"commercial-scout/internal/handler"
	"commercial-scout/internal/repository/postgres"
	"commercial-scout/internal/service"
	"commercial-scout/pkg/db"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load environment variables (optional)
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:aspan@localhost:5432/postgres?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "scout-secret-key-12345"
	}

	log.Printf("Connecting to database at: %s", dbURL)
	database, err := db.ConnectDB(dbURL)
	if err != nil {
		log.Fatalf("Database connection/migration failed: %v", err)
	}
	defer database.Close()

	log.Println("Database connection established and migrations checked successfully.")

	// Repositories
	companyRepo := postgres.NewCompanyRepository(database)
	taskRepo := postgres.NewTaskRepository(database)
	commRepo := postgres.NewCommunicationRepository(database)
	userRepo := postgres.NewUserRepository(database)
	settingsRepo := postgres.NewSettingsRepository(database)

	// Services & LLM Analyzer
	llmAnalyzer := service.NewMockLLMAnalyzer()
	scoutService := service.NewScoutService(companyRepo, taskRepo, commRepo, llmAnalyzer)
	taskService := service.NewTaskService(taskRepo, commRepo)
	authService := service.NewAuthService(userRepo, jwtSecret)
	settingsService := service.NewSettingsService(settingsRepo)

	// Seed database companies if empty
	seedIfEmpty(database, companyRepo, taskRepo, commRepo)

	// Seed users if empty
	seedUsersIfEmpty(database, userRepo)

	// Middlewares & Router
	authMW := handler.NewAuthMiddleware(authService)
	handlers := &handler.Handlers{
		CompanyHandler:  handler.NewCompanyHandler(scoutService, llmAnalyzer),
		TaskHandler:     handler.NewTaskHandler(taskService),
		AuthHandler:     handler.NewAuthHandler(authService),
		SettingsHandler: handler.NewSettingsHandler(settingsService),
	}

	router := handler.NewRouter(handlers, authMW)

	serverAddr := fmt.Sprintf(":%s", port)
	log.Printf("Starting Commercial Scout Server on http://localhost%s", serverAddr)
	if err := http.ListenAndServe(serverAddr, router); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}

func seedUsersIfEmpty(database *sql.DB, userRepo domain.UserRepository) {
	var count int
	err := database.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		log.Printf("Failed to count users for seeding: %v", err)
		return
	}

	if count > 0 {
		log.Println("Users table already contains operator profiles. Skipping seeding.")
		return
	}

	log.Println("Users table is empty. Seeding default operators (admin / manager)...")

	ctx := context.Background()

	// Seed Admin User
	adminHash, err := bcrypt.GenerateFromPassword([]byte("adminpassword"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to bcrypt admin password: %v", err)
		return
	}
	adminUser := &domain.User{
		Username:     "admin",
		PasswordHash: string(adminHash),
		Role:         "admin",
	}
	if err := userRepo.Create(ctx, adminUser); err != nil {
		log.Printf("Failed to create admin operator: %v", err)
	}

	// Seed Manager User
	managerHash, err := bcrypt.GenerateFromPassword([]byte("managerpassword"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to bcrypt manager password: %v", err)
		return
	}
	managerUser := &domain.User{
		Username:     "manager",
		PasswordHash: string(managerHash),
		Role:         "manager",
	}
	if err := userRepo.Create(ctx, managerUser); err != nil {
		log.Printf("Failed to create manager operator: %v", err)
	}

	log.Println("Default operators seeded successfully: admin (adminpassword), manager (managerpassword).")
}

func seedIfEmpty(
	database *sql.DB,
	companyRepo domain.CompanyRepository,
	taskRepo domain.TaskRepository,
	commRepo domain.CommunicationRepository,
) {
	var count int
	err := database.QueryRow("SELECT COUNT(*) FROM companies").Scan(&count)
	if err != nil {
		log.Printf("Failed to count companies for seeding: %v", err)
		return
	}

	if count > 0 {
		log.Println("Database already contains lead profiles. Skipping company seeding.")
		return
	}

	log.Println("Database is empty. Seeding demo companies (clients & suppliers)...")

	// Sample Clients
	clients := []*domain.Company{
		{
			Name:     "Kaspi Shop Electro",
			Type:     "client",
			Category: "E-commerce",
			Website:  "https://kaspishop-electro.kz",
			Region:   "Almaty",
			Contacts: domain.ContactInfo{
				Email:     "sales@kaspishop-electro.kz",
				Phone:     "+7 727 123 4567",
				WhatsApp:  "+7 777 555 1122",
				Instagram: "@kaspi_electro",
			},
		},
		{
			Name:     "Sulpak Retail Pavlodar",
			Type:     "client",
			Category: "Retail",
			Website:  "https://sulpak.kz",
			Region:   "Pavlodar",
			Contacts: domain.ContactInfo{
				Email:     "pavlodar@sulpak.kz",
				Phone:     "+7 718 299 8877",
				WhatsApp:  "+7 705 333 4455",
				Instagram: "@sulpak_pavlodar",
			},
		},
		{
			Name:     "InstaTrend Gadgets",
			Type:     "client",
			Category: "Instagram-shop",
			Website:  "https://instagram.com/instatrend_kz",
			Region:   "Shymkent",
			Contacts: domain.ContactInfo{
				Email:     "instatrend.info@gmail.com",
				Phone:     "+7 747 888 2233",
				WhatsApp:  "+7 747 888 2233",
				Instagram: "@instatrend_kz",
			},
		},
	}

	// Sample Suppliers (Manufacturers)
	suppliers := []*domain.Company{
		{
			Name:     "Guangdong Plastics & Cables Factory",
			Type:     "supplier",
			Category: "Accessories",
			Website:  "http://guangdong-cables-factory.com",
			Region:   "China",
			Contacts: domain.ContactInfo{
				Email:     "export-sales@guangdongcables.com",
				Phone:     "+86 20 8765 4321",
				WhatsApp:  "+86 138 2222 3333",
				Instagram: "@gd_cable_factory",
			},
		},
		{
			Name:     "Shenzhen Audio & Acoustics Co",
			Type:     "supplier",
			Category: "Acoustics",
			Website:  "https://sz-audioacoustics.com",
			Region:   "China",
			Contacts: domain.ContactInfo{
				Email:     "info@sz-audioacoustics.com",
				Phone:     "+86 755 4444 8888",
				WhatsApp:  "+86 139 5555 6666",
				Instagram: "@sz_audio_factory",
			},
		},
	}

	ctx := context.Background()

	// Helper to insert and evaluate
	insertLead := func(c *domain.Company, score int, gaps []string, rec string) {
		err := companyRepo.Create(ctx, c)
		if err != nil {
			log.Printf("Seeding: failed to save company %s: %v", c.Name, err)
			return
		}

		analysis := &domain.AnalysisResult{
			CompanyID:       c.ID,
			Scoring:         score,
			Gaps:            gaps,
			Recommendations: rec,
		}
		err = companyRepo.SaveAnalysis(ctx, analysis)
		if err != nil {
			log.Printf("Seeding: failed to save analysis for %s: %v", c.Name, err)
			return
		}

		// Initial task
		taskTitle := "Первый контакт и презентация"
		taskDesc := "Подготовить коммерческое предложение с индивидуальными ценами под их товарные дефициты и начать диалог."
		if c.Type == "supplier" {
			taskTitle = "Переговоры по условиям доставки тестовой партии"
			taskDesc = "Запросить стоимость доставки образцов и сетку скидок в зависимости от объема партии (MOQ)."
		}

		task := &domain.Task{
			CompanyID:   c.ID,
			Title:       taskTitle,
			Description: taskDesc,
			Status:      "new",
		}
		_ = taskRepo.Create(ctx, task)

		// Initial communication log
		comm := &domain.Communication{
			CompanyID: c.ID,
			Type:      "system",
			Content:   fmt.Sprintf("Первоначальное обнаружение в базе. Компания классифицирована как %s. Присвоен скоринг: %d/10.", c.Type, score),
		}
		_ = commRepo.Create(ctx, comm)
	}

	// Insert Clients
	insertLead(clients[0], 9, []string{
		"Нет поддержки оплаты Apple Pay/Google Pay",
		"Пробелы в ассортименте игровых аксессуаров (механические клавиатуры, коврики для мыши)",
	}, "Презентовать интеграцию локального платежного шлюза и прайс на игровые клавиатуры Redragon.")

	insertLead(clients[1], 6, []string{
		"Каталог на сайте содержит много отсутствующих позиций (нет в наличии)",
		"Слабый складской запас умных розеток и лампочек в филиале в Павлодаре",
	}, "Предоставить B2B-каталог с акцентом на категорию умного дома и быструю доставку в Павлодар.")

	insertLead(clients[2], 8, []string{
		"Медленные ответы на запросы в WhatsApp (средняя задержка составляет 3 часа)",
		"Отсутствуют магнитные беспроводные повербанки для iPhone (MagSafe)",
	}, "Предложить интеграцию сервиса автоответов. Поделиться оптовым прайс-листом на повербанки MagSafe.")

	// Insert Suppliers
	insertLead(suppliers[0], 9, []string{
		"Нет эксклюзивного официального дистрибьютора в регионе Центральной Азии",
		"Требуется высокий первоначальный депозит для старта (50% предоплата по TT)",
	}, "Подготовить письмо-запрос для обсуждения эксклюзивного договора дистрибуции аксессуаров в Казахстане.")

	insertLead(suppliers[1], 7, []string{
		"Минимальный объем заказа (MOQ) начинается от 2000 единиц на один цвет SKU",
		"Инструкции и интерфейс приложения доступны только на английском и китайском языках",
	}, "Договориться о снижении лимитов для первого тестового заказа (например, до 500 единиц) для проверки рынка Казахстана.")

	log.Println("Database successfully seeded with 3 clients and 2 suppliers.")
}
