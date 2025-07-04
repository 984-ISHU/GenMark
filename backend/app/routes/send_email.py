# backend/routes/send_email.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()


router = APIRouter(prefix="/api", tags=["Send Email"])

# Environment variables should already be loaded in main.py
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
APP_PASSWORD = os.getenv("APP_PASSWORD")

class EmailPayload(BaseModel):
    subject: str
    html_body: str
    recipients: list[EmailStr]

@router.post("/send-email")
async def send_email(payload: EmailPayload):
    try:
        msg = EmailMessage()
        msg["Subject"] = payload.subject
        msg["From"] = f"GenMark Team <{SENDER_EMAIL}>"
        msg["To"] = ", ".join(payload.recipients)
        msg.add_alternative(payload.html_body, subtype="html")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SENDER_EMAIL, APP_PASSWORD)
            smtp.send_message(msg)

        return {"success": True, "message": "Email sent successfully"}

    except smtplib.SMTPAuthenticationError:
        raise HTTPException(status_code=401, detail="Authentication failed.")
    except smtplib.SMTPRecipientsRefused:
        raise HTTPException(status_code=400, detail="One or more recipients were refused.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
