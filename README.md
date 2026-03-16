# UnMute

**UnMute** is a mobile AI companion that acts as a **real-time personal sign language interpreter**.

A deaf user places their phone on the desk beside their laptop during a meeting. The phone’s camera watches their signs and instantly converts them into **spoken words and on-screen text**. When others speak, the phone listens and converts their speech into **live captions** for the deaf user.

---

# The Problem

Millions of deaf individuals face barriers in meetings, classrooms, and everyday conversations. Most existing solutions require:

- Human interpreters  
- Specialized software  
- Everyone in the meeting to install tools  
- Expensive accessibility services  

These solutions make communication **slow, costly, and often inaccessible**.

---

# Our Solution

UnMute turns a smartphone into a **real-time AI interpreter**.

The phone observes sign language, understands context, and converts it instantly into **speech and text**, while also converting spoken language into **live captions** for the deaf user.

This creates **seamless two-way communication** between deaf and hearing individuals.

---

# Key Design Decisions

| Decision | Choice |
|---|---|
| Platform | Mobile (React Native + NativeWind) |
| Backend | Python FastAPI |
| Database | Supabase (minimal use for hackathon) |
| Sign Languages | Filipino Sign Language (FSL) + American Sign Language (ASL) |
| Spoken Languages | Tagalog + English |
| Video Call Approach | Companion app alongside existing meeting platforms |

The app is intentionally **simple, fast, and focused on communication**.

---

# Core Features

## 1. Real-Time Sign Language → Speech & Text

The user opens the app and points the front camera toward themselves.

As they sign, the app:

1. Detects the gesture using a trained AI model  
2. Converts the sign into the correct word or phrase  
3. Displays it as text on screen  
4. Speaks the message through the phone speaker  

If the phone is placed near a laptop during a meeting, the laptop microphone picks up the spoken output and sends it into the call.

To other participants, it simply sounds like the user is speaking normally.

The AI model used for sign recognition is **trained before the hackathon** using recorded samples of each sign from multiple angles. During the hackathon, the app simply loads and runs the trained model.

The most important requirement is **speed**. The delay between signing and hearing the spoken word must feel almost instant to keep conversations natural.

---

## 2. Multi-Language Support

Users choose two settings on the home screen:

- **Sign Language:** FSL or ASL  
- **Output Language:** Tagalog or English  

This allows four combinations:

- FSL → Tagalog  
- FSL → English  
- ASL → English  
- ASL → Tagalog  

When the AI recognizes a sign, it retrieves the correct translation from a **predefined lookup table**.

Example:

| Sign | Tagalog Output | English Output |
|---|---|---|
| TULONG | Kailangan ko ng tulong | I need help |

Users can switch languages **anytime during a session**.

---

## 3. Live Two-Way Conversation

UnMute enables **real-time communication in both directions**.

### Deaf → Hearing

1. Camera detects signs  
2. AI recognizes their meaning  
3. Text appears on screen  
4. Speech plays through the phone speaker  

### Hearing → Deaf

1. Phone microphone listens to nearby speech  
2. Speech-to-text converts it into captions  
3. Text appears on screen for the deaf user  

Both sides appear in a **conversation thread**, similar to a messaging app.

| Speaker | Display |
|---|---|
| Deaf user | Blue message bubbles |
| Hearing user | Gray message bubbles |

No one types anything — the conversation happens **naturally through signing and speech**.

---

## 4. Context-Aware Translation

Recognizing hand shapes alone is not enough. Many Tagalog signs can represent **multiple meanings depending on context**.

UnMute analyzes the conversation to determine the correct meaning.

### Example: BASA

"BASA" can mean:

- **Read**
- **Wet**

Context determines the meaning.

Examples:

LIBRO + BASA → **Read**  
ULAN + BASA → **Wet**

### Example: BUKAS

BUKAS can mean:

- **Tomorrow**
- **Open**

Context determines the correct interpretation.

---

# How Context Detection Works

The system evaluates four clues:

### 1. Surrounding Signs
Words before and after the ambiguous sign provide strong context.

### 2. Facial Expressions
Facial expressions are part of sign language grammar.

Example:

- Disgusted expression → "vomit"  
- Neutral expression → "vinegar"

### 3. Conversation History
Previous signs influence meaning.

Medical context → "heart (organ)"  
Romantic context → "heart (love)"

### 4. Probability
If no other clues exist, the system selects the **most statistically common meaning**.

If the app misinterprets a word, the user can correct it with a **"Did you mean...?"** suggestion.

---

# Sign Dataset Used for Demo

## Filipino Sign Language (FSL)

| Sign | Tagalog Output | English Output |
|---|---|---|
| KAMUSTA | Kamusta! | Hello! |
| SALAMAT | Salamat! | Thank you! |
| TULONG | Kailangan ko ng tulong | I need help |
| OO | Oo | Yes |
| HINDI | Hindi | No |

---

## American Sign Language (ASL)

| Sign | English Output | Tagalog Output |
|---|---|---|
| How Are You | How are you? | Kamusta ka? |
| THANK YOU | Thank you! | Salamat! |
| HELP | I need help | Kailangan ko ng tulong |
| YES | Yes | Oo |
| NO | No | Hindi |

---

# Why UnMute Matters

UnMute makes communication **instant, private, and accessible**.

It removes the need for interpreters in everyday situations and allows deaf individuals to participate naturally in meetings, classrooms, and daily conversations.

Our mission is simple:

**No one should be excluded from a conversation because of a communication barrier.**
