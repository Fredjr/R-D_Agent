# Week 24: Experiment Planner Regression Fix & PDF Figure Extraction Fix

**Date**: 2025-11-23  
**Status**: ✅ COMPLETE - Ready for Testing

---

## 🎯 OBJECTIVES

Fix two critical regressions identified in production:

1. **Experiment Plan Regression**: Multi-agent system producing LESS detailed plans than legacy system
2. **PDF Figure Extraction**: Figures not displaying correctly in Smart Inbox UI

---

## 📊 ISSUE 1: EXPERIMENT PLAN REGRESSION

### Problem Analysis

**User Report**: "Experiment plan after the multi agent orchestration. Evaluate the output and gaps or regressions. We used to have more details before that are now empty or less detailed for the same PMID paper."

**Root Cause Identified**:
- `MultiAgentOrchestrator` (orchestrator.py lines 144-151) was **hardcoding empty arrays** for 5 critical fields
- `CoreExperimentAgent` was only generating 8 fields instead of 15 fields

**Fields Missing (BEFORE fix)**:
- ❌ `risk_assessment.risks` → Empty array
- ❌ `risk_assessment.mitigation_strategies` → Empty array
- ❌ `troubleshooting_guide` → Empty array
- ❌ `safety_considerations` → Empty array
- ❌ `required_expertise` → Empty array
- ❌ `timeline_estimate` → Generic "To be determined"
- ❌ `estimated_cost` → Generic "To be determined"
- ❌ `difficulty_level` → Generic "moderate"

**Comparison (OLD vs NEW)**:

| Field | BEFORE Multi-Agent | AFTER Multi-Agent (Broken) | AFTER Fix |
|-------|-------------------|---------------------------|-----------|
| `risk_assessment.risks` | ✅ 2 risks | ❌ Empty | ✅ 2+ risks |
| `risk_assessment.mitigation_strategies` | ✅ 2 strategies | ❌ Empty | ✅ 2+ strategies |
| `troubleshooting_guide` | ✅ 2 issues | ❌ Empty | ✅ 2+ issues |
| `safety_considerations` | ✅ 2 items | ❌ Empty | ✅ 2+ items |
| `required_expertise` | ✅ 2 items | ❌ Empty | ✅ 2+ items |
| `materials` | ✅ 3 specific | ⚠️ 6 generic | ✅ 6+ specific |
| `procedure` | ✅ 3 detailed | ⚠️ 6 less detailed | ✅ 6+ detailed |

### Solution Implemented

#### 1. Updated `CoreExperimentAgent` (core_experiment_agent.py)

**Changes**:
- ✅ Expanded validation to require ALL 15 fields (lines 62-102)
- ✅ Enhanced prompt with rich contextual details (lines 104-206)
- ✅ Added previous experiment results to context (for learning)
- ✅ Added project decisions to context (for alignment)
- ✅ Expanded JSON schema to include ALL fields (lines 208-290)
- ✅ Added detailed examples and instructions for each field

