import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
from main import app

from Domain.models.user import UserModel  # Adjust these paths to match your project folders
from Domain.models.Review import ReviewModel
from Domain.models.observation import ObservationModel

# 1. Setup an isolated, temporary SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 2. Define the dependency override
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Apply the override to the FastAPI app instance
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Automatically creates tables before each test and drops them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_register_user_success():
    payload = {"username": "testuser", "password": "securepassword123"}
    response = client.post("/auth/register", json=payload)

    assert response.status_code == 200
    assert response.json() == {"message": "User created successfully"}


def test_register_duplicate_username_fails():
    payload = {"username": "testuser", "password": "securepassword123"}
    # Register the first time
    client.post("/auth/register", json=payload)
    # Attempt to register with the same username again
    response = client.post("/auth/register", json=payload)

    assert response.status_code == 400
    assert "Username already taken" in response.json()["detail"]


# --- THE AUTH LOGIN TESTS ---

def test_login_success_returns_jwt_and_id():
    # Arrange: Register a valid user
    register_payload = {"username": "loginuser", "password": "correct_password"}
    client.post("/auth/register", json=register_payload)

    # Act: Attempt login
    login_payload = {"username": "loginuser", "password": "correct_password"}
    response = client.post("/auth/login", json=login_payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["username"] == "loginuser"
    assert "id" in data


def test_login_invalid_credentials_fails():
    # Arrange: Register a user
    register_payload = {"username": "loginuser", "password": "correct_password"}
    client.post("/auth/register", json=register_payload)

    # Act: Attempt login with the wrong password
    login_payload = {"username": "loginuser", "password": "wrong_password"}
    response = client.post("/auth/login", json=login_payload)

    # Assert
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]