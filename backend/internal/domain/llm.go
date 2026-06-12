package domain

import "context"

// LLMAnalyzer defines business contract to run AI analysis and generate personalized offers.
type LLMAnalyzer interface {
	// AnalyzeCompany evaluates company profile, category and open info to calculate scoring and discover gaps.
	AnalyzeCompany(ctx context.Context, company *Company) (*AnalysisResult, error)
	// GenerateOffer prepares a personalized commercial offer draft for the sales pitch.
	GenerateOffer(ctx context.Context, company *Company, analysis *AnalysisResult) (string, error)
}
