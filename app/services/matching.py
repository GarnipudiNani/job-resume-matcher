import re


SKILL_ALIASES = {
    "rest apis": "rest api",
    "rest api": "rest api",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "powerbi": "power bi",
    "power bi": "power bi",
    "scikit learn": "scikit-learn",
    "scikit-learn": "scikit-learn",
}


SKILLS = {
    "python",
    "sql",
    "fastapi",
    "flask",
    "django",
    "rest api",
    "postgresql",
    "mysql",
    "git",
    "github",
    "docker",
    "java",
    "javascript",
    "html",
    "css",
    "react",
    "angular",
    "pandas",
    "numpy",
    "scikit-learn",
    "power bi",
    "tableau",
    "excel",
    "machine learning",
}


def normalize_text(text: str) -> str:
    text = text.lower()

    text = re.sub(
        r"[^a-z0-9+#.\-\s]",
        " ",
        text,
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def normalize_skill(skill: str) -> str:
    skill = skill.lower().strip()

    return SKILL_ALIASES.get(
        skill,
        skill,
    )


def extract_skills(text: str) -> set[str]:
    normalized_text = normalize_text(text)

    found_skills = set()

    for skill in SKILLS.union(SKILL_ALIASES):
        skill_pattern = re.escape(skill)
        if skill in {"rest api", "rest apis"}:
            skill_pattern = r"rest\ apis?"
        pattern = rf"(?<![a-z0-9]){skill_pattern}(?![a-z0-9])"
        if re.search(pattern, normalized_text):
            found_skills.add(normalize_skill(skill))

    return found_skills


def calculate_match(
    resume_text: str,
    job_description: str,
) -> dict:

    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)

    matched_skills = resume_skills.intersection(
        job_skills
    )

    missing_skills = job_skills - resume_skills

    if not job_skills:
        match_percentage = 0.0
    else:
        match_percentage = (
            len(matched_skills)
            / len(job_skills)
        ) * 100

    return {
        "resume_skills": sorted(resume_skills),
        "job_skills": sorted(job_skills),
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "match_percentage": round(
            match_percentage,
            2,
        ),
    }