**New Context Included**:
- Protocol materials and steps
- Research question rationales
- Hypothesis rationales
- Previous experiment results (what worked, what didn't)
- Project decisions (for strategic alignment)

**Enhanced Instructions**:
- "Be HIGHLY SPECIFIC with amounts, times, measurements, and methods"
- "Reference the protocol materials and steps provided above"
- "Learn from previous experiment results - avoid past mistakes, build on successes"
- "Include AT LEAST 2 risks with corresponding mitigation strategies"
- "Include AT LEAST 2 troubleshooting scenarios"
- "Include AT LEAST 2 safety considerations"
- "Include AT LEAST 2 required expertise areas"

#### 2. Updated `MultiAgentOrchestrator` (orchestrator.py)

**Changes**:
- ✅ Removed hardcoded empty arrays (lines 131-149)
- ✅ Now uses CoreExperimentAgent output for ALL fields
- ✅ Falls back to defaults only if agent doesn't provide values

**BEFORE (Broken)**:
```python
final_plan["risk_assessment"] = {"risks": [], "mitigation_strategies": []}  # ❌ HARDCODED!
final_plan["troubleshooting_guide"] = []  # ❌ HARDCODED!
final_plan["safety_considerations"] = []  # ❌ HARDCODED!
final_plan["required_expertise"] = []  # ❌ HARDCODED!
```

**AFTER (Fixed)**:
```python
"risk_assessment": core.get("risk_assessment", {"risks": [], "mitigation_strategies": []}),
"troubleshooting_guide": core.get("troubleshooting_guide", []),
"safety_considerations": core.get("safety_considerations", []),
"required_expertise": core.get("required_expertise", []),
```

### Expected Outcome

**Multi-agent system will now produce RICHER and MORE CONTEXTUAL plans than legacy system**:
- ✅ All 15 fields populated with detailed, specific content
- ✅ Materials list with specific suppliers and catalog numbers
- ✅ Procedure steps with realistic durations and critical notes
- ✅ Risk assessment with specific risks and mitigation strategies
- ✅ Troubleshooting guide with actionable solutions
- ✅ Safety considerations specific to the protocol
- ✅ Required expertise areas clearly identified
- ✅ Learning from previous experiment results
- ✅ Alignment with project decisions

---

## 🖼️ ISSUE 2: PDF FIGURE EXTRACTION

### Problem Analysis

**User Report**: "Figures are not correctly extracted and rendered"

**Investigation Results**:
- ✅ PDF extraction IS running (pdf_extracted_at: "2025-11-23T10:58:32.316068+00:00")
- ✅ 1 figure IS being extracted
- ❌ BUT image_data is CORRUPTED (just repeated characters: AAAA, AQEB, etc.)

**Root Cause**:
- `_extract_figures()` was extracting raw compressed image data from PDF
- Raw data was base64-encoded directly WITHOUT proper decoding
- Frontend expects data URI format: `data:image/png;base64,...`
- Raw compressed data is NOT a valid image format

### Solution Implemented

#### 1. Updated `_extract_figures()` (pdf_text_extractor.py lines 430-528)

**Changes**:
- ✅ Added PIL/Pillow for proper image processing
- ✅ Decode raw image data using PIL Image.frombytes()
- ✅ Handle different color spaces (RGB, Grayscale, CMYK)
- ✅ Convert all images to RGB or Grayscale
- ✅ Resize large images (max 800px width) to reduce size
- ✅ Convert to PNG format (web-compatible)
- ✅ Create proper data URI: `data:image/png;base64,{base64_data}`
- ✅ Graceful error handling with fallback to Image.open()

#### 2. Added Pillow Dependency (requirements.txt)

**Changes**:
- ✅ Added `Pillow>=10.0.0` to requirements.txt (line 33)

### Expected Outcome

- ✅ Figures will display correctly in Smart Inbox UI
- ✅ Images will be properly decoded and re-encoded as PNG
- ✅ Data URI format will work with `<img src={figure.image_data} />`
- ✅ Large images will be resized to reduce bandwidth
- ✅ All color spaces will be handled correctly

---

## 📁 FILES MODIFIED

1. **backend/app/services/agents/core_experiment_agent.py** (190 → 292 lines)
   - Expanded validation to require 15 fields
   - Enhanced prompt with rich contextual details
   - Expanded JSON schema with detailed examples

2. **backend/app/services/agents/orchestrator.py** (196 lines)
   - Removed hardcoded empty arrays
   - Now uses CoreExperimentAgent output for all fields

3. **backend/app/services/pdf_text_extractor.py** (482 → 530 lines)
   - Rewrote `_extract_figures()` with PIL/Pillow
   - Proper image decoding and re-encoding
   - Data URI format for web display

4. **requirements.txt** (52 → 53 lines)
   - Added Pillow>=10.0.0 dependency

---

## 🧪 TESTING PLAN

### Test 1: Experiment Plan Quality
1. Create new experiment plan for STOPFOP trial (PMID 35650602)
2. Verify ALL 15 fields are populated
3. Verify risk_assessment has 2+ risks and mitigation strategies
4. Verify troubleshooting_guide has 2+ scenarios
5. Verify safety_considerations has 2+ items
6. Verify required_expertise has 2+ items
7. Compare with legacy system output - should be RICHER

### Test 2: PDF Figure Extraction
1. Trigger PDF extraction for PMID 39973977 (flame-wall paper)
2. Verify figure is extracted with valid image_data
3. Verify image_data starts with "data:image/png;base64,"
4. Verify image displays correctly in Smart Inbox UI
5. Test with multiple papers with different image formats

---

## 🚀 DEPLOYMENT STEPS

1. **Install Pillow** (production):
   ```bash
   pip install Pillow>=10.0.0
   ```

2. **Restart backend** to load new code

3. **Re-extract PDFs** for papers with corrupted figures:
   ```bash
   curl -X GET "https://r-dagent-production.up.railway.app/api/articles/39973977/pdf-text?force_refresh=true" \
     -H "User-ID: fredericle75019@gmail.com"
   ```

4. **Test experiment plan generation** with multi-agent system

---

## ✅ SUCCESS CRITERIA

- [ ] All 15 fields populated in experiment plans
- [ ] Risk assessment has 2+ risks and mitigation strategies
- [ ] Troubleshooting guide has 2+ scenarios
- [ ] Safety considerations has 2+ items
- [ ] Required expertise has 2+ items
- [ ] Figures display correctly in Smart Inbox UI
- [ ] Image data is valid PNG in data URI format
- [ ] Multi-agent plans are RICHER than legacy plans

---

**Status**: Ready for deployment and testing

