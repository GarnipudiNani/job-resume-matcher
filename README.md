# Job Resume Screening & Matching System

A backend REST API application that allows users to upload resumes, create job descriptions, and compare resumes with job requirements using skill-based text matching.

## Project Objective

The goal of this project is to build a simple resume screening system that can:

- Authenticate users securely
- Upload PDF and DOCX resumes
- Extract text from resumes
- Store resume information in PostgreSQL
- Create and manage job descriptions
- Extract technical skills from resume and job description text
- Identify matched and missing skills
- Calculate a resume-job match percentage

## Features

### Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing
- Protected API endpoints

### Resume Management

- Upload PDF and DOCX resumes
- Extract text from uploaded files
- Store extracted resume text in PostgreSQL
- Retrieve resumes
- Retrieve an individual resume
- Delete resumes

### Job Management

- Create job descriptions
- Retrieve all jobs
- Retrieve an individual job
- User-specific job access
- Delete jobs

### Resume-Job Matching

The system compares technical skills found in the resume with skills found in the job description.

The result contains:

- Resume skills
- Required job skills
- Matched skills
- Missing skills
- Match percentage

### Skill Normalization

The system normalizes common variations of skills.

For example:

REST API
REST APIs

are treated as the same skill.

## Matching Logic

The current implementation uses rule-based skill matching.

The match percentage is calculated using:

Match Percentage = (Matched Skills / Required Job Skills) × 100

### Example

Job Requirements:

- Python
- SQL
- Git
- Docker

Resume Skills:

- Python
- SQL
- Git

Result:

- Matched Skills: Python, SQL, Git
- Missing Skills: Docker
- Match Percentage: 75%

## Technology Stack

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- JWT Authentication
- Password Hashing
- PyMuPDF
- python-docx
- Pytest
- Git
- GitHub
- Swagger / OpenAPI

## Project Structure

job_resume_matcher/
|
|-- app/
|   |-- core/
|   |   |-- config.py
|   |   |-- security.py
|   |   |-- __init__.py
|   |
|   |-- database/
|   |   |-- database.py
|   |   |-- dependencies.py
|   |   |-- __init__.py
|   |
|   |-- models/
|   |   |-- base.py
|   |   |-- user.py
|   |   |-- resume.py
|   |   |-- job.py
|   |   |-- __init__.py
|   |
|   |-- routers/
|   |   |-- auth.py
|   |   |-- resumes.py
|   |   |-- jobs.py
|   |   |-- matching.py
|   |   |-- __init__.py
|   |
|   |-- services/
|   |   |-- matching.py
|   |   |-- __init__.py
|   |
|   |-- schemas.py
|   |-- main.py
|   |-- __init__.py
|
|-- alembic/
|
|-- tests/
|   |-- test_matching.py
|   |-- __init__.py
|
|-- uploads/
|-- .env.example
|-- .gitignore
|-- requirements.txt
|-- README.md

## API Endpoints

### Authentication

Method: POST
Endpoint: /auth/register
Description: Register a new user

Method: POST
Endpoint: /auth/login
Description: Login and receive JWT token

Method: GET
Endpoint: /auth/me
Description: Get current authenticated user

### Resumes

Method: POST
Endpoint: /resumes/upload
Description: Upload PDF/DOCX resume

Method: GET
Endpoint: /resumes
Description: Get user's resumes

Method: GET
Endpoint: /resumes/{resume_id}
Description: Get a specific resume

Method: DELETE
Endpoint: /resumes/{resume_id}
Description: Delete a resume

### Jobs

Method: POST
Endpoint: /jobs
Description: Create a job description

Method: GET
Endpoint: /jobs
Description: Get user's jobs

Method: GET
Endpoint: /jobs/{job_id}
Description: Get a specific job

Method: DELETE
Endpoint: /jobs/{job_id}
Description: Delete a job

### Matching

Method: POST
Endpoint: /match/{resume_id}/{job_id}
Description: Match a resume with a job

## Testing

The project uses Pytest for automated testing.

Run the tests using:

python -m pytest

Current tests cover:

- Skill extraction
- Skill matching
- Skill normalization
- Missing skill detection
- Match percentage calculation

## Setup and Installation

### 1. Clone the repository

git clone <your-github-repository-url>

cd job_resume_matcher

### 2. Create a virtual environment

python -m venv venv

### 3. Activate the virtual environment

Windows:

venv\Scripts\activate

### 4. Install dependencies

python -m pip install -r requirements.txt

### 5. Configure environment variables

Create a .env file based on .env.example.

Example:

APP_NAME=Job Resume Matcher
ENVIRONMENT=development
DATABASE_URL=your_database_url
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

### 6. Run database migrations

alembic upgrade head

### 7. Start the application

python -m uvicorn app.main:app --reload

### 8. Open Swagger API Documentation

Open this URL in your browser:

http://127.0.0.1:8000/docs

## How to Use

1. Register a user.
2. Login and obtain a JWT access token.
3. Authorize the API using the JWT token.
4. Upload a PDF or DOCX resume.
5. Create a job description.
6. Match the resume with the job.
7. Review matched skills.
8. Review missing skills.
9. Check the calculated match percentage.

## Example Workflow

User Registration
        |
        v
User Login
        |
        v
JWT Authentication
        |
        v
Upload Resume
        |
        v
Extract Resume Text
        |
        v
Create Job Description
        |
        v
Extract Required Skills
        |
        v
Compare Resume and Job Skills
        |
        v
Matched Skills + Missing Skills
        |
        v
Match Percentage

## Future Improvements

- More advanced NLP-based skill extraction
- Improved skill taxonomy
- Resume ranking
- Job recommendation
- Frontend interface
- Cloud deployment
- Improved resume parsing
- Support for additional document formats

## Author

Garnipudi Nani

B.Tech - Computer Science & Engineering