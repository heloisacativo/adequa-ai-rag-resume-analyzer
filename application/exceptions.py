from typing import final


@final
class ArtifactNotFoundError(Exception):
    """Exception raised when an artifact is not found."""


@final
class FailedFetchArtifactMuseumAPIException(Exception):
    """Exception raised when fetching an artifact from the museum API fails."""


@final
class FailedPublishArtifactMessageBrokerException(Exception):
    """Exception raised when publishing an artifact to the message broker fails."""


@final
class BusinessRuleViolationError(Exception):
    """Exception raised when a business rule is violated."""
