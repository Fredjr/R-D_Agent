# Manual Testing Guide: Week 22 Features
**Rich Data Flow: Triage → Protocol → Experiment**

---

## 🎯 Overview

This guide will help you manually test the complete data flow from triage evidence extraction through protocol tables/figures to experiment confidence predictions.

**Test Paper:** PMID 36572499 (STOPFOP trial - has tables and figures)  
**Project ID:** 804494b5-69e0-4b9a-9c7b-f7fb2bddef64

---

## ✅ Test 1: Triage Evidence Extraction

### What to Test:
- AI extracts evidence quotes from paper abstract
- Quotes are linked to specific hypotheses
- Evidence appears in the paper card UI

### Steps:

1. **Navigate to Project Inbox**
   - Go to your project page
   - Click on "Explore" or "Inbox" tab

2. **Triage a Paper**
   - Search for PMID: `36572499`
   - Click "Triage with AI" button
   - Wait for triage to complete (~10-30 seconds)

3. **Verify Evidence Extraction**
   - Look for the paper card in your inbox
   - Check for "Evidence from Paper" section (collapsible)
   - Click to expand evidence section

4. **What to Look For:**
   ```
   ✅ Evidence Excerpts section visible
   ✅ Quotes displayed in italic with quotation marks
   ✅ "Relevance:" explanation shown
   ✅ "Linked to:" shows hypothesis/question ID
   ✅ Hypothesis Relevance Breakdown section visible
   ✅ Support type badges (supports/contradicts/tests)
   ✅ Score and reasoning for each hypothesis
   ```

5. **Screenshot Checklist:**
   - [ ] Paper card with evidence section collapsed
   - [ ] Paper card with evidence section expanded
   - [ ] Evidence quote with linked hypothesis ID
   - [ ] Hypothesis relevance breakdown

---

## ✅ Test 2: Protocol Tables & Figures Extraction

### What to Test:
- Tables extracted from PDF using pdfplumber
- Figures extracted from PDF using PyPDF2
- GPT-4 Vision analyzes figures
- Tables and figures render correctly in UI

### Steps:

1. **Extract Protocol**
   - Find the triaged paper (PMID 36572499)
   - Click "Extract Protocol" button
   - Wait for extraction (~30-60 seconds)

2. **Open Protocol Details**
   - Click on the extracted protocol card
   - Protocol detail modal should open

3. **Verify Tables Section**
   - Scroll down to "📊 Tables from Paper" section
   - Check if tables are displayed

4. **What to Look For (Tables):**
   ```
   ✅ "📊 Tables from Paper" heading visible
   ✅ Table number and page shown (e.g., "Table 1 (Page 3)")
   ✅ Row/column count displayed (e.g., "5 rows × 3 columns")
   ✅ Table headers in gray background
   ✅ Table rows with data
   ✅ Horizontal scrolling for wide tables
   ```

5. **Verify Figures Section**
   - Scroll down to "🖼️ Figures from Paper" section
   - Check if figures are displayed

6. **What to Look For (Figures):**
   ```
   ✅ "🖼️ Figures from Paper" heading visible
   ✅ Figure number and page shown (e.g., "Figure 1 (Page 4)")
   ✅ Dimensions displayed (e.g., "800×600px")
   ✅ Image rendered (should see actual figure)
   ✅ White background around image
   ✅ "🤖 AI Analysis" section below figure
   ✅ GPT-4 Vision analysis text describing the figure
   ```

7. **Screenshot Checklist:**
   - [ ] Protocol modal with tables section
   - [ ] Table with headers and rows
   - [ ] Protocol modal with figures section
   - [ ] Figure image rendered
   - [ ] GPT-4 Vision analysis text

---

## ✅ Test 3: Experiment Confidence Predictions

### What to Test:
- Experiment plans predict confidence changes
- Success/failure scenarios shown
- Predictions displayed in UI

### Steps:

1. **Generate Experiment Plan**
   - Open the protocol detail modal
   - Click "Generate Experiment Plan" button
   - Wait for generation (~20-40 seconds)

2. **Open Experiment Plan Details**
   - Click on the generated experiment plan card
   - Experiment plan detail modal should open

3. **Verify Confidence Predictions**
   - Scroll down to "Additional Notes" or "Execution & Results" section
   - Look for "Confidence Predictions" subsection

4. **What to Look For:**
   ```
   ✅ "Additional Notes" section visible
   ✅ "Confidence Predictions" heading in notes
   ✅ JSON structure with hypothesis IDs
   ✅ Current confidence value
   ✅ Predicted confidence if success
   ✅ Predicted confidence if failure
   ✅ Reasoning for each prediction
   ```

