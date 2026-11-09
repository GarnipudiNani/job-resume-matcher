from pathlib import Path
from uuid import uuid4
import zipfile

import pymupdf as fitz
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
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def extract_pdf_text(file_path: Path) -> str:
    with fitz.open(file_path) as document:
        return "\n".join(page.get_text() for page in document)


def extract_docx_text(file_path: Path) -> str:
    document = Document(file_path)

    return "\n".join(paragraph.text for paragraph in document.paragraphs)


def resume_summary(resume: Resume) -> dict:
    """Expose metadata only; extracted resume text and storage paths are private."""
    return {"id": resume.id, "filename": resume.filename, "created_at": resume.created_at}


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

    if not file.filename or Path(file.filename).suffix.lower() not in {".pdf", ".docx"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are allowed",
        )

    extension = Path(file.filename).suffix.lower()
    if file.content_type not in allowed_types or allowed_types[file.content_type] != extension:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")

    unique_filename = f"{uuid4()}{extension}"

    file_path = UPLOAD_DIR / unique_filename

    size = 0
    try:
        with file_path.open("wb") as destination:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="File exceeds the 10 MB limit")
                destination.write(chunk)

        if size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        if extension == ".pdf" and not file_path.read_bytes().startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="File content does not match PDF format")
        if extension == ".docx" and not zipfile.is_zipfile(file_path):
            raise HTTPException(status_code=400, detail="File content does not match DOCX format")
        if extension == ".pdf":
            extracted_text = extract_pdf_text(file_path)
        else:
            extracted_text = extract_docx_text(file_path)

    except HTTPException:
        if file_path.exists():
            file_path.unlink()
        raise
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

    try:
        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)
    except Exception:
        db.rollback()
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Could not save uploaded resume")

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

    return [resume_summary(resume) for resume in resumes]
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

    return {**resume_summary(resume), "extracted_text_length": len(resume.extracted_text or "")}


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
