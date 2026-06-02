import uvicorn
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from strawberry.fastapi import GraphQLRouter
from Domain.schema import schema

from Domain.models.Review import ReviewModel
from Domain.models.SMA import SMAModel
from Domain.models.user import UserModel
from Domain.models.log import LogModel
from Domain.models.observation import ObservationModel
from Repository.log_repository import LogRepository
from Repository.sma_repository import SMARepository
from Repository.review_repository import ReviewRepository
from Service.faker_service import FakerService
from Service.log_service import LogService
from Service.sma_service import SMAService
from Service.review_service import ReviewService
from Service.websocket_manager import ws_manager
from Controller import sma_controller, review_controller, faker_controller, auth_controller, chat_controller
from data import matrix_data_sma, matrix_data_review
from database import get_db, engine, Base, SessionLocal

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    if not db.query(UserModel).filter_by(id=1).first():
        admin_user = UserModel(
            id=1,
            username="admin_maki",
            password="hashed_password_here",
            role="admin"
        )
        db.add(admin_user)
        db.commit()

    for i in range(len(matrix_data_sma["id"])):
        if not db.query(SMAModel).filter_by(id=matrix_data_sma["id"][i]).first():
            movie = SMAModel(
                id=matrix_data_sma["id"][i],
                name=matrix_data_sma["name"][i],
                number_of_reviews=matrix_data_sma["number_of_reviews"][i],
                duration=matrix_data_sma["duration"][i],
                rating=matrix_data_sma["rating"][i],
                year_released=matrix_data_sma["year_released"][i],
                image=matrix_data_sma["image"][i],
                type=matrix_data_sma["type"][i],
                description=matrix_data_sma["description"][i]
            )
            db.add(movie)
    db.commit()

    for i in range(len(matrix_data_review["id"])):
        if not db.query(ReviewModel).filter_by(id=matrix_data_review["id"][i]).first():
            review = ReviewModel(
                id=matrix_data_review["id"][i],
                movie_id=matrix_data_review["movie_id"][i],
                user_id=matrix_data_review["user_id"][i],
                rating=matrix_data_review["rating"][i],
                text=matrix_data_review["text"][i],
                likes=matrix_data_review["likes"][i]
            )
            db.add(review)
    db.commit()

    db.execute(text("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))"))
    db.execute(text("SELECT setval('\"SMA_id_seq\"', (SELECT MAX(id) FROM \"SMA\"))"))
    db.execute(text("SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews))"))
    db.commit()

    print("Database seeded and sequences synchronized successfully!")

except Exception as e:
    db.rollback()
    print(f"Seeding failed: {e}")

log_repo = LogRepository(db)
sma_repo = SMARepository(db)
review_repo = ReviewRepository(db)

log_service = LogService(log_repo)
sma_service = SMAService(sma_repo, review_repo)
review_service = ReviewService(review_repo, sma_repo, log_service, ws_manager)
faker_service = FakerService(review_service, sma_repo, ws_manager)

async def get_context():
    return {
        "sma_service": sma_service,
        "review_service": review_service,
    }

@asynccontextmanager
async def lifespan(app: FastAPI):
    faker_task = asyncio.create_task(faker_service.start_loop())
    yield
    faker_service.stop_loop()
    await faker_task

app = FastAPI(title="Maki API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

graphql_app = GraphQLRouter(schema, context_getter=get_context)

app.include_router(graphql_app, prefix="/graphql")
app.include_router(sma_controller.router)
app.include_router(review_controller.router)
app.include_router(auth_controller.router)
app.include_router(chat_controller.router)
app.include_router(faker_controller.create_silver_router(faker_service))

if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, ssl_keyfile = "./localhost+3-key.pem",
                ssl_certfile="./localhost+3.pem")