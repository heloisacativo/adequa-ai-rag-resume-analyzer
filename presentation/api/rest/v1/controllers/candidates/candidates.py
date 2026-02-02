from typing import Annotated
from fastapi import APIRouter, Query, HTTPException
# 1. Importe DishkaRoute aqui
from dishka.integrations.fastapi import FromDishka, DishkaRoute 

from application.use_cases.candidates.analyze_candidates import AnalyzeCandidatesUseCase
from presentation.api.rest.v1.schemas.candidates import AnalysisResponse

# 2. Adicione route_class=DishkaRoute aqui
router = APIRouter(
    prefix="/candidates", 
    tags=["Candidates"],
    route_class=DishkaRoute 
)

@router.get("/analyze", response_model=AnalysisResponse)
async def analyze_candidates(
    # Agora o FastAPI sabe que isso é responsabilidade do DishkaRoute
    use_case: Annotated[AnalyzeCandidatesUseCase, FromDishka()],
    job_description: str = Query(..., description="Descrição da vaga"),
    index_id: str = Query(..., description="ID do índice de currículos"),
):
    """Analisa candidatos com base na descrição da vaga"""
    
    try:
        result = await use_case.execute(job_description, index_id)
        
        return AnalysisResponse(
            query=result.query,
            total_candidates=result.total_candidates,
            best_candidate=result.best_candidate,
            ranking=result.ranking
        )
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))