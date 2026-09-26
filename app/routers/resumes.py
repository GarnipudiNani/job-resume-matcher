from pathlib import Path
from uuid import uuid4

import fitz
from docx import Document

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.resume import Resume
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def extract_pdf_text(file_path: Path) -> str:
    document = fitz.open(file_path)

    text = ""

    for page in document:
        text += page.get_text()

    document.close()

    return text


def extract_docx_text(file_path: Path) -> str:
    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:
        text += paragraph.text + "\n"

    return text


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_types = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are allowed",
        )

    extension = allowed_types[file.content_type]

    unique_filename = f"{uuid4()}{extension}"

    file_path = UPLOAD_DIR / unique_filename

    file_content = file.file.read()

    file_path.write_bytes(file_content)

    try:
        if extension == ".pdf":
            extracted_text = extract_pdf_text(file_path)
        else:
            extracted_text = extract_docx_text(file_path)

    except Exception:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from the uploaded file",
        )

    new_resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=str(file_path),
        extracted_text=extracted_text,
    )

    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    return {
        "id": new_resume.id,
        "filename": new_resume.filename,
        "message": "Resume uploaded successfully",
        "extracted_text_length": len(extracted_text),
    }


@router.get("")
def get_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .all()
    )

    return resumes
@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    return resume


@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    db.delete(resume)
    db.commit()

    return {
        "message": "Resume deleted successfully"
    }