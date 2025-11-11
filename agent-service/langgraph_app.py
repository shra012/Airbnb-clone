"""LangGraph configuration entrypoints."""

from app.services.concierge_planner import ConciergePlanner

graph = ConciergePlanner()._graph
