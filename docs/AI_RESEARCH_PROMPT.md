# Deep Research Prompt: AI/ML for Workout Apps

Use this prompt with Claude, GPT-4, or another LLM to conduct comprehensive research on intelligent workout progression systems.

---

## RESEARCH PROMPT

I'm building a workout tracking app and need to implement an intelligent AI system for weight/rep/set suggestions. I need you to conduct deep research and provide a comprehensive report covering the following areas:

### 1. COMPETITIVE ANALYSIS: How Top Apps Do It

Analyze how these leading workout apps implement AI suggestions:

**Fitbod** (27% faster gains claim):
- What algorithms do they use for exercise selection and progression?
- How do they handle muscle group balancing and recovery?
- What data points do they track for personalization?

**Strong** (5M+ users):
- How do they predict next workout weights?
- What's their approach to tracking PRs and progress?
- How do they handle plateau detection?

**Hevy** (Best free features):
- What's their progression recommendation system?
- How do they incorporate RPE/RIR tracking?
- What social features influence recommendations?

**Alpha Progression** (RPE-based):
- Deep dive into their RPE-based periodization
- How do they auto-regulate training based on fatigue?
- What's their deload week detection logic?

**Dr. Muscle** (AI-first):
- What ML models do they use (if any)?
- How do they predict optimal volume per muscle group?
- What's their approach to exercise variation?

**Boostcamp** (Program-focused):
- How do they adapt pre-made programs to individuals?
- What's their progression logic within programs?
- How do they handle program completion and transitions?

### 2. SCIENTIFIC RESEARCH: Evidence-Based Progression

Review and summarize research on:

**Progressive Overload Principles**:
- What does science say about optimal weight increase percentages (2.5%, 5%, 10%)?
- How often should progression occur for different training ages?
- What's the difference between linear, wave, and block periodization?

**Volume Landmarks** (Dr. Mike Israetel):
- Explain MV (Maintenance Volume), MEV (Minimum Effective Volume), MAV (Maximum Adaptive Volume), MRV (Maximum Recoverable Volume)
- Typical set ranges per muscle group per week
- How to detect when someone is approaching MRV
- Deload protocols and frequency

**RPE/RIR Training**:
- Validity of RPE (Rate of Perceived Exertion) vs RIR (Reps in Reserve)
- How accurate are beginners vs advanced lifters at estimating RPE?
- Optimal RPE ranges for hypertrophy (6-8) vs strength (8-9.5)
- Using RPE to auto-regulate training

**Recovery Science**:
- Sleep impact on strength (research shows 7-11% variation)
- Muscle protein synthesis timeline (24-48h window)
- How to quantify recovery readiness
- Stress and cortisol effects on performance

**Individual Variation**:
- Genetic responders vs non-responders (how much variation exists?)
- Sex differences in recovery and volume tolerance
- Age-related recovery differences
- Training age vs chronological age

### 3. MACHINE LEARNING APPROACHES

Research ML approaches used in fitness:

**Prediction Models**:
- What features (inputs) are most predictive of next workout performance?
- Linear regression vs more complex models (Random Forest, Neural Networks)
- How much data is needed for personalization?
- Cold start problem: What to do for new users?

**Time Series Forecasting**:
- Predicting strength curves over time
- Detecting plateaus and deload needs
- Forecasting PRs and goal achievement timelines

**Clustering/Segmentation**:
- User archetypes (beginner, intermediate, advanced)
- Exercise response patterns
- Volume tolerance clustering

**Reinforcement Learning**:
- Could RL be used to optimize long-term strength gains?
- Reward functions for fitness (PRs, volume, consistency)
- Exploration vs exploitation in workout programming

### 4. RULE-BASED ALGORITHMS (Offline-First)

Since ML requires data and compute, what are the best heuristics?

**Formula-Based Progression**:
- 1RM estimation formulas (Epley, Brzycki, Lombardi)
- Volume calculation (sets × reps × weight)
- Relative intensity (%1RM) zones
- Tonnage and intensity tracking

**Smart Defaults**:
- Starting weights for first-time exercises
- Default set/rep schemes for different goals (strength, hypertrophy, endurance)
- Rest period recommendations
- Exercise substitution logic

**Fatigue Detection**:
- How to detect accumulated fatigue without direct biomarkers
- Using velocity loss, RPE trends, volume changes
- When to recommend deload weeks

