from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.job import Job
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas import JobCreate
from app.services.matching import extract_skills


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


def job_summary(job: Job) -> dict:
    return {
        "id": job.id,
        "user_id": job.user_id,
        "title": job.title,
        "description": job.description,
        "created_at": job.created_at,
        "required_skills": sorted(extract_skills(job.description)),
    }


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_job = Job(
        user_id=current_user.id,
        title=job_data.title.strip(),
        description=job_data.description.strip(),
    )
    if not new_job.title or not new_job.description:
        raise HTTPException(status_code=422, detail="Title and description are required")

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return {
        "id": new_job.id,
        "title": new_job.title,
        "description": new_job.description,
        "required_skills": sorted(extract_skills(new_job.description)),
        "message": "Job created successfully",
    }


@router.get("")
def get_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = (
        db.query(Job)
        .filter(Job.user_id == current_user.id)
        .all()
    )

    return [job_summary(job) for job in jobs]
@router.get("/{job_id}")
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    return job_summary(job)


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    db.delete(job)
    db.commit()

    return {
        "message": "Job deleted successfully"
    }
