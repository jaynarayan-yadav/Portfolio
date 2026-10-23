from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Portfolio API")

class ContactMessage(BaseModel):
    name: str
    email: str
    message: str

@app.post("/api/contact")
async def send_contact(msg: ContactMessage):
    return {"status": "success", "received": msg.name}
