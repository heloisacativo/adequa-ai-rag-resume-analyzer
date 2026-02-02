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
        
        # Modelo LLM - Inicialização mais robusta para evitar problemas de contexto
        try:
            from llama_index.llms.groq import Groq
            import os
            
            # Tenta usar Settings primeiro, mas fallback para inicialização manual se necessário
            llm_model = Settings.llm
            
            # Verifica se o LLM está configurado corretamente
            if not llm_model or not hasattr(llm_model, 'api_key') or not llm_model.api_key:
                print("[WARNING] LLM global não configurado corretamente, inicializando manualmente...")
                groq_api_key = os.getenv("GROQ_API_KEY")
                if not groq_api_key:
                    raise ValueError("GROQ_API_KEY não encontrada nas variáveis de ambiente")
                
                llm_model = Groq(
                    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                    api_key=groq_api_key,
                    temperature=0,
                )
                print("[INFO] LLM inicializado manualmente com sucesso")
            
        except Exception as e:
            print(f"[ERROR] Falha ao configurar LLM: {str(e)}")
            return SearchResponseDTO(
                query=query,
                response=f"Erro na configuração do LLM: {str(e)}",
                total_candidates=0,
                ranking=[]
            )

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
                print(f"[ERROR] Erro ao processar candidato {file_name}: {str(e)}")
                # Para erros de API (como 401), ainda adiciona o candidato com score básico
                # para que não seja perdido completamente
                if "401" in str(e) or "Unauthorized" in str(e):
                    # API key inválida - usa score padrão baseado na existência do candidato
                    resultado_erro = CandidateResultDTO(
                        arquivo=file_name,
                        nome_candidato=file_name.replace('.pdf', '').replace('-', ' ').title(),
                        score=60,  # Score padrão quando não consegue analisar
                        pontos_fortes=["Candidato presente no banco de currículos"],
                        pontos_fracos=["Análise detalhada indisponível (erro de API)"],
                        justificativa=f"❌ Erro de autenticação na API de análise (401 Unauthorized). Verifique a GROQ_API_KEY no arquivo .env",
                        location_analysis=location_analysis
                    )
                else:
                    # Outros erros
                    resultado_erro = CandidateResultDTO(
                        arquivo=file_name,
                        nome_candidato=file_name.replace('.pdf', '').replace('-', ' ').title(),
                        score=40,  # Score baixo para erros desconhecidos
                        pontos_fortes=[],
                        pontos_fracos=["Erro no processamento"],
                        justificativa=f"Erro ao processar: {str(e)}",
                        location_analysis=location_analysis
                    )
                
                resultados.append(resultado_erro)

        # 4. Ordena por score (inclui candidatos com erro para debug)
        resultados_ordenados = sorted(
            resultados,  # Inclui TODOS os candidatos, mesmo com erro
            key=lambda x: x.score, 
            reverse=True
        )
        
        # Separa candidatos válidos dos que tiveram erro de localização (score 0 por localização)
        candidatos_validos = [r for r in resultados_ordenados if r.score > 0]
        candidatos_descartados = [r for r in resultados_ordenados if r.score == 0]

        # 5. Monta resposta textual para o frontend
        if resultados_ordenados:
            melhor = resultados_ordenados[0]
            
            # Verifica se há erros de API
            candidatos_com_erro_api = [r for r in resultados_ordenados if "401 Unauthorized" in r.justificativa or "Erro de autenticação" in r.justificativa]
            
            if candidatos_com_erro_api:
                resposta_texto = f"""
⚠️ ATENÇÃO: Erro de autenticação na API do Groq (401 Unauthorized)
Verifique a GROQ_API_KEY no arquivo .env

CANDIDATOS ENCONTRADOS (análise limitada):
"""
                for idx, r in enumerate(resultados_ordenados, 1):
                    resposta_texto += f"\n{idx}. {r.nome_candidato} - Score: {r.score}/100"
                    if "401" in r.justificativa:
                        resposta_texto += " [ERRO API]"
                
                resposta_texto += f"""

TOTAL: {len(resultados_ordenados)} candidatos encontrados
PROBLEMA: API key do Groq inválida ou expirada. Configure uma nova chave em .env"""
                
            else:
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
            total_candidates=len(resultados_ordenados),  # Mostra todos os candidatos, mesmo com erro
            ranking=resultados_ordenados
        )
