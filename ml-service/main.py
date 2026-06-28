from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
import os

app = FastAPI(title="Churn Prediction ML Service", version="1.0.0")


class ChurnFeatures(BaseModel):
    avg_sentiment_score: float
    ticket_volume_30d: int
    ticket_volume_trend: float
    escalation_count: int
    avg_response_delay_hours: float
    unresolved_ticket_count: int
    negative_interaction_ratio: float
    days_since_last_positive: int
    health_score: float
    channel_diversity: int


class ChurnPredictionRequest(BaseModel):
    features: ChurnFeatures
    customer_id: str
    employer_id: str


class ChurnPredictionResponse(BaseModel):
    probability: float
    risk_level: str
    recommendations: List[str]
    model_version: str


@app.get("/")
async def root():
    return {
        "service": "Churn Prediction ML Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/predict", response_model=ChurnPredictionResponse)
async def predict_churn(request: ChurnPredictionRequest):
    """
    Predict churn probability using XGBoost model
    """
    try:
        # Extract features
        features = request.features
        
        # For now, use rule-based prediction
        # In production, this would load and use an XGBoost model
        probability = calculate_rule_based_probability(features)
        
        # Determine risk level
        risk_level = get_risk_level(probability)
        
        # Generate recommendations
        recommendations = generate_recommendations(probability, features)
        
        return ChurnPredictionResponse(
            probability=probability,
            risk_level=risk_level,
            recommendations=recommendations,
            model_version="rule-based-1.0"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_rule_based_probability(features: ChurnFeatures) -> float:
    """
    Calculate churn probability using rule-based approach
    This is a fallback when XGBoost model is not available
    """
    probability = 0.1  # Base risk
    
    # Adjust based on features
    if features.avg_sentiment_score < -0.3:
        probability += 0.3
    if features.ticket_volume_30d > 10:
        probability += 0.2
    if features.ticket_volume_trend > 0.5:
        probability += 0.15
    if features.escalation_count > 2:
        probability += 0.2
    if features.avg_response_delay_hours > 24:
        probability += 0.15
    if features.unresolved_ticket_count > 3:
        probability += 0.15
    if features.negative_interaction_ratio > 0.5:
        probability += 0.2
    if features.health_score < 50:
        probability += 0.15
    if features.days_since_last_positive > 30:
        probability += 0.1
    
    # Cap at 1.0
    probability = min(probability, 1.0)
    
    return probability


def get_risk_level(probability: float) -> str:
    """
    Determine risk level from probability
    """
    if probability >= 0.8:
        return "critical"
    elif probability >= 0.6:
        return "high"
    elif probability >= 0.4:
        return "medium"
    else:
        return "low"


def generate_recommendations(probability: float, features: ChurnFeatures) -> List[str]:
    """
    Generate actionable recommendations based on churn risk
    """
    recommendations = []
    
    if probability > 0.7:
        recommendations.append("Immediate outreach recommended")
        recommendations.append("Consider offering discount or incentive")
        recommendations.append("Escalate to account manager")
    elif probability > 0.4:
        recommendations.append("Schedule follow-up call within 24 hours")
        recommendations.append("Review recent interactions for issues")
        recommendations.append("Send personalized engagement email")
    
    # Feature-specific recommendations
    if features.avg_sentiment_score < -0.3:
        recommendations.append("Address negative sentiment in recent interactions")
    if features.unresolved_ticket_count > 3:
        recommendations.append("Prioritize resolution of open tickets")
    if features.escalation_count > 2:
        recommendations.append("Review escalation patterns and root causes")
    if features.avg_response_delay_hours > 24:
        recommendations.append("Improve response time SLAs")
    
    return recommendations


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
