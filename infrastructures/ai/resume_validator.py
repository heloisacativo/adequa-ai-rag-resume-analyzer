from dataclasses import dataclass
from typing import final

from llama_index.core.llms import LLM

from application.interfaces.ai.validator import ResumeValidatorProtocol

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ResumeValidator(ResumeValidatorProtocol):
    """Valida se um documento é um currículo usando LLM"""
    llm: LLM

    async def is_resume(self, text: str) -> bool:
        """Verifica se o texto representa um currículo válido"""
        if not text or len(text.strip()) < 100:
            return False

        prompt = f"""Analise o texto fornecido e determine se ele representa um currículo profissional (CV/resume) válido.

Um currículo típico contém:
- Informações pessoais (nome, contato)
- Experiência profissional
- Formação acadêmica
- Habilidades/competências
- Idiomas ou outras seções relevantes

Responda apenas com "SIM" se for um currículo válido, ou "NÃO" se não for.

Texto a analisar:
{text[:2000]}...  # Limita para não exceder token limits

Resposta:"""

        try:
            response = await self.llm.acomplete(prompt)
            answer = response.text.strip().upper()
            return answer == "SIM"
        except Exception:
            return False