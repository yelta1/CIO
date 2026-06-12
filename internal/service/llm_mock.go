package service

import (
	"context"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"commercial-scout/internal/domain"
)

type MockLLMAnalyzer struct {
	rnd *rand.Rand
}

func NewMockLLMAnalyzer() *MockLLMAnalyzer {
	return &MockLLMAnalyzer{
		rnd: rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

func (m *MockLLMAnalyzer) AnalyzeCompany(ctx context.Context, c *domain.Company) (*domain.AnalysisResult, error) {
	scoring := 5 + m.rnd.Intn(6) // 5 to 10 for simulated leads
	if strings.Contains(strings.ToLower(c.Name), "poor") || strings.Contains(strings.ToLower(c.Name), "inactive") {
		scoring = 2 + m.rnd.Intn(3) // 2 to 4
	}

	var gaps []string
	var recommendations string

	if c.Type == "supplier" {
		// Supplier scoring details
		gaps = []string{
			"Отсутствует активное представительство в Центральной Азии",
			"Высокие требования к минимальной партии заказа (MOQ) для небольших дистрибьюторов",
			"Отсутствует локализация инструкций и упаковки на русский/казахский языки (RU/KZ)",
		}
		recommendations = fmt.Sprintf("Связаться с %s и предложить эксклюзивное партнерство в Казахстане. Сделать акцент на нашей логистической сети и возможностях дистрибуции в Центральной Азии.", c.Name)
	} else {
		// Client scoring details based on category
		switch strings.ToLower(c.Category) {
		case "e-commerce", "интернет-магазин":
			gaps = []string{
				"Нет поддержки мобильных кошельков для оплаты (Apple Pay/Google Pay/Kaspi QR)",
				"Медленный процесс оформления заказа и высокий показатель брошенных корзин на мобильных",
				"Отсутствуют бюджетные игровые мыши и механические клавиатуры в каталоге",
			}
			recommendations = "Предложить тестовую партию бюджетных механических клавиатур (например, Redragon/Keychron) и презентовать интеграцию платежного шлюза Apple/Google Pay."
		case "instagram-shop", "instagram":
			gaps = []string{
				"Задержка ответов в директ (в среднем более 3 часов)",
				"Отсутствует сайт-визитка или прямая ссылка на корзину для оформления заказа",
				"В каталоге нет беспроводных зарядных устройств и повербанков",
			}
			recommendations = "Предложить внедрение чат-бота для автоответов в WhatsApp и оптовые поставки трендовых повербанков/беспроводных зарядок."
		case "retail", "розничный магазин":
			gaps = []string{
				"Нет интерактивных демо-зон для тестирования умных гаджетов покупателями",
				"На полках отсутствуют современные доступные аксессуары для умного дома",
				"Ассортимент аудиоаксессуаров ограничен исключительно проводными наушниками",
			}
			recommendations = "Предложить установку бесплатного интерактивного демо-стенда для умного дома. Презентовать пакетную поставку популярных беспроводных TWS-наушников."
		default:
			gaps = []string{
				"Ограниченный ассортимент товаров в основном каталоге",
				"Устаревшие описания товаров на сайте",
				"Отсутствует автоматизация маркетинга и системы удержания клиентов",
			}
			recommendations = "Запланировать аудит-звонок для выявления дефицита товаров и подготовить индивидуальный оптовый прайс-лист."
		}
	}

	return &domain.AnalysisResult{
		CompanyID:       c.ID,
		Scoring:         scoring,
		Gaps:            gaps,
		Recommendations: recommendations,
	}, nil
}

func (m *MockLLMAnalyzer) GenerateOffer(ctx context.Context, c *domain.Company, analysis *domain.AnalysisResult) (string, error) {
	if c.Type == "supplier" {
		offer := fmt.Sprintf(
			"Здравствуйте!\n\nМы изучили профиль компании %s в качестве потенциального поставщика. Нас очень привлекает ваш ассортимент в категории \"%s\".\n\nМы являемся крупным дистрибьютором электроники и аксессуаров в Казахстане и странах Центральной Азии. Мы заметили следующие возможности:\n- %s\n\nПредлагаем обсудить возможность нашего сотрудничества, включая вопросы логистики, снижения MOQ для стартовых партий и локализации. Будем рады стать вашим официальным представителем в регионе.\n\nС уважением,\nОтдел развития поставок",
			c.Name, c.Category, strings.Join(analysis.Gaps, "\n- "),
		)
		return offer, nil
	}

	offer := fmt.Sprintf(
		"Здравствуйте!\n\nМы проанализировали ваш магазин %s. Вы делаете отличную работу в сегменте \"%s\".\n\nМы выявили несколько точек роста, которые помогут вам увеличить средний чек и привлечь новых клиентов:\n- %s\n\nРекомендация: %s\n\nМы готовы предоставить вам специальный оптовый прайс-лист со скидкой до 20%% на стартовую партию недостающих категорий товаров, а также маркетинговые материалы для оформления витрин.\n\nКогда вам удобно обсудить условия сотрудничества?\n\nС уважением,\nКоммерческий отдел",
		c.Name, c.Category, strings.Join(analysis.Gaps, "\n- "), analysis.Recommendations,
	)
	return offer, nil
}
