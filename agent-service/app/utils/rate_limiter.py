"""Simple in-memory sliding window rate limiter."""

from __future__ import annotations

import time
from collections import deque
from typing import Deque

from ..exceptions import RateLimitExceededError


class SlidingWindowRateLimiter:
    """Naive in-process rate limiter suitable for single-worker dev environments."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._events: Deque[float] = deque()

    def check(self) -> None:
        """Raise RateLimitExceededError if the request exceeds the quota."""
        now = time.monotonic()
        window_start = now - self.window_seconds

        while self._events and self._events[0] < window_start:
            self._events.popleft()

        if len(self._events) >= self.max_requests:
            retry_after = self.window_seconds - (now - self._events[0])
            raise RateLimitExceededError(max(retry_after, 0.0))

        self._events.append(now)