5. **Example Format:**
   ```json
   {
     "hypothesis_id_1": {
       "current_confidence": 50,
       "predicted_confidence_if_success": 85,
       "predicted_confidence_if_failure": 30,
       "reasoning": "If experiment succeeds, it will strongly support..."
     }
   }
   ```

6. **Verify Generation Confidence**
   - Scroll to bottom of modal
   - Check footer for "Confidence: XX%" badge

7. **Screenshot Checklist:**
   - [ ] Experiment plan modal
   - [ ] Additional notes section with confidence predictions
   - [ ] Generation confidence in footer

---

## ✅ Test 4: Cross-Service Learning

### What to Test:
- Experiment plan mentions triage insights
- Protocol comparison with previous protocols
- Memory context from past experiments

### Steps:

1. **Extract Multiple Protocols**
   - Extract protocol from PMID 36572499
   - Extract protocol from another paper (e.g., PMID 12345678)

2. **Generate Experiment Plan from Second Protocol**
   - Open second protocol
   - Generate experiment plan
   - Check if plan mentions first protocol

3. **What to Look For:**
   ```
   ✅ Experiment plan mentions previous protocols
   ✅ Plan references past experiment results (if any)
   ✅ Plan shows awareness of project context
   ✅ Linked questions and hypotheses displayed
   ✅ Research context section shows connections
   ```

4. **Verify Research Context**
   - In experiment plan modal
   - Look for "🔗 Research Context" section
   - Should show linked questions and hypotheses

5. **Screenshot Checklist:**
   - [ ] Experiment plan with research context
   - [ ] Linked questions section
   - [ ] Linked hypotheses section

---

## 📊 Quality Checks

### Evidence Quality:
- [ ] Quotes are relevant to paper content
- [ ] Quotes are properly linked to hypotheses
- [ ] Relevance explanations make sense

### Tables Quality:
- [ ] Tables are properly formatted
- [ ] Headers are correct
- [ ] Data is readable
- [ ] No missing or garbled text

### Figures Quality:
- [ ] Images are clear and visible
- [ ] Correct aspect ratio (not stretched)
- [ ] GPT-4 Vision analysis is accurate
- [ ] Analysis describes key elements of figure

### Experiment Predictions Quality:
- [ ] Confidence predictions are reasonable
- [ ] Success/failure scenarios make sense
- [ ] Reasoning is clear and logical
- [ ] Predictions align with hypothesis

---

## 💰 Token Usage Monitoring

### Check OpenAI Dashboard:
1. Go to https://platform.openai.com/usage
2. Check recent API calls
3. Look for GPT-4 Vision calls (figures analysis)
4. Verify cost is ~$0.02 per paper

### Expected Usage:
- **Triage:** ~500-1000 tokens (GPT-4o-mini)
- **Protocol:** ~1000-2000 tokens (GPT-4o-mini)
- **Figures:** ~200 tokens per figure (GPT-4 Vision)
- **Experiment:** ~1500-3000 tokens (GPT-4o-mini)

**Total per paper:** ~$0.05-0.10

---

## 🐛 Known Issues

1. **Foreign Key Constraint Error**
   - If you see "test-user not in users table"
   - Use a real user account from your database
   - This is expected for test users

2. **PDF Not Available**
   - Some papers don't have open access PDFs
   - Tables/figures will be empty
   - This is expected behavior

3. **Slow Extraction**
   - PDF extraction can take 30-60 seconds
   - GPT-4 Vision adds 5-10 seconds per figure
   - This is normal

---

## ✅ Success Criteria

### Triage:
- ✅ Evidence quotes extracted
- ✅ Quotes linked to hypotheses
- ✅ UI renders evidence correctly

### Protocol:
- ✅ Tables extracted and displayed
- ✅ Figures extracted and displayed
- ✅ GPT-4 Vision analysis present

### Experiment:
- ✅ Confidence predictions generated
- ✅ Success/failure scenarios shown
- ✅ UI displays predictions

### Cross-Service:
- ✅ Experiment mentions protocol
- ✅ Memory context retrieved
- ✅ Research context displayed

---

## 📝 Feedback Form

After testing, please provide feedback on:

1. **Evidence Extraction:**
   - Are the quotes relevant?
   - Are they properly linked?
   - Is the UI clear?

2. **Tables & Figures:**
   - Are tables formatted correctly?
   - Are figures clear and visible?
   - Is the GPT-4 Vision analysis useful?

3. **Confidence Predictions:**
   - Are predictions reasonable?
   - Is the reasoning clear?
   - Is the UI helpful?

4. **Overall Experience:**
   - Does the data flow make sense?
   - Is the UI intuitive?
   - Any suggestions for improvement?

---

## 🎉 Conclusion

If all tests pass, Week 22 features are fully operational! 🚀

**Next Steps:**
- Monitor production usage
- Gather user feedback
- Optimize token usage if needed
- Improve GPT-4 Vision prompts based on quality

