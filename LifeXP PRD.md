# **LifeXP PRD (v1.0)**

## **Product Vision**

### **Mission**

LifeXP helps people build sustainable feedback loops for lifelong growth.

Many of the most valuable things in life have feedback cycles measured in months or years. Because progress is difficult to perceive, people often lose motivation despite making meaningful progress.

LifeXP makes invisible progress visible.

---

## **Product Philosophy**

Life is not a checklist.

Life is not productivity.

Life is an accumulation of experiences.

Every experience becomes part of who you are.

Instead of asking

> "Did I complete my tasks today?"

LifeXP asks

> "What kind of person am I gradually becoming?"

---

## **Design Principles**

### **No pressure**

No streaks.

No punishment.

No red notifications.

No guilt.

---

### **Growth should feel inevitable**

Even one experience contributes.

A slow month is still progress.

---

### **Natural language first**

The primary interface is conversation.

Not forms.

Not spreadsheets.

Not tables.

---

### **Human first, AI assists**

AI organizes.

The user owns the story.

---

# **Product Structure**

The product consists of two independent systems.

## **1\. Maintenance**

Life maintenance consists of recurring tasks that should not be forgotten.

Examples

* Laundry  
* Vacuuming  
* Gym  
* Water plants  
* Change bedsheets

Instead of to-do lists, LifeXP remembers

> "When was the last time?"

Example: Bedsheets last changed 12 days ago

No overdue badge.

No "you failed."

Just bookkeeping for your reminder.

---

## **2\. Growth**

Growth consists of experiences that accumulate over time.

Examples

* Japanese  
* Piano  
* Reading  
* Meditation  
* Public speaking  
* Therapy  
* Learning to say no  
* Gratitude  
* Volunteering

Each experience contributes towards one or more skills.

---

# **User Journey**

## **Dashboard**

When users open LifeXP they see

• Growth overview

• Maintenance overview

• Chat interface

• ‘Add experience’ button

---

## **Recording**

There are two ways to record.

### **Method A**

Chat naturally.

Example

> Went to Japanese class for 90 minutes today.

AI extracts

Japanese

\+1.5 hours

Language

---

### **Method B**

Structured entry

Template

Title

Duration

Skill

Notes

---

# **Growth System**

Every skill accumulates evidence.

Not points.

Not XP.

Evidence.

Examples

Japanese

327 hours

42 experiences

Current milestone

JLPT N4

Piano

58 practice sessions

31 hours

---

## **Milestones**

Milestones represent meaningful progress.

Example

Japanese

0 hours

↓

150 hours

↓

400 hours

↓

800 hours

↓

1300 hours

↓

N3

Users may choose

Official milestones

or

Custom milestones.

Example

Skiing

Goal

"I want to ski intermediate slopes confidently."

instead of

"Become professional."

---

# **Recording Sources**

## **Manual**

Natural language

Template

---

## **Automatic (Future)**

Calendar

Google

Apple

Outlook

---

Health

Apple Health

Garmin

Strava

---

Learning Apps

Duolingo

Meditation apps

Reading apps

---

Social Sharing

Many apps already generate share cards.

LifeXP can import these.

Example

Completed today's lesson.

↓

Japanese

\+15 minutes

---

# **AI Responsibilities**

AI should

Extract activities

Suggest skills

Estimate duration

Recommend milestones

Suggest duplicate merges

Never invent experiences.

---

# **Learning Mode**

Sometimes users don't know where to begin.

Example

"I want to learn Japanese."

LifeXP becomes a coach.

It recommends books, YouTube playlists, courses, communities, and study roadmap

Users can immediately start recording progress.

---

# **Dashboard**

The homepage should answer one question.

> How has my life grown?

Instead of

7 tasks completed

It should show

You explored

3 skills this week

18 hours learning

5 new experiences

---

# **Monetisation**

Potential Freemium model

### **Free**

Manual recording

Up to 3 active skills

Can delete / modify anything, but can only add new records for today & yesterday

---

### **Premium**

Unlimited skills

Backdate records

Calendar sync

AI categorisation

Cloud sync

Advanced analytics

---

Long-term possibility

Similar philosophy to Obsidian

Local-first ownership

Paid sync service

---

# **Roadmap**

## **Stage 0 — Prototype (1–2 weeks)**

Goal

Validate whether people understand the idea.

Features

* Chat input  
* Structured input  
* Experience timeline  
* Skill summary

Ignore

Accounts

Authentication

Subscriptions

Integrations

Focus on usability.

---

## **Stage 1 — MVP (4–6 weeks)**

Goal

Users can actually use LifeXP daily.

Features

Authentication

Database

Dashboard

Growth

Maintenance

Skill pages

Basic AI classification

---

## **Stage 2**

Calendar integration

Automatic imports

AI suggestions

Learning recommendations

---

## **Stage 3**

Health apps

Third-party integrations

Cloud sync

Subscriptions

---

## **Stage 4**

Life analytics

Long-term trends

Personal reflection

Monthly review

Annual review

---

# **Open Product Questions**

These should be answered before building beyond the prototype.

### **Product**

* What exactly is an "experience"?  
* Can one experience belong to multiple skills?  
* Should duration always matter?  
* Is "evidence" a better abstraction than XP?  
* Should every skill have measurable units (hours, sessions, books, etc.)?  
* How should users create new skills?

---

### **AI**

* When should AI ask follow-up questions?  
* How confident must AI be before auto-categorising?  
* How should AI handle ambiguous activities?

---

### **UX**

* Is chat the default homepage?  
* Is structured input still necessary?  
* How much should users edit AI suggestions?

---

### **Business**

* Is limiting to 3 skills the right free tier?  
* Is backdating a compelling premium feature?  
* Should cloud sync become the long-term monetisation strategy?

---

# **Suggested To-do List**

## **Your (Product) To-dos**

### **1\. Define the product philosophy**

Write one paragraph answering:

> Why does LifeXP need to exist?

---

### **2\. Define "experience"**

This is probably the most important product decision.

Create examples.

What counts?

What doesn't?

---

### **3\. Design the skill model**

Should every skill use:

* hours?  
* sessions?  
* books?  
* kilometres?  
* custom units?

---

### **4\. Design milestone framework**

Languages

Fitness

Music

Mental health

Creative skills

How are milestones represented?

---

### **5\. Design Maintenance**

List 20 common maintenance items.

Should reminders exist?

Should intervals be customizable?

---

### **6\. Write 20 example conversations**

Example:

> Went climbing with friends for two hours.

↓

Expected AI output.

---

### **7\. Interview 5 potential users**

Don't demo first.

Ask how they currently:

* remember life  
* track learning  
* maintain routines  
* reflect on growth

---

# **Tech Partner To-dos**

### **Prototype A**

Natural language parser

Chat → structured record

---

### **Prototype B**

Experience database

CRUD

---

### **Prototype C**

Skill aggregation

One experience

↓

Multiple skills

↓

Dashboard updates

---

### **Prototype D**

Chat UI

Fast

Minimal

Mobile-first

---

### **Prototype E**

AI pipeline

User input

↓

LLM extraction

↓

Structured JSON

↓

Database

---

One final product observation that I think is worth keeping in mind as you build:

I would avoid describing LifeXP internally as a "habit tracker alternative." That anchors the team to an existing category. What you're actually building feels closer to a **personal operating system for growth**—one that combines life maintenance, experience capture, and long-term skill development into a single feedback system. That framing is broader, and it gives you much more room to evolve the product without feeling constrained by what today's habit-tracking apps look like.

