package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"commercial-scout/internal/domain"
)

type ScoutService struct {
	companyRepo   domain.CompanyRepository
	taskRepo      domain.TaskRepository
	commRepo      domain.CommunicationRepository
	llmAnalyzer   domain.LLMAnalyzer
}

func NewScoutService(
	companyRepo domain.CompanyRepository,
	taskRepo domain.TaskRepository,
	commRepo domain.CommunicationRepository,
	llmAnalyzer domain.LLMAnalyzer,
) *ScoutService {
	return &ScoutService{
		companyRepo: companyRepo,
		taskRepo:    taskRepo,
		commRepo:    commRepo,
		llmAnalyzer: llmAnalyzer,
	}
}

func (s *ScoutService) TriggerScout(ctx context.Context, category, region string) (string, error) {
	jobID := fmt.Sprintf("job-%d", time.Now().Unix())

	if category == "" {
		category = "General Electronics"
	}
	if region == "" {
		region = "Kazakhstan"
	}

	// Run in background to simulate an async crawler
	go func() {
		// Create a detached context for background processing
		bgCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		time.Sleep(2 * time.Second) // Simulate network delay of scraping

		var leadsToInsert []*domain.Company

		// If category contains "supplier" or we run a general scout, generate both
		isSupplierSearch := strings.Contains(strings.ToLower(category), "supplier") || strings.Contains(strings.ToLower(category), "поставщик")

		if isSupplierSearch {
			leadsToInsert = []*domain.Company{
				{
					Name:     "Shenzhen Electro Manufacturing Corp",
					Type:     "supplier",
					Category: "Accessories",
					Website:  "https://shenzhen-electro.com",
					Region:   "China",
					Contacts: domain.ContactInfo{
						Email:     "export@sz-electro.com",
						Phone:     "+86 755 8888 9999",
						WhatsApp:  "+86 755 8888 9999",
						Instagram: "@shenzhen_electro",
					},
				},
				{
					Name:     "Seoul Audio Labs Ltd",
					Type:     "supplier",
					Category: "Acoustics",
					Website:  "https://seoul-audio-labs.co.kr",
					Region:   "South Korea",
					Contacts: domain.ContactInfo{
						Email:     "sales@seoulaudio.kr",
						Phone:     "+82 2 123 4567",
						WhatsApp:  "+82 10 9876 5432",
						Instagram: "@seoulaudiolabs",
					},
				},
			}
		} else {
			// Generate Clients
			leadsToInsert = []*domain.Company{
				{
					Name:     "TechStore Almaty",
					Type:     "client",
					Category: "E-commerce",
					Website:  "https://techstore.kz",
					Region:   region,
					Contacts: domain.ContactInfo{
						Email:     "info@techstore.kz",
						Phone:     "+7 727 333 4455",
						WhatsApp:  "+7 701 777 8899",
						Instagram: "@techstore.kz",
					},
				},
				{
					Name:     "Gadget Point Astana",
					Type:     "client",
					Category: "Retail",
					Website:  "https://gadgetpoint.kz",
					Region:   region,
					Contacts: domain.ContactInfo{
						Email:     "sales@gadgetpoint.kz",
						Phone:     "+7 717 255 6677",
						WhatsApp:  "+7 702 444 5566",
						Instagram: "@gadgetpoint_astana",
					},
				},
				{
					Name:     "Smart Apple Shop",
					Type:     "client",
					Category: "Instagram-shop",
					Website:  "https://instagram.com/smart_apple_shop",
					Region:   region,
					Contacts: domain.ContactInfo{
						Email:     "smartapple@gmail.com",
						Phone:     "+7 777 999 1122",
						WhatsApp:  "+7 777 999 1122",
						Instagram: "@smart_apple_shop",
					},
				},
			}
		}

		for _, lead := range leadsToInsert {
			// Save company
			err := s.companyRepo.Create(bgCtx, lead)
			if err != nil {
				log.Printf("[Scout Job %s] Failed to save company %s: %v", jobID, lead.Name, err)
				continue
			}

			// Run LLM analysis
			analysis, err := s.llmAnalyzer.AnalyzeCompany(bgCtx, lead)
			if err != nil {
				log.Printf("[Scout Job %s] Failed to analyze company %s: %v", jobID, lead.Name, err)
				continue
			}

			err = s.companyRepo.SaveAnalysis(bgCtx, analysis)
			if err != nil {
				log.Printf("[Scout Job %s] Failed to save analysis for %s: %v", jobID, lead.Name, err)
				continue
			}

			// Create initial follow-up task
			dueDate := time.Now().AddDate(0, 0, 7) // Due in 7 days
			taskTitle := "Первый контакт и подготовка предложения"
			taskDesc := "Подготовить черновик КП и связаться по WhatsApp/Email."
			if lead.Type == "supplier" {
				taskTitle = "Оценка условий поставок и переговоры по MOQ"
				taskDesc = "Связаться с экспортным отделом завода и запросить прайс-лист."
			}

			task := &domain.Task{
				CompanyID:   lead.ID,
				Title:       taskTitle,
				Description: taskDesc,
				Status:      "new",
				DueDate:     &dueDate,
			}
			err = s.taskRepo.Create(bgCtx, task)
			if err != nil {
				log.Printf("[Scout Job %s] Failed to create initial task for %s: %v", jobID, lead.Name, err)
			}

			// Save initial communication event
			comm := &domain.Communication{
				CompanyID: lead.ID,
				Type:      "system",
				Content:   fmt.Sprintf("Система успешно обнаружила сайт и контакты компании. Проведен AI-скоринг профиля с оценкой %d/10.", analysis.Scoring),
			}
			err = s.commRepo.Create(bgCtx, comm)
			if err != nil {
				log.Printf("[Scout Job %s] Failed to create system communication log for %s: %v", jobID, lead.Name, err)
			}
		}

		log.Printf("[Scout Job %s] Background scouting job finished. Discovered %d leads.", jobID, len(leadsToInsert))
	}()

	return jobID, nil
}

func (s *ScoutService) ListLeads(ctx context.Context, filter domain.CompanyFilter) ([]*domain.Company, error) {
	companies, err := s.companyRepo.List(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to load leads list: %w", err)
	}
	return companies, nil
}

func (s *ScoutService) GetCompanyDetail(ctx context.Context, id string) (*domain.Company, error) {
	company, err := s.companyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to find company detail: %w", err)
	}

	// Populate tasks
	tasks, err := s.taskRepo.ListByCompanyID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch tasks for company: %w", err)
	}
	company.Tasks = tasks

	// Populate communications
	comms, err := s.commRepo.ListByCompanyID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch communications for company: %w", err)
	}
	company.Communications = comms

	return company, nil
}
