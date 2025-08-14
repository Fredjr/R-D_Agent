#!/usr/bin/env python3
import sys
from typing import List
from main import generate_search_queries

OBJECTIVES = [
    "Identify mechanisms by which GLP-1 analogs reduce hepatic steatosis",
    "Characterize the role of mTOR signaling in autophagy",
    "Evaluate CRISPR off-target effects in primary human T cells",
]


def check_queries(objective: str, queries: List[str]) -> None:
    assert isinstance(queries, list), "Output must be a list"
    assert 1 <= len(queries) <= 3, "Should return 1 to 3 queries"
    for q in queries:
        assert isinstance(q, str) and q.strip(), "Each query must be a non-empty string"
    # Basic relevance: at least one token (>3 chars) from objective appears in each query
    tokens = [t.lower() for t in objective.split() if len(t) > 3]
    for q in queries:
        ql = q.lower()
        assert any(tok in ql for tok in tokens), f"Query lacks relevance to objective: {q}"


def main() -> int:
    print("Running query generation tests...\n")
    all_ok = True
    for idx, obj in enumerate(OBJECTIVES, 1):
        print(f"[{idx}] Objective: {obj}")
        queries = generate_search_queries(obj)
        for i, q in enumerate(queries, 1):
            print(f"  {i}. {q}")
        try:
            check_queries(obj, queries)
            print("  ✅ Passed structure and relevance checks\n")
        except AssertionError as e:
            all_ok = False
            print(f"  ❌ Failed: {e}\n")
    if all_ok:
        print("All tests passed ✅")
        return 0
    else:
        print("Some tests failed ❌")
        return 1


if __name__ == "__main__":
    sys.exit(main())
