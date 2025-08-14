from typing import Dict
import math
import datetime

CURRENT_YEAR = datetime.datetime.utcnow().year


def calculate_publication_score(article_data: Dict) -> float:
    """
    Calculate a publication score out of 100 using objective signals:
    - Recency: newer years score higher (0-60 points)
    - Citations: more citations score higher with diminishing returns (0-40 points)

    Inputs expected keys: 'pub_year' (int), 'citation_count' (int)
    """
    year = article_data.get("pub_year")
    citations = article_data.get("citation_count")

    try:
        year = int(year) if year is not None else 0
    except Exception:
        year = 0
    try:
        citations = int(citations) if citations is not None else 0
    except Exception:
        citations = 0

    # Recency: full 60 if this year, linear decay to 0 at 15+ years old
    if year <= 0:
        recency_score = 0.0
    else:
        age = max(0, CURRENT_YEAR - year)
        recency_score = 60.0 * max(0.0, 1.0 - (age / 15.0))

    # Citations: 40 * (1 - exp(-citations / 50)) -> saturates near 40
    citations = max(0, citations)
    citations_score = 40.0 * (1.0 - math.exp(-citations / 50.0))

    total = recency_score + citations_score
    # Clamp to [0, 100]
    return float(max(0.0, min(100.0, total)))