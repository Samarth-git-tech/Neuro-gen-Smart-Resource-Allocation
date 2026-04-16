"""Analyzer utility — aggregates community needs data for the analytics dashboard.
Provides summary stats on categories, urgency distribution, and pending items."""

from sqlalchemy.orm import Session
from models import Need, Task, User


def get_needs_summary(db: Session) -> dict:
    """Returns a summary of all community needs by category and status."""
    needs = db.query(Need).all()

    total = len(needs)
    by_category = {}
    by_status = {"new": 0, "reviewed": 0, "addressed": 0}

    for need in needs:
        cat = need.category or "uncategorized"
        by_category[cat] = by_category.get(cat, 0) + 1
        if need.status in by_status:
            by_status[need.status] += 1

    return {
        "total_needs": total,
        "by_category": by_category,
        "by_status": by_status,
    }


def get_task_summary(db: Session) -> dict:
    """Returns a summary of all tasks by status."""
    tasks = db.query(Task).all()

    total = len(tasks)
    by_status = {"pending": 0, "active": 0, "done": 0}

    for task in tasks:
        if task.status in by_status:
            by_status[task.status] += 1

    return {
        "total_tasks": total,
        "by_status": by_status,
    }


def get_dashboard_stats(db: Session) -> dict:
    """Combined analytics for the admin dashboard."""
    return {
        "needs": get_needs_summary(db),
        "tasks": get_task_summary(db),
        "total_users": db.query(User).count(),
        "total_volunteers": db.query(User).filter(User.role == "volunteer").count(),
        "total_helpers": db.query(User).filter(User.role == "helper").count(),
    }


def suggest_action(category: str) -> str:
    """Suggests an action based on a category."""
    mapping = {
        "food": "Organize food distribution",
        "clothes": "Arrange clothing donation",
        "shelter": "Provide temporary shelter",
        "health": "Setup medical assistance"
    }
    return mapping.get(category.lower(), "Manual review required")

import json

def analyzer(text: str) -> dict:
    """
    Lightweight text analyzer returning structured insights (dict).
    Returns basic structured insights: keywords, severity, summary.
    No heavy model required.
    """
    if not text or not text.strip():
        return {"keywords": [], "severity": "low", "summary": "Empty input."}
    
    words = text.lower().replace(",", "").replace(".", "").split()
    
    # Very basic keyword extraction (remove common stop words)
    stop_words = {"the", "is", "in", "and", "to", "a", "of", "for", "on", "with", "we", "need", "please", "this", "are", "it"}
    keywords = list(set([w for w in words if w not in stop_words and len(w) > 3]))[:5]
    
    # Very basic severity logic
    high_urgency_words = {"urgent", "immediately", "emergency", "crisis", "critical", "severe", "life-threatening", "help"}
    medium_urgency_words = {"soon", "important", "moderate", "needed", "requires"}
    
    severity = "low"
    if any(w in high_urgency_words for w in words):
        severity = "high"
    elif any(w in medium_urgency_words for w in words):
        severity = "medium"
        
    summary = f"Input mentions: {', '.join(keywords)}." if keywords else "General inquiry."
    if len(text) > 100:
        summary = text[:97] + "..."
    elif len(text) > 0:
        summary = text
        
    return {
        "keywords": keywords,
        "severity": severity,
        "summary": summary
    }
