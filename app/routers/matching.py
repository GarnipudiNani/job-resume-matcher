from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.resume import Resume
from app.models.job import Job
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.matching import calculate_match


router = APIRouter(
    prefix="/match",
    tags=["Matching"],
)


@router.post("/{resume_id}/{job_id}")
def match_resume_with_job(
    resume_id: int,
    job_id: int,
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

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.user_id == current_user.id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Resume does not contain extracted text",
        )

    result = calculate_match(
        resume.extracted_text,
        job.description,
    )

    return {
        "resume_id": resume.id,
        "job_id": job.id,
        "job_title": job.title,
        **result,
    }
