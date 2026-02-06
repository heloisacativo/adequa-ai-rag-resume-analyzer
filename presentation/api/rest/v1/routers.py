from fastapi import APIRouter

from presentation.api.rest.v1.controllers.users.auth_controller import (
    router as user_router,
)
from presentation.api.rest.v1.controllers.users.user_controller import (
    router as user_management_router,
)
from presentation.api.rest.v1.controllers.resumes.resumes import (
    router as resume_router,
)
from presentation.api.rest.v1.controllers.resumes.resume_groups import (
    router as resume_groups_router,
)
from presentation.api.rest.v1.controllers.candidates.search import (
    router as candidate_router,
)
from presentation.api.rest.v1.controllers.candidates.job_application_controller import (
    router as job_application_router,
)
from presentation.api.rest.v1.controllers.jobs.jobs_controller import (
    router as jobs_router,
)
from presentation.api.rest.v1.controllers.chat.chat_controller import (
    router as chat_router,
)

api_v1_router = APIRouter()
api_v1_router.include_router(user_router)
api_v1_router.include_router(user_management_router)
api_v1_router.include_router(resume_router)
api_v1_router.include_router(resume_groups_router, prefix="/resumes")
api_v1_router.include_router(candidate_router)
api_v1_router.include_router(job_application_router)
api_v1_router.include_router(job_application_router)
api_v1_router.include_router(jobs_router)
api_v1_router.include_router(chat_router)
