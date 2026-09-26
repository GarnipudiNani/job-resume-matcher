from app.services.matching import calculate_match, extract_skills


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