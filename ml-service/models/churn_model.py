import xgboost as xgb
import numpy as np
import pickle
import os
from typing import Dict, Any


class ChurnModel:
    """
    XGBoost Churn Prediction Model
    """
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.feature_names = [
            'avg_sentiment_score',
            'ticket_volume_30d',
            'ticket_volume_trend',
            'escalation_count',
            'avg_response_delay_hours',
            'unresolved_ticket_count',
            'negative_interaction_ratio',
            'days_since_last_positive',
            'health_score',
            'channel_diversity'
        ]
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def train(self, X_train, y_train, X_val=None, y_val=None):
        """
        Train the XGBoost model
        """
        dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=self.feature_names)
        
        evals = [(dtrain, 'train')]
        if X_val is not None and y_val is not None:
            dval = xgb.DMatrix(X_val, label=y_val, feature_names=self.feature_names)
            evals.append((dval, 'val'))
        
        params = {
            'objective': 'binary:logistic',
            'eval_metric': 'logloss',
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 100,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42
        }
        
        self.model = xgb.train(
            params,
            dtrain,
            num_boost_round=100,
            evals=evals,
            early_stopping_rounds=10,
            verbose_eval=False
        )
    
    def predict(self, features: Dict[str, Any]) -> float:
        """
        Predict churn probability
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Convert features to array in correct order
        feature_array = np.array([[
            features.get(name, 0) for name in self.feature_names
        ]])
        
        dmatrix = xgb.DMatrix(feature_array, feature_names=self.feature_names)
        probability = self.model.predict(dmatrix)[0]
        
        return float(probability)
    
    def save_model(self, path: str):
        """
        Save model to file
        """
        with open(path, 'wb') as f:
            pickle.dump(self.model, f)
    
    def load_model(self, path: str):
        """
        Load model from file
        """
        with open(path, 'rb') as f:
            self.model = pickle.load(f)


# Singleton instance
_model_instance = None

def get_model(model_path: str = None) -> ChurnModel:
    """
    Get or create model instance
    """
    global _model_instance
    if _model_instance is None:
        _model_instance = ChurnModel(model_path)
    return _model_instance
