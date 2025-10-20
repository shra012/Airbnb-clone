"""Custom exceptions for the concierge service."""

class ConciergeConfigurationError(RuntimeError):
    """Raised when required configuration (API keys, etc.) is missing."""


class ConciergePlanningError(RuntimeError):
    """Raised when the concierge planning workflow fails."""


class RateLimitExceededError(RuntimeError):
    """Raised when the concierge endpoint receives too many requests."""

    def __init__(self, retry_after: float) -> None:
        super().__init__("Rate limit exceeded.")
        self.retry_after = retry_after
