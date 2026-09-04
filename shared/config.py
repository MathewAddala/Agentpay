from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Razorpay
    RAZORPAY_KEY_ID: str = Field(default='')
    RAZORPAY_KEY_SECRET: str = Field(default='')
    RAZORPAY_WEBHOOK_SECRET: str = Field(default='')
    
    # Groq LLM
    GROQ_API_KEY: str = Field(default='')
    GROQ_MODEL: str = Field(default='llama-3.3-70b-versatile')
    GROQ_BASE_URL: str = Field(default='https://api.groq.com/openai/v1')
    
    # App
    SIMULATE_PAYMENT_FAILURE: bool = Field(default=True)
    MERCHANT_URL: str = Field(default='http://merchant-agent:8001')
    BUYER_URL: str = Field(default='http://buyer-agent:8002')
    DATABASE_PATH: str = Field(default='/app/data/commerce.db')
    
    # For local dev (non-Docker)
    MERCHANT_HOST: str = Field(default='0.0.0.0')
    MERCHANT_PORT: int = Field(default=8001)
    BUYER_HOST: str = Field(default='0.0.0.0')
    BUYER_PORT: int = Field(default=8002)
    DASHBOARD_HOST: str = Field(default='0.0.0.0')
    DASHBOARD_PORT: int = Field(default=8080)
    
    model_config = {'env_file': '.env', 'env_file_encoding': 'utf-8', 'extra': 'ignore'}

settings = Settings()
