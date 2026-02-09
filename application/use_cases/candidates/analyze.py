"""Use case para análise de candidatos."""
import os
import hashlib
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
        
        # Gera hash da vaga para análises consistentes
        vaga_hash = hashlib.md5(query.lower().strip().encode()).hexdigest()[:8]
        print(f"[DEBUG] Hash da vaga para consistência: {vaga_hash}")
        
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
        
        # Modelo LLM - Inicialização robusta com teste de conectividade
        llm_model = None
        try:
            from llama_index.llms.groq import Groq
            import os
            
            # Verifica se GROQ_API_KEY existe e não está vazia
            groq_api_key = os.getenv("GROQ_API_KEY")
            if not groq_api_key or groq_api_key.strip() == "":
                raise ValueError("GROQ_API_KEY não encontrada ou está vazia nas variáveis de ambiente")
            
            print(f"[DEBUG] Utilizando GROQ_API_KEY: {groq_api_key[:8]}...")
            
            # Cria instância do LLM sempre nova para evitar problemas de contexto
            # Configuração otimizada para MÁXIMA CONSISTÊNCIA
            llm_model = Groq(
                model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                api_key=groq_api_key,
                temperature=0.05,  # Ainda mais baixo para máxima consistência
                max_tokens=1500,
                top_p=0.85,       # Mais restritivo
                frequency_penalty=0.2,  # Maior para evitar repetições de erros
            )
            
            # Testa conectividade com uma pergunta simples
            try:
                test_response = await llm_model.acomplete("Responda apenas: OK")
                print(f"[DEBUG] Teste de conectividade LLM: {str(test_response)[:50]}")
            except Exception as test_e:
                print(f"[ERROR] Teste de conectividade falhou: {str(test_e)}")
                if "401" in str(test_e) or "Unauthorized" in str(test_e):
                    raise ValueError(f"GROQ_API_KEY inválida ou expirada: {str(test_e)}")
                else:
                    raise ValueError(f"Erro de conectividade com Groq API: {str(test_e)}")
            
            print("[INFO] LLM inicializado e testado com sucesso")
            
        except Exception as e:
            print(f"[ERROR] Falha ao configurar/testar LLM: {str(e)}")
            return SearchResponseDTO(
                query=query,
                response=f"ERRO na configuração do LLM: {str(e)}\n\nVerifique se a GROQ_API_KEY no arquivo .env está correta e não expirou.",
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
            
            # Prompt estruturado para MÁXIMA CONSISTÊNCIA
            prompt = f"""
Você é um recrutador técnico experiente. Siga RIGOROSAMENTE os critérios padronizados abaixo.

ID DA VAGA: {vaga_hash} (Use para manter consistência entre análises)
VAGA: {query}

CURRÍCULO DO CANDIDATO:
{texto_completo}

CRITÉRIOS DE AVALIAÇÃO PADRONIZADOS:

*** ESCALA DE NOTAS (OBRIGATORIA):
• 0-20: Nao atende requisitos basicos ou area completamente diferente
• 21-40: Atende poucos requisitos, experiencia insuficiente  
• 41-60: Atende requisitos basicos, experiencia limitada
• 61-75: Bom match, algumas lacunas menores
• 76-85: Muito bom match, poucas lacunas
• 86-95: Excelente match, requisitos + diferenciais
• 96-100: Candidato ideal, todos requisitos + multiplos diferenciais

*** CRITERIOS OBRIGATORIOS:
1. Experiencia na area de atuacao da vaga
2. Habilidades tecnicas principais mencionadas na vaga
3. Nivel de senioridade compativel
4. Formacao ou experiencia equivalente

⚖ REGRA DE ESCOLARIDADE (CRITICA - FOLLOW RIGOROSAMENTE):
*** ATENCAO MAXIMA - LEIA 3 VEZES: ***

SE O CANDIDATO ESTA CURSANDO GRADUACAO/FACULDADE/UNIVERSIDADE = ELE TEM ENSINO MEDIO COMPLETO!
SE O CANDIDATO TEM POS/MESTRADO/DOUTORADO = ELE TEM GRADUACAO + ENSINO MEDIO COMPLETO!

> NUNCA, JAMAIS, EM HIPOTESE ALGUMA escreva "nao tem ensino medio" se ele esta cursando superior
> NUNCA, JAMAIS, EM HIPOTESE ALGUMA escreva "nao atende ensino fundamental/medio" se esta em graduacao  
> GRADUACAO EM CURSO = ENSINO MEDIO COMPLETO (sem excecoes!)
> EXPERIENCIA PROFISSIONAL COMPROVADA = PODE COMPENSAR FORMACAO FORMAL

*** EXEMPLOS CORRETOS DE ESCOLARIDADE:
+ "Atende requisito de escolaridade (cursando Engenharia - tem ensino medio completo)"
+ "Requisito de ensino medio: ATENDIDO (esta em graduacao)"  
+ "Escolaridade adequada: graduacao em curso (ensino medio completo)"

*** EXEMPLOS ERRADOS (NUNCA FACA ISSO):
- "Nao tem ensino medio (esta cursando graduacao)" ← ERRO GRAVE!
- "Nao atende ensino fundamental/medio (cursando superior)" ← ERRO GRAVE!

*** ANALISE OBRIGATORIA:
- Liste SOMENTE competencias que estao EXPLICITAS no curriculo
- Identifique TODOS os gaps em relacao a vaga
- Seja CONSISTENTE: candidatos similares devem ter notas similares
- Use o ID da vaga {vaga_hash} como referencia para manter padrao

*** REGRAS DE CONSISTENCIA:
- Para a MESMA vaga, candidatos com perfil similar devem ter notas proximas (±5 pontos)
- Jamais varie criterios entre analises da mesma vaga
- Se em duvida entre duas notas, escolha a mais baixa (seja rigoroso)
- NUNCA penalize escolaridade se candidato esta em graduacao/pos (ele TEM ensino medio!)

*** VALIDACAO OBRIGATORIA ANTES DE FINALIZAR:
1. Se candidato cursa graduacao → TEM ensino medio (NUNCA escreva "nao tem")
2. Se tem pos/mestrado → TEM graduacao + ensino medio (NUNCA escreva "nao atende")
3. Se tem experiencia na area → Compenssa formacao
4. Pontos fortes = SO o que esta EXPLICITO no curriculo
5. RELEIA sua resposta e corrija qualquer erro de escolaridade

EXEMPLO DE ANALISE CORRETA:
- ERRADO: "Nao tem ensino medio (esta cursando Engenharia)"  
+ CORRETO: "Atende requisito de escolaridade - cursando Engenharia (tem ensino medio completo)"

*** ANTES DE ENVIAR: Verifique se nao escreveu nada como "nao atende ensino medio/fundamental" para candidato em graduacao!

Forneça a resposta EXATAMENTE neste formato:

NOME DO CANDIDATO: [extraia do currículo]
NOTA: [0-100, seja rigoroso]
PONTOS FORTES: [liste apenas competências do currículo que são RELEVANTES para esta vaga específica]
PONTOS FRACOS: [liste TODOS os requisitos da vaga que estão faltando ou são insuficientes]
JUSTIFICATIVA: [explique por que essa nota, mencione gaps específicos e matches com a vaga]

Seja honesto e crítico. Não dê notas altas sem justificativa.

EXEMPLO DE ANALISE CORRETA:
- ERRADO: "Nao tem ensino medio (esta cursando Engenharia)"  
+ CORRETO: "Tem ensino medio completo (cursando Engenharia de Software)"
"""

            try:
                print(f"[DEBUG] Enviando prompt para LLM para candidato: {file_name}")
                response = await llm_model.acomplete(prompt)
                response_text = str(response)
                print(f"[DEBUG] Resposta recebida do LLM: {response_text[:100]}...")
                
                # VALIDAÇÃO AUTOMÁTICA: Corrige erros de escolaridade na resposta
                if ("graduação" in response_text.lower() or "engenharia" in response_text.lower() or 
                    "sistemas" in response_text.lower() or "curso superior" in response_text.lower()):
                    
                    # Detecta e corrige erro comum de escolaridade
                    error_patterns = [
                        "não atende ao requisito de ensino fundamental ou médio completo (está cursando",
                        "não tem ensino médio (está cursando",
                        "não possui ensino médio completo (cursando",
                        "não atende ensino fundamental/médio (está em"
                    ]
                    
                    for pattern in error_patterns:
                        if pattern in response_text.lower():
                            print(f"[WARNING] Detectado erro de escolaridade, corrigindo automaticamente!")
                            # Substitui o erro pela versão correta
                            response_text = response_text.replace(
                                pattern.split("(")[0],
                                "ATENDE ao requisito de escolaridade"
                            )
                            break
                
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
                                score_raw = min(int(score_num), 100)
                                # Validação de consistência: normaliza notas extremas
                                if score_raw > 95 and "todos" not in response_text.lower() and "perfeito" not in response_text.lower():
                                    score_raw = min(score_raw, 85)  # Evita notas muito altas sem justificativa
                                elif score_raw < 5 and len(texto_completo) > 100:  # Se tem conteúdo, não pode ser 0
                                    score_raw = max(score_raw, 15)
                                resultado["score"] = score_raw
                                print(f"[DEBUG] Score extraído e validado: {score_raw} para {file_name}")
                        except Exception as score_error:
                            print(f"[DEBUG] Erro ao extrair score: {score_error}")
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
                        justificativa=f"ERRO de autenticação na API de análise (401 Unauthorized). Verifique a GROQ_API_KEY no arquivo .env",
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
        
        # Log de consistencia para debug
        print(f"[CONSISTENCIA] Vaga Hash: {vaga_hash}")
        print(f"[CONSISTENCIA] Notas finais: {[r.score for r in resultados_ordenados]}")
        
        # Verifica se ha variacoes extremas suspeitas
        if len(resultados_ordenados) > 1:
            scores = [r.score for r in resultados_ordenados]
            score_range = max(scores) - min(scores)
            if score_range > 80:  # Variacao muito grande pode indicar inconsistencia
                print(f"[WARNING] Variacao de notas muito alta ({score_range} pontos) - verifique consistencia")
        
        # Separa candidatos válidos dos que tiveram erro de localização (score 0 por localização)
        candidatos_validos = [r for r in resultados_ordenados if r.score > 0]
        candidatos_descartados = [r for r in resultados_ordenados if r.score == 0]

        # 5. Monta resposta textual para o frontend
        if resultados_ordenados:
            # Define critério de qualidade mínima
            NOTA_MINIMA_RECOMENDACAO = 60
            candidatos_adequados = [r for r in resultados_ordenados if r.score >= NOTA_MINIMA_RECOMENDACAO]
            candidatos_inadequados = [r for r in resultados_ordenados if r.score < NOTA_MINIMA_RECOMENDACAO]
            
            # Verifica se há erros de API
            candidatos_com_erro_api = [r for r in resultados_ordenados if "401 Unauthorized" in r.justificativa or "Erro de autenticação" in r.justificativa]
            
            if candidatos_com_erro_api:
                resposta_texto = (
                    "*** ATENCAO: Erro de autenticacao na API do Groq (401 Unauthorized)\n"
                    "Verifique a GROQ_API_KEY no arquivo .env\n\n"
                    "CANDIDATOS ENCONTRADOS (analise limitada):"
                )
                for idx, r in enumerate(resultados_ordenados, 1):
                    resposta_texto += f"\n{idx}. {r.nome_candidato} - Score: {r.score}/100"
                    if "401" in r.justificativa:
                        resposta_texto += " [ERRO API]"
                
                resposta_texto += (
                    f"\n\nTOTAL: {len(resultados_ordenados)} candidatos encontrados\n"
                    f"PROBLEMA: API key do Groq invalida ou expirada. Configure uma nova chave em .env"
                )
                
            elif candidatos_adequados:
                # Há candidatos com nota adequada - recomendar o melhor
                melhor = candidatos_adequados[0]
                resposta_texto = (
                    f"CANDIDATO RECOMENDADO: {melhor.nome_candidato} ({melhor.arquivo})\n\n"
                    f"NOTA: {melhor.score}/100"
                )
                # Adiciona informação de localização se disponível
                if melhor.location_analysis:
                    loc = melhor.location_analysis
                    resposta_texto += f"\nLOCALIZAÇÃO: {loc.match_status}"
                    
                    if loc.match_status == "REMOTE":
                        resposta_texto += " (Vaga remota - compatível)"
                    elif loc.match_status == "LOCATION_MATCH":
                        resposta_texto += f" (Compativel: {loc.candidate_location})"
                    elif loc.match_status == "WILL_RELOCATE":
                        resposta_texto += f" (Candidato disponivel: {loc.candidate_location or 'Nao informado'})"
                        resposta_texto += "\n+ Candidato disposto a mudanca"
                    elif loc.match_status == "NO_SPECIFIC_LOCATION":
                        resposta_texto += " (Vaga sem localizacao especifica)"
                    elif loc.match_status == "CANDIDATE_LOCATION_UNKNOWN":
                        resposta_texto += f" (Vaga: {loc.job_location or 'Nao especificado'} | Candidato: localizacao nao informada)"
                
                resposta_texto += (
                    f"\n\nANÁLISE:\n{melhor.justificativa}\n\n"
                    f"CANDIDATOS ADEQUADOS (Nota ≥ {NOTA_MINIMA_RECOMENDACAO}):"
                )
                
                # Lista apenas candidatos adequados
                for idx, r in enumerate(candidatos_adequados, 1):
                    loc_info = ""
                    if r.location_analysis:
                        status = r.location_analysis.match_status
                        if status == "REMOTE":
                            loc_info = " [REMOTO]"
                        elif status == "LOCATION_MATCH":
                            loc_info = " [+ Localizacao]"
                        elif status == "WILL_RELOCATE":
                            loc_info = " [+ Mudanca]"
                        elif status == "NO_SPECIFIC_LOCATION":
                            loc_info = " [Sem localizacao]"
                        elif status == "CANDIDATE_LOCATION_UNKNOWN":
                            loc_info = " [Localizacao desconhecida]"
                    
                    qualidade = "EXCELENTE" if r.score >= 85 else "MUITO BOM" if r.score >= 75 else "BOM"
                    resposta_texto += f"\n{idx}. {r.nome_candidato} - {r.score}/100 [{qualidade}]{loc_info}"
                
                # Comparação entre os melhores (máximo 3 candidatos adequados)
                if len(candidatos_adequados) > 1:
                    resposta_texto += "\n\nCOMPARAÇÃO ENTRE OS MELHORES:"
                    top_candidatos = candidatos_adequados[:3]  # Máximo 3 melhores
                    
                    for idx, candidato in enumerate(top_candidatos, 1):
                        posicao = "1º LUGAR" if idx == 1 else "2º LUGAR" if idx == 2 else "3º LUGAR"
                        resposta_texto += f"\n{posicao}: {candidato.nome_candidato} ({candidato.score}/100)"
                        
                        # Adiciona diferencial do candidato
                        if "PONTOS FORTES:" in candidato.justificativa:
                            fortes_inicio = candidato.justificativa.find("PONTOS FORTES:") + 14
                            fortes_fim = candidato.justificativa.find("PONTOS FRACOS:")
                            if fortes_fim != -1:
                                pontos_fortes = candidato.justificativa[fortes_inicio:fortes_fim].strip()
                                resposta_texto += f"\n   → Principais fortes: {pontos_fortes[:80]}..."
                    
                    # Explicação da diferença entre 1º e 2º lugar
                    if len(candidatos_adequados) >= 2:
                        primeiro = candidatos_adequados[0]
                        segundo = candidatos_adequados[1]
                        diferenca = primeiro.score - segundo.score
                        resposta_texto += f"\n\nPOR QUE {primeiro.nome_candidato} É A MELHOR OPÇÃO:"
                        resposta_texto += f"\n• Diferença de {diferenca} pontos na avaliação"
                        resposta_texto += f"\n• Score: {primeiro.score}/100 vs {segundo.score}/100"
                
                # Seção de candidatos inadequados (se houver)
                if candidatos_inadequados:
                    resposta_texto += f"\n\nCANDIDATOS COM BAIXO MATCH (Nota < {NOTA_MINIMA_RECOMENDACAO}):"
                    for r in candidatos_inadequados[:5]:  # Máximo 5 para não poluir
                        motivo = "Não atende requisitos básicos"
                        if r.score < 30:
                            motivo = "Perfil muito diferente da vaga"
                        elif r.score < 50:
                            motivo = "Experiência insuficiente"
                        resposta_texto += f"\n• {r.nome_candidato} ({r.score}/100) - {motivo}"
            
            else:
                # Nenhum candidato adequado encontrado
                melhor_inadequado = resultados_ordenados[0] if resultados_ordenados else None
                
                resposta_texto = f"NENHUM CANDIDATO ATENDE OS CRITÉRIOS MÍNIMOS\n\n"
                
                if melhor_inadequado:
                    resposta_texto += f"MELHOR CANDIDATO DISPONÍVEL: {melhor_inadequado.nome_candidato} ({melhor_inadequado.arquivo})\n"
                    resposta_texto += f"NOTA: {melhor_inadequado.score}/100 (Abaixo do mínimo recomendado: {NOTA_MINIMA_RECOMENDACAO})\n\n"
                    
                    # Adiciona informação de localização se disponível
                    if melhor_inadequado.location_analysis:
                        loc = melhor_inadequado.location_analysis
                        resposta_texto += f"LOCALIZAÇÃO: {loc.match_status}"
                        
                        if loc.match_status == "REMOTE":
                            resposta_texto += " (Vaga remota - compatível)"
                        elif loc.match_status == "LOCATION_MATCH":
                            resposta_texto += f" (Compativel: {loc.candidate_location})"
                        elif loc.match_status == "WILL_RELOCATE":
                            resposta_texto += f" (Candidato disponivel: {loc.candidate_location or 'Nao informado'})"
                            resposta_texto += "\n+ Candidato disposto a mudanca"
                        elif loc.match_status == "NO_SPECIFIC_LOCATION":
                            resposta_texto += " (Vaga sem localizacao especifica)"
                        elif loc.match_status == "CANDIDATE_LOCATION_UNKNOWN":
                            resposta_texto += f" (Vaga: {loc.job_location or 'Nao especificado'} | Candidato: localizacao nao informada)"
                    
                    resposta_texto += f"\n\nANÁLISE DO MELHOR DISPONÍVEL:\n{melhor_inadequado.justificativa}\n\n"
                    
                resposta_texto += "RECOMENDAÇÃO:\n"
                resposta_texto += "• Considere revisar os critérios da vaga\n"
                resposta_texto += "• Amplie a busca ou revise requisitos\n"
                resposta_texto += "• Nenhum candidato atual possui o perfil adequado para esta posição\n\n"
                
                resposta_texto += "TODOS OS CANDIDATOS ENCONTRADOS:"
                for idx, r in enumerate(resultados_ordenados, 1):
                    resposta_texto += f"\n{idx}. {r.nome_candidato} - Nota: {r.score}/100"
                
                # Adiciona candidatos descartados por localização (se existirem)
                if candidatos_descartados:
                    resposta_texto += "\n\nCANDIDATOS DESCARTADOS (localização incompatível):"
                    for r in candidatos_descartados:
                        motivo = r.pontos_fracos[-1] if r.pontos_fracos else 'Localização incompatível'
                        resposta_texto += f"\n• {r.nome_candidato} - MOTIVO: {motivo}"
        else:
            resposta_texto = "Nenhum candidato foi encontrado no índice."

        return SearchResponseDTO(
            query=query,
            response=resposta_texto,
            total_candidates=len(resultados_ordenados),
            ranking=resultados_ordenados
        )
