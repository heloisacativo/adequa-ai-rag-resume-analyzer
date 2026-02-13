from typing import Protocol

class ResumeValidatorProtocol(Protocol):
    async def is_resume(self, text: str) -> bool:
        """Validate if the given text content represents a resume/CV"""
        ...