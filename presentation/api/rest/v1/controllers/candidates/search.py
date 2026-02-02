"""Controller para análise de candidatos."""
from fastapi import APIRouter, Query, HTTPException
from dishka.integrations.fastapi import FromDishka, inject

from application.use_cases.candidates.analyze import AnalyzeCandidatesUseCase
from presentation.api.rest.v1.schemas.candidates import SearchResponseSchema, CandidateResultSchema

router = APIRouter(prefix="/search", tags=["Candidates"])


@router.get("/llm/", response_model=SearchResponseSchema)
@inject
async def analyze_candidates(
    query: str = Query(..., description="Descrição da Vaga"),
    index_id: str = Query(..., description="ID do índice"),
    use_case: FromDishka[AnalyzeCandidatesUseCase] = None,
):
    """Analisa candidatos baseado em descrição da vaga."""
    try:
        result = await use_case.execute(query, index_id)
        
        return SearchResponseSchema(
            query=result.query,
            response=result.response,
            total_candidates=result.total_candidates,
            ranking=[
                CandidateResultSchema(
                    arquivo=r.arquivo,
                    nome_candidato=r.nome_candidato,
                    score=r.score,
                    pontos_fortes=r.pontos_fortes,
                    pontos_fracos=r.pontos_fracos,
                    justificativa=r.justificativa
                )
                for r in result.ranking
            ]
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
