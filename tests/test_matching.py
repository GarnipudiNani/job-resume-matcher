from app.services.matching import calculate_match, extract_skills
from pydantic import ValidationError

from app.models.resume import Resume
from app.routers.resumes import resume_summary
from app.routers.jobs import job_summary
from app.schemas import JobCreate


def test_skill_matching():
    resume = "Python SQL REST APIs Git"

    job = "Python SQL REST API Git Docker"

    result = calculate_match(
        resume,
        job,
    )

    assert "python" in result["matched_skills"]
    assert "sql" in result["matched_skills"]
    assert "git" in result["matched_skills"]
    assert "rest api" in result["matched_skills"]

    assert "docker" in result["missing_skills"]

    assert result["match_percentage"] == 80.0


def test_skill_extraction():
    text = "Python SQL FastAPI PostgreSQL Git"

    skills = extract_skills(text)

    assert "python" in skills
    assert "sql" in skills
    assert "fastapi" in skills
    assert "postgresql" in skills
    assert "git" in skills


def test_rest_api_normalization():
    resume = "REST APIs"

    job = "REST API"

    result = calculate_match(
        resume,
        job,
    )

    assert "rest api" in result["matched_skills"]

    assert result["match_percentage"] == 100.0


def test_missing_skills():
    resume = "Python SQL"

    job = "Python SQL Docker FastAPI"

    result = calculate_match(
        resume,
        job,
    )

    assert "docker" in result["missing_skills"]
    assert "fastapi" in result["missing_skills"]

    assert result["match_percentage"] == 50.0


def test_job_input_rejects_empty_or_whitespace_values():
    for data in (
        {"title": "", "description": "Role"},
        {"title": "   ", "description": "Role"},
        {"title": "Engineer", "description": "  "},
    ):
        try:
            JobCreate(**data)
        except ValidationError:
            continue
        raise AssertionError("Empty job fields must be rejected")


def test_resume_summary_does_not_expose_private_fields():
    resume = Resume(id=7, user_id=3, filename="cv.pdf", file_path="uploads/private.pdf", extracted_text="private resume")
    summary = resume_summary(resume)
    assert summary == {"id": 7, "filename": "cv.pdf", "created_at": None}
    assert "file_path" not in summary
    assert "extracted_text" not in summary


def test_skill_matching_uses_skill_boundaries():
    assert "sql" not in extract_skills("NoSQL")
    assert "java" not in extract_skills("JavaScript")
    assert "python" not in extract_skills("cpython")


def test_skill_aliases_are_extracted_and_normalized():
    assert extract_skills("PowerBI Postgres scikit learn") == {"power bi", "postgresql", "scikit-learn"}


def test_job_summary_includes_real_required_skills():
    job = type("JobRecord", (), {
        "id": 4,
        "user_id": 2,
        "title": "Engineer",
        "description": "Python SQL Docker",
        "created_at": None,
    })()
    assert job_summary(job)["required_skills"] == ["docker", "python", "sql"]