**Exercise Selection**:
- Balancing push/pull/legs
- Frequency per muscle group (2-3x/week optimal)
- Movement pattern coverage (horizontal push, vertical pull, etc.)

### 5. DATA ARCHITECTURE

What data should I track to enable intelligent suggestions?

**User Profile**:
- Training age, chronological age, sex
- Goals (strength, hypertrophy, endurance, general fitness)
- Injury history and limitations
- Equipment availability

**Per Workout**:
- Exercise, weight, reps, sets (completed vs planned)
- RPE per set
- Rest periods
- Workout duration
- Superset/circuit organization

**Daily Biomarkers**:
- Sleep hours and quality
- Subjective fatigue (1-10)
- Stress level (1-10)
- Bodyweight (for tracking trends)
- Soreness level per muscle group

**Long-Term Tracking**:
- Personal records (1RM, volume PRs, rep PRs)
- Body measurements (weight, body fat %, circumferences)
- Progress photos
- Strength standards relative to bodyweight

### 6. KEY ALGORITHMS TO IMPLEMENT

Provide pseudo-code or detailed logic for:

**Weight Suggestion Algorithm**:
```
Given:
- Last workout for this exercise (weight, reps, RPE)
- Recovery score (sleep, fatigue, days since last workout)
- User training age
- Goal (strength vs hypertrophy)

Output:
- Suggested weight for next set
- Target rep range
- Confidence level
- Reasoning (explainable AI)
```

**Volume Management**:
```
Given:
- Current weekly volume per muscle group
- User's MEV/MAV/MRV thresholds
- Recent performance trends

Output:
- Add more sets, maintain, or reduce volume?
- Which exercises to add/remove
- Deload recommendation (yes/no)
```

**Exercise Selection**:
```
Given:
- Muscle groups trained this week
- Equipment available
- User preferences and history
- Injury limitations

Output:
- Ranked list of exercises to do next
- Reasoning for each suggestion
```

**Plateau Detection & Breaking**:
```
Given:
- Historical performance data (6-12 weeks)
- Current PRs and recent attempts

Output:
- Is user plateaued? (yes/no + confidence)
- Suggested intervention (deload, volume change, exercise variation, technique focus)
```

### 7. USER EXPERIENCE CONSIDERATIONS

How should AI suggestions be presented?

**Explainability**:
- Users don't trust black box recommendations
- How to explain why AI suggested 100kg vs 95kg?
- Show confidence levels ("High confidence" vs "Low confidence - learn your baseline")

**Opt-in vs Opt-out**:
- Should AI suggestions be default or optional?
- How to handle users who want full manual control?

**Learning from Feedback**:
- If user ignores suggestion and does different weight, learn from it
- If user rates suggestion as "too easy" or "too hard", adjust
- Track suggestion accuracy over time

**Progressive Disclosure**:
- Beginners: Simple suggestions with minimal explanation
- Advanced: Show the math, RPE targets, volume calculations

### 8. IMPLEMENTATION STRATEGY

Prioritize features for MVP vs long-term:

**Phase 1 - MVP (Launch in 2 weeks)**:
- What's the minimum viable AI that provides value?
- Focus on safety (conservative suggestions)
- Simple rules-based approach

**Phase 2 - Enhancement (1-3 months)**:
- What features require more data collection?
- When to introduce ML models?

**Phase 3 - Advanced (6+ months)**:
- Personalized periodization
- Predictive analytics
- Community-based recommendations

### 9. RESEARCH PAPERS & SOURCES

Provide citations for:
- Key research papers on progressive overload
- Studies on RPE validity and accuracy
- Volume landmark research (Israetel, Schoenfeld)
- ML applications in sports science
- Sleep and recovery research

### 10. COMPETITIVE MOAT

What unique AI features could differentiate my app?

- Features that competitors don't have
- Underserved use cases in the market
- Novel approaches to old problems
- How to build network effects with AI

---

## OUTPUT FORMAT

Please structure your response as:

1. **Executive Summary** (2-3 paragraphs)
2. **Detailed Findings** (organized by the 10 sections above)
3. **Recommended Architecture** (technical implementation plan)
4. **Code Examples** (pseudo-code for key algorithms)
5. **Research Bibliography** (papers, articles, app reviews)
6. **Next Steps** (prioritized action items)

Make your research actionable - I want to implement this, not just understand theory.
