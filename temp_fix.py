                    if html and len(html) > 2000:
                        return (html, "full_text", "pmc", {"resolved_pmcid": pmcid, "resolved_source": "pmc"})
                    except Exception:
                        pass
