from dataclasses import dataclass
from typing import final
from uuid import uuid4

from llama_index.core.llms import LLM

from application.interfaces.ai.analyzer import AIAnalyzerProtocol
from application.dtos.candidate.candidate import CandidateAnalysisDTO

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class OllamaAnalyzer(AIAnalyzerProtocol):
    """Analisa currículos com qualquer LLM (Groq, Ollama, etc.). Nome mantido por compatibilidade."""
    llm: LLM
    
    async def analyze_candidate(
        self, 
        chunks: list[str], 
        job_description: str
    ) -> CandidateAnalysisDTO:
        from llama_index.core import Settings as LlamaSettings
        print(f"DEBUG: Using LLM: {type(self.llm)} - {self.llm}")
        print(f"DEBUG: LlamaSettings.llm: {type(LlamaSettings.llm)} - {LlamaSettings.llm}")
        print(f"DEBUG: Are they the same object? {self.llm is LlamaSettings.llm}")
        
        texto_completo = "\n\n".join(chunks)
        print(f"DEBUG: Full resume text length: {len(texto_completo)}")
        print(f"DEBUG: Resume text sample: {texto_completo[:1000]}...")
        print(f"DEBUG: Job description: {job_description}")
        
        # Verificar se a descrição da vaga é suficiente
        job_description_words = job_description.strip().split()
        if len(job_description_words) < 3 or job_description.lower().strip() in ['teste', 'test', 'abc', 'exemplo', 'sample']:
            return CandidateAnalysisDTO(
                resume_id=uuid4(),
                candidate_name="Não informado",
                file_name="",
                score=0,
                strengths=[],
                weaknesses=[],
                justification="ERRO: A descrição da vaga é insuficiente para gerar uma análise justa. Por favor, forneça uma descrição mais detalhada da vaga.",
                improvement_tips=[]
            )
        
        prompt = f"""Você é um recrutador especialista em triagem técnica (ATS). Sua tarefa é comparar um currículo estritamente com a descrição de vaga fornecida.

REGRAS OBRIGATÓRIAS:
1. ANÁLISE ESTRITA: Você só pode avaliar o candidato com base nos requisitos EXPLICITAMENTE escritos na descrição da vaga. Não assuma, não infira e não imagine requisitos que não estejam no texto.
2. PROIBIDO ALUCINAR: Se a vaga não pede "Machine Learning", você NÃO pode listar "Falta de experiência em Machine Learning" como ponto fraco. Se a vaga não pede "Java", não reclame da falta de Java.
3. JUSTIFICATIVA: Baseie sua justificativa apenas no "match" entre as palavras-chave do currículo e as da vaga.

DESCRIÇÃO DA VAGA:
{job_description}

CURRÍCULO PARA ANALISAR:
{texto_completo}

RESPOSTA ESTRUTURADA (JSON):
{{
  "candidato": "Nome encontrado no currículo",
  "nota": 0-100,
  "pontos_fortes": ["competência1", "competência2"],
  "pontos_fracos": ["falta1", "falta2"],
  "justificativa": "análise baseada apenas no match entre currículo e vaga",
  "dicas_de_melhoria": ["dica prática 1 para melhorar o currículo ou a candidatura", "dica 2", "dica 3"]
}}

As "dicas_de_melhoria" devem ser sugestões objetivas e acionáveis para o candidato melhorar o currículo ou aumentar as chances para esta vaga (ex: incluir palavra-chave X, destacar experiência em Y, fazer curso Z). Entre 2 e 5 dicas."""
        
        print(f"DEBUG: Generated prompt length: {len(prompt)}")
        response = self.llm.complete(prompt)
        response_text = str(response)
        print(f"DEBUG: LLM response: {response_text}")
        
        # Parse da resposta
        return self._parse_response(response_text)
    
    def _parse_response(self, text: str) -> CandidateAnalysisDTO:
        import json
        
        try:
            # Tentar fazer parse do JSON
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_text = text[json_start:json_end]
                data = json.loads(json_text)
                
                return CandidateAnalysisDTO(
                    resume_id=uuid4(),
                    candidate_name=data.get('candidato', 'Não informado'),
                    file_name="",
                    score=min(max(data.get('nota', 0), 0), 100),
                    strengths=data.get('pontos_fortes', []),
                    weaknesses=data.get('pontos_fracos', []),
                    justification=data.get('justificativa', text),
                    improvement_tips=data.get('dicas_de_melhoria', [])
                )
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
        
        # Fallback para parsing de texto se JSON falhar
        lines = text.split('\n')
        
        nome = "Desconhecido"
        score = 50
        strengths = []
        weaknesses = []
        justification = text
        
        for line in lines:
            line_upper = line.upper()
            if 'NOME' in line_upper and ':' in line:
                nome = line.split(':', 1)[1].strip()
            elif 'NOTA' in line_upper and ':' in line:
                try:
                    score_str = ''.join(filter(str.isdigit, line.split(':', 1)[1]))
                    if score_str:
                        score = min(int(score_str), 100)
                except:
                    pass
            elif 'FORTES' in line_upper and ':' in line:
                strengths = [s.strip() for s in line.split(':', 1)[1].split('|') if s.strip()]
            elif 'FRACOS' in line_upper and ':' in line:
                weaknesses = [s.strip() for s in line.split(':', 1)[1].split('|') if s.strip()]
            elif 'JUSTIFICATIVA' in line_upper and ':' in line:
                justification = line.split(':', 1)[1].strip()
        
        improvement_tips = []
        for line in lines:
            if 'DICAS' in line.upper() or 'MELHORIA' in line.upper():
                if ':' in line:
                    improvement_tips = [s.strip() for s in line.split(':', 1)[1].split('|') if s.strip()]
                break

        return CandidateAnalysisDTO(
            resume_id=uuid4(),
            candidate_name=nome,
            file_name="",
            score=score,
            strengths=strengths,
            weaknesses=weaknesses,
            justification=justification,
            improvement_tips=improvement_tips
        )