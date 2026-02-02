"""Use case para análise de candidatos."""
import os
from dataclasses import dataclass
from typing import final

from llama_index.core import Settings

from application.dtos.candidate.analysis import SearchResponseDTO, CandidateResultDTO
from application.interfaces.ai.indexer import IndexerProtocol
from application.interfaces.ai.location_analyzer import LocationAnalyzerProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class AnalyzeCandidatesUseCase:
    """Use case para análise de candidatos via RAG."""
    
    indexer: IndexerProtocol
    location_analyzer: LocationAnalyzerProtocol | None = None
    
    async def execute(self, query: str, index_id: str) -> SearchResponseDTO:
        """
        Analisa candidatos baseado em uma descrição de vaga.
        
        Args:
            query: Descrição da vaga
            index_id: ID do índice vetorial
            
        Returns:
            SearchResponseDTO com ranking de candidatos
        """
        print(f"[DEBUG] Iniciando análise com index_id: {index_id}")
        print(f"[DEBUG] Query: {query}")
        
        # Carrega o índice
        try:
            index = await self.indexer.load_index(index_id)
            print(f"[DEBUG] Índice carregado com sucesso")
        except Exception as e:
            print(f"[ERROR] Falha ao carregar índice: {str(e)}")
            return SearchResponseDTO(
                query=query,
                response=f"Erro ao carregar índice: {str(e)}",
                total_candidates=0,
                ranking=[]
            )
        
        # Modelo LLM
        llm_model = Settings.llm  # Usa o LLM global (Groq, conforme seu .env)

        # 1. Recupera chunks relevantes (async para evitar "coroutine was never awaited" com instrumentação)
        retriever = index.as_retriever(similarity_top_k=50)
        nodes = await retriever.aretrieve(query)
        
        print(f"[DEBUG] Total de nodes recuperados: {len(nodes)}")
        print(f"[DEBUG] Nodes recuperados: {nodes}")

        # 2. Agrupa chunks por arquivo (candidato)
        candidatos_dict = {}
        for node in nodes:
            file_name = node.metadata.get("file_name", "Desconhecido")
            print(f"[DEBUG] Node metadata: {node.metadata}")
            if file_name not in candidatos_dict:
                candidatos_dict[file_name] = []
            # Acessa o texto do node corretamente
            node_text = node.node.text if hasattr(node, 'node') else node.get_content()
            candidatos_dict[file_name].append(node_text)
        
        print(f"[DEBUG] Total de candidatos agrupados: {len(candidatos_dict)}")
        print(f"[DEBUG] Candidatos agrupados: {candidatos_dict}")

        # 3. Loop de Avaliação Individual
        resultados = []
        
        for file_name, chunks in candidatos_dict.items():
            texto_completo = "\n\n".join(chunks)
            
            # Análise de localização (se disponível)
            location_analysis = None
            if self.location_analyzer:
                try:
                    location_analysis = await self.location_analyzer.analyze_location(
                        job_description=query,
                        resume_text=texto_completo
                    )
                    print(f"[DEBUG] Análise de localização para {file_name}: {location_analysis.match_status}")
                except Exception as e:
                    print(f"[WARNING] Erro ao analisar localização para {file_name}: {str(e)}")
            
            # Prompt focado em avaliação estruturada
            prompt = f"""
Você é um recrutador técnico experiente. Analise este currículo para a vaga abaixo e seja CRÍTICO e RIGOROSO.

VAGA: {query}

CURRÍCULO DO CANDIDATO:
{texto_completo}

INSTRUÇÕES IMPORTANTES:
1. Verifique se o candidato TEM as habilidades OBRIGATÓRIAS (PHP, HTML, CSS, JavaScript, MySQL/PostgreSQL, Git)
2. Se faltar QUALQUER requisito obrigatório, a nota DEVE SER BAIXA (0-40)
3. Se tiver requisitos básicos mas SEM experiência relevante, máximo 50-60
4. Apenas candidatos com FORTE match devem ter 70+
5. Candidatos perfeitos (todos requisitos + diferenciais) podem ter 90+

Forneça a resposta EXATAMENTE neste formato:

NOME DO CANDIDATO: [extraia do currículo]
NOTA: [0-100, seja rigoroso]
PONTOS FORTES: [liste apenas competências que REALMENTE aparecem no currículo]
PONTOS FRACOS: [liste TODOS os requisitos da vaga que estão faltando]
JUSTIFICATIVA: [explique por que essa nota, mencione gaps específicos]

Seja honesto e crítico. Não dê notas altas sem justificativa."""

            try:
                response = await llm_model.acomplete(prompt)
                response_text = str(response)
                
                # Parse da resposta estruturada
                resultado = {
                    "arquivo": file_name,
                    "nome_candidato": "Extraindo...",
                    "score": 50,
                    "pontos_fortes": [],
                    "pontos_fracos": [],
                    "justificativa": response_text,
                    "location_analysis": location_analysis
                }
                
                # Tentativa de extrair dados estruturados
                lines = response_text.split('\n')
                for line in lines:
                    line_upper = line.upper()
                    if 'NOME' in line_upper and ':' in line:
                        resultado["nome_candidato"] = line.split(':', 1)[1].strip()
                    elif line_upper.strip().startswith('NOTA') and ':' in line:
                        try:
                            score_str = line.split(':', 1)[1].strip()
                            score_num = ''.join(filter(str.isdigit, score_str))
                            if score_num:
                                resultado["score"] = min(int(score_num), 100)
                        except:
                            pass
                
                # Ajustar score baseado na análise de localização
                if location_analysis:
                    if location_analysis.match_status == "DIFFERENT_LOCATIONS" and not location_analysis.willing_to_relocate:
                        # Descartar completamente candidatos que não combinam localização e não querem mudar
                        resultado["score"] = 0
                        resultado["pontos_fracos"].append("LOCALIZAÇÃO INCOMPATÍVEL - Candidato mora em local diferente da vaga e não demonstrou disposição para mudança")
                    elif location_analysis.match_status == "CANDIDATE_LOCATION_UNKNOWN" and location_analysis.has_location_requirement:
                        # Descartar candidatos com localização desconhecida em vagas presenciais
                        resultado["score"] = 0
                        resultado["pontos_fracos"].append("LOCALIZAÇÃO DESCONHECIDA - Não foi possível determinar a localização do candidato")
                
                resultados.append(CandidateResultDTO(**resultado))
                
            except Exception as e:
                # Adiciona resultado parcial mesmo com erro
                resultados.append(CandidateResultDTO(
                    arquivo=file_name,
                    nome_candidato=file_name,
                    score=0,
                    pontos_fortes=[],
                    pontos_fracos=[],
                    justificativa=f"Erro ao processar: {str(e)}",
                    location_analysis=location_analysis
                ))

        # 4. Ordena por score e filtra candidatos descartados
        resultados_ordenados = sorted(
            [r for r in resultados if r.score > 0],  # Só incluir candidatos com score > 0
            key=lambda x: x.score, 
            reverse=True
        )
        
        candidatos_descartados = [r for r in resultados if r.score == 0]

        # 5. Monta resposta textual para o frontend
        if resultados_ordenados:
            melhor = resultados_ordenados[0]
            resposta_texto = f"""
CANDIDATO RECOMENDADO: {melhor.nome_candidato} ({melhor.arquivo})

NOTA: {melhor.score}/100
"""
            # Adiciona informação de localização se disponível
            if melhor.location_analysis:
                loc = melhor.location_analysis
                resposta_texto += f"\nLOCALIZAÇÃO: {loc.match_status}"
                
                if loc.match_status == "REMOTE":
                    resposta_texto += " (Vaga remota - compatível)"
                elif loc.match_status == "LOCATION_MATCH":
                    resposta_texto += f" (Compatível: {loc.candidate_location})"
                elif loc.match_status == "WILL_RELOCATE":
                    resposta_texto += f" (Candidato disponível: {loc.candidate_location or 'Não informado'})"
                    resposta_texto += "\n✓ Candidato disposto a mudança"
                elif loc.match_status == "NO_SPECIFIC_LOCATION":
                    resposta_texto += " (Vaga sem localização específica)"
                elif loc.match_status == "CANDIDATE_LOCATION_UNKNOWN":
                    resposta_texto += f" (Vaga: {loc.job_location or 'Não especificado'} | Candidato: localização não informada)"
            
            resposta_texto += f"""

ANÁLISE:
{melhor.justificativa}

RANKING COMPLETO:
"""
            for idx, r in enumerate(resultados_ordenados, 1):
                loc_info = ""
                if r.location_analysis:
                    status = r.location_analysis.match_status
                    if status == "REMOTE":
                        loc_info = " [REMOTO]"
                    elif status == "LOCATION_MATCH":
                        loc_info = " [✓ Localização]"
                    elif status == "WILL_RELOCATE":
                        loc_info = " [✓ Mudança]"
                    elif status == "NO_SPECIFIC_LOCATION":
                        loc_info = " [Sem localização]"
                    elif status == "CANDIDATE_LOCATION_UNKNOWN":
                        loc_info = " [Localização desconhecida]"
                resposta_texto += f"\n{idx}. {r.nome_candidato} - Nota: {r.score}/100{loc_info}"
            
            # Adiciona candidatos descartados
            if candidatos_descartados:
                resposta_texto += "\n\nCANDIDATOS DESCARTADOS (localização incompatível):"
                for r in candidatos_descartados:
                    resposta_texto += f"\n• {r.nome_candidato} - MOTIVO: {r.pontos_fracos[-1] if r.pontos_fracos else 'Localização incompatível'}"
        else:
            resposta_texto = "Nenhum candidato foi encontrado no índice."

        return SearchResponseDTO(
            query=query,
            response=resposta_texto,
            total_candidates=len(resultados_ordenados),
            ranking=resultados_ordenados
        )
