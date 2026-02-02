"""Implementação do analisador de localização geográfica."""
from dataclasses import dataclass
from typing import final

from llama_index.core.llms import LLM

from application.interfaces.ai.location_analyzer import LocationAnalyzerProtocol
from application.dtos.candidate.location import LocationAnalysis


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class LocationAnalyzer(LocationAnalyzerProtocol):
    """Analisador de localização que analisa o currículo do candidato para extrair informações de localização."""
    
    llm: LLM
    
    async def analyze_location(
        self,
        job_description: str,
        resume_text: str
    ) -> LocationAnalysis:
        """
        Analisa a compatibilidade geográfica entre vaga e candidato.
        Considera se a vaga é remota ou tem localização específica.
        """
        # Modelo LLM para análise
        llm_model = self.llm
        
        # Primeiro, analisar se a vaga é remota ou tem localização específica
        job_prompt = f"""
ANÁLISE CRÍTICA DA VAGA - Determine se é REMOTA ou PRESENCIAL.

TEXTO COMPLETO DA VAGA:
{job_description}

IMPORTANTE: Analise TODO o texto fornecido, incluindo qualquer menção de localização, cidade, estado ou endereço que possa aparecer no final ou em qualquer parte do texto.

REGRAS OBRIGATÓRIAS:
1. Se contém "trabalho presencial" ou "presencial" = PRESENCIAL
2. Se contém "São Paulo", "SP", "Rio de Janeiro", "RJ" ou qualquer cidade brasileira = PRESENCIAL  
3. Se contém "remoto", "home office", "trabalho remoto" = REMOTA
4. Se NÃO especifica localização = PRESENCIAL (padrão seguro)

CIDADES BRASILEIRAS: São Paulo, Rio de Janeiro, Belo Horizonte, Salvador, Brasília, Curitiba, Porto Alegre, Recife, Fortaleza, Manaus, Belém, Goiânia, Campinas, São Luís, Maceió, Natal, João Pessoa, Aracaju, Vitória, Cuiabá, Campo Grande, Florianópolis, Palmas, Rio Branco, Macapá, Boa Vista, Porto Velho

EXTRAIA a localização exata mencionada em QUALQUER parte do texto.

FORMATO EXATO DA RESPOSTA:
TIPO_VAGA: [REMOTA ou PRESENCIAL]
LOCALIZAÇÃO_VAGA: [cidade/estado exato ou "Não especificado"]
"""

        try:
            job_response = llm_model.complete(job_prompt)
            job_response_text = str(job_response)
            
            print(f"[DEBUG LOCATION] Job prompt: {job_prompt[:200]}...")
            print(f"[DEBUG LOCATION] Job response: {job_response_text}")
            
            # Parse da análise da vaga
            job_lines = job_response_text.split('\n')
            job_type = "REMOTA"  # Default
            job_location = None
            
            for line in job_lines:
                line = line.strip()
                if line.upper().startswith('TIPO_VAGA:'):
                    job_type = line.split(':', 1)[1].strip().upper()
                elif line.upper().startswith('LOCALIZAÇÃO_VAGA:'):
                    loc_text = line.split(':', 1)[1].strip()
                    if loc_text and loc_text.upper() != 'NÃO ESPECIFICADO' and loc_text.upper() != 'NAO ESPECIFICADO':
                        job_location = loc_text
            
            print(f"[DEBUG LOCATION] Parsed job_type: {job_type}, job_location: {job_location}")
            
            # Fallback: se não conseguiu extrair localização mas a descrição contém indícios de presencial
            if not job_location and job_type == "PRESENCIAL":
                # Tentar extrair localização diretamente da descrição da vaga
                job_desc_lower = job_description.lower()
                if "são paulo" in job_desc_lower:
                    job_location = "São Paulo"
                elif "rio de janeiro" in job_desc_lower:
                    job_location = "Rio de Janeiro"
                elif "belo horizonte" in job_desc_lower:
                    job_location = "Belo Horizonte"
                elif "salvador" in job_desc_lower:
                    job_location = "Salvador"
                elif "brasília" in job_desc_lower:
                    job_location = "Brasília"
                elif "curitiba" in job_desc_lower:
                    job_location = "Curitiba"
                elif "porto alegre" in job_desc_lower:
                    job_location = "Porto Alegre"
                elif "recife" in job_desc_lower:
                    job_location = "Recife"
                elif "fortaleza" in job_desc_lower:
                    job_location = "Fortaleza"
                elif "manaus" in job_desc_lower:
                    job_location = "Manaus"
            
            # Se a vaga é remota, sempre compatível
            if job_type == "REMOTA":
                return LocationAnalysis(
                    has_location_requirement=False,
                    job_location=None,
                    candidate_location=None,  # Não precisa extrair do candidato
                    is_location_match=True,
                    willing_to_relocate=True,  # Irrelevante para remoto
                    match_status="REMOTE"
                )
            
            # Se a vaga é presencial, analisar localização do candidato
            candidate_prompt = f"""
Analise este currículo COMPLETAMENTE e extraia informações sobre a localização geográfica do candidato.

CURRÍCULO:
{resume_text}

INSTRUÇÕES DETALHADAS:
1. PROCURE CUIDADOSAMENTE por QUALQUER menção de localização no currículo
2. Priorize: endereço atual, cidade de residência, localização profissional, cidade da empresa
3. LISTA DE PRINCIPAIS CIDADES DO BRASIL para referência: São Paulo, Rio de Janeiro, Belo Horizonte, Salvador, Brasília, Curitiba, Porto Alegre, Recife, Fortaleza, Manaus, Belém, Goiânia, Campinas, São Luís, Maceió, Natal, João Pessoa, Aracaju, Vitória, Cuiabá, Campo Grande, Florianópolis, Palmas, Rio Branco, Macapá, Boa Vista, Porto Velho
4. Analise se o candidato menciona disposição para mudança/relocação/remoto/trabalho remoto
5. Se encontra menção de mudança ou trabalho remoto = SIM para disposição_mudança
6. Se NÃO menciona disposição para mudança = NAO

FORMATO DA RESPOSTA (siga exatamente):
LOCALIZAÇÃO: [cidade/estado exato encontrado, ou "Não informado"]
DISPOSIÇÃO_MUDANÇA: [SIM ou NAO]
"""

            candidate_response = llm_model.complete(candidate_prompt)
            candidate_response_text = str(candidate_response)
            
            print(f"[DEBUG LOCATION] Candidate prompt: {candidate_prompt[:200]}...")
            print(f"[DEBUG LOCATION] Candidate response: {candidate_response_text}")
            
            # Parse da resposta do candidato
            candidate_lines = candidate_response_text.split('\n')
            candidate_location = None
            willing_to_relocate = False
            
            for line in candidate_lines:
                line = line.strip()
                if line.upper().startswith('LOCALIZAÇÃO:'):
                    location_text = line.split(':', 1)[1].strip()
                    if location_text and location_text.upper() != 'NÃO INFORMADO' and location_text.upper() != 'NAO INFORMADO':
                        candidate_location = location_text
                elif line.upper().startswith('DISPOSIÇÃO_MUDANÇA:') or line.upper().startswith('DISPOSICAO_MUDANCA:'):
                    relocate_text = line.split(':', 1)[1].strip().upper()
                    willing_to_relocate = 'SIM' in relocate_text
            
            print(f"[DEBUG LOCATION] Parsed candidate_location: {candidate_location}, willing_to_relocate: {willing_to_relocate}")
            
            # Determinar compatibilidade
            is_location_match = False
            match_status = "NO_MATCH"
            
            if willing_to_relocate:
                # Candidato disposto a mudança = sempre compatível
                is_location_match = True
                match_status = "WILL_RELOCATE"
            elif candidate_location and job_location:
                # Comparar localizações com lógica mais robusta
                candidate_lower = candidate_location.lower().strip()
                job_lower = job_location.lower().strip()
                
                # Remove pontuação e normaliza
                import re
                candidate_clean = re.sub(r'[^\w\s]', '', candidate_lower)
                job_clean = re.sub(r'[^\w\s]', '', job_lower)
                
                # Verificar se as localizações são similares
                candidate_words = set(candidate_clean.split())
                job_words = set(job_clean.split())
                
                # Interseção de palavras-chave importantes (cidades, estados)
                common_words = candidate_words.intersection(job_words)
                
                # Se há pelo menos uma palavra em comum (cidade/estado), considerar match
                if common_words:
                    is_location_match = True
                    match_status = "LOCATION_MATCH"
                else:
                    match_status = "DIFFERENT_LOCATIONS"
            elif not job_location:
                # Vaga sem localização específica = compatível
                is_location_match = True
                match_status = "NO_SPECIFIC_LOCATION"
            else:
                # Candidato sem localização informada
                match_status = "CANDIDATE_LOCATION_UNKNOWN"
            
            return LocationAnalysis(
                has_location_requirement=True,
                job_location=job_location,
                candidate_location=candidate_location,
                is_location_match=is_location_match,
                willing_to_relocate=willing_to_relocate,
                match_status=match_status
            )
            
        except Exception as e:
            # Em caso de erro, assumir remoto (mais permissivo)
            return LocationAnalysis(
                has_location_requirement=False,
                job_location=None,
                candidate_location=None,
                is_location_match=True,
                willing_to_relocate=True,
                match_status="REMOTE"
            )
