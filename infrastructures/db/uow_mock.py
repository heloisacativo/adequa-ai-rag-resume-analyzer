"""Mock temporário do Unit of Work."""


class UnitOfWorkMock:
    """Mock temporário - não faz commit real."""
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass
    
    async def commit(self) -> None:
        """Commit mock - não faz nada."""
        pass
    
    async def rollback(self) -> None:
        """Rollback mock - não faz nada."""
        pass
