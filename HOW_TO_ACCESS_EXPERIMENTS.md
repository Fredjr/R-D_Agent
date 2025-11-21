# 🧪 How to Access Experiment Plans

**Quick Answer**: Navigate to **Lab → Experiments** tab in your project!

---

## 📍 Step-by-Step Guide

### **1. Navigate to Your Project**
- Go to your R-D Agent dashboard
- Click on any project to open it

### **2. Go to Lab Tab**
- Look at the main navigation tabs at the top
- Click on **"Lab"** (🔬 icon)

### **3. Select Experiments Sub-Tab**
- You'll see three sub-tabs under Lab:
  - **Protocols** (BETA)
  - **Experiments** (BETA) ← Click this one!
  - **Summaries** (BETA)

### **4. You're Now in Experiment Plans!**
- You'll see the Experiment Plans interface
- Filter by status: All, Draft, Approved, In Progress, Completed, Cancelled
- View all your experiment plans in a grid layout

---

## 🎯 How to Create Your First Experiment Plan

### **Prerequisites**:
You need at least one **protocol** extracted from a paper.

### **Steps**:

1. **Extract a Protocol First** (if you haven't already):
   - Go to **Papers → Inbox**
   - Find a paper with experimental methods
   - Click on the paper to open details
   - Click **"Extract Protocol"** button
   - Wait for AI to extract the protocol (~5-10 seconds)

2. **Navigate to Protocols Tab**:
   - Go to **Lab → Protocols**
   - You'll see your extracted protocol(s)

3. **Generate Experiment Plan**:
   - Click on a protocol card to open details
   - Look for the **"Plan Experiment"** button (purple, with beaker icon)
   - Click it to open the planning modal

4. **Customize (Optional)**:
   - Add a custom objective (or use default)
   - Add custom notes/requirements
   - Click **"Generate Plan"**

5. **Wait for AI Generation**:
   - AI will generate a comprehensive plan (~5-10 seconds)
   - Uses GPT-4o-mini for cost-effective planning
   - Considers your research questions and hypotheses

6. **View Your Plan**:
   - Plan is automatically saved
   - Navigate to **Lab → Experiments** to see it
   - Click on the plan card to view full details

---

## 📊 What You'll See in Experiment Plans Tab

### **Plan Cards Show**:
- Plan name and objective
- Status badge (draft, approved, in_progress, completed, cancelled)
- Difficulty level (easy, moderate, difficult)
- Timeline estimate
- Cost estimate
- Number of materials and steps
- Creation date

### **Status Filters**:
- **All** - Show all plans
- **Draft** - Newly generated plans
- **Approved** - Plans ready for execution
- **In Progress** - Currently running experiments
- **Completed** - Finished experiments
- **Cancelled** - Abandoned plans

### **Empty State**:
If you see "No experiment plans yet":
- You haven't generated any plans yet
- Follow the steps above to create your first plan!

---

## 🔍 Viewing Plan Details

Click on any plan card to open the detail modal:

### **What You'll See**:
- **Header**: Plan name, objective, status, difficulty, timeline, cost
- **Materials**: Complete list with amounts, sources, and notes
- **Procedure**: Step-by-step instructions with durations and critical notes
- **Expected Outcomes**: What you should observe
- **Success Criteria**: How to measure success
- **Risk Assessment**: Potential risks and mitigation strategies
- **Troubleshooting Guide**: Common issues and solutions
- **Safety Considerations**: Important safety notes
- **Required Expertise**: Skills needed

### **Actions You Can Take**:
- **Edit Status**: Change from draft → approved → in_progress → completed
- **Add Execution Notes**: Document what's happening during execution
- **Record Results**: Add results summary when completed
- **Set Outcome**: Mark as success, partial success, or failure
- **Capture Lessons Learned**: Document what you learned
- **Delete Plan**: Remove the plan (with confirmation)

---

## 🧪 Testing the Feature

### **Browser Console Test**:
We've created a comprehensive test script!

1. Open your project page
2. Navigate to Lab → Experiments
3. Open browser console (F12)
4. Copy and paste the contents of `test_experiment_plans_console.js`
5. Run: `await testExperimentPlanning()`

The test will:
- ✅ Fetch your protocols
- ✅ Fetch existing plans
- ✅ Generate a new test plan
- ✅ Update the plan through all statuses
- ✅ Add execution notes and results
- ✅ Delete the test plan
- ✅ Log everything with detailed output

---

## 🐛 Troubleshooting

### **"No experiment plans yet" but I created some**:
- Refresh the page (F5)
- Check if you're in the right project
- Check browser console for errors

### **"Plan Experiment" button not showing**:
- Make sure you're viewing a protocol detail modal
- The button is in the header, purple with a beaker icon
- Check if you're logged in

### **Plan generation fails**:
- Check browser console for errors
- Verify you have a valid protocol
- Make sure you're connected to the internet
- Check if the backend is running

### **Plans not loading**:
- Check Network tab in browser console
- Look for failed API calls to `/experiment-plans/project/{id}`
- Verify your User-ID header is being sent
- Check if you're logged in

---

## 💡 Tips

1. **Start with Simple Protocols**: Test with a simple protocol first
2. **Use Custom Objectives**: Add specific goals for better AI generation
3. **Track Progress**: Update status as you go through the experiment
4. **Document Everything**: Use execution notes to capture details
5. **Learn from Results**: Always fill in lessons learned for future reference

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors (F12)
2. Run the test script to identify problems
3. Check the Network tab for failed API calls
4. Report issues with:
   - Error message
   - Steps to reproduce
   - Browser console logs
   - Screenshots if helpful

---

**Happy Experimenting!** 🧪🔬✨

