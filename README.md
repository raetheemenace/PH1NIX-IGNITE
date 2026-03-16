# UnMute
A mobile app that acts as a personal sign language interpreter on your phone. A deaf person places their phone on the desk next to their laptop. The phone watches their signs through the camera and speaks the words out loud. When people in the meeting speak the phone listens and shows the text on screen. It works alongside any meeting platform — Google Meet, Microsoft Teams, Zoom, or even a face-to-face conversation. Nobody else needs to install anything.

| **Decision** | **What We Chose** |
| --- | --- |
| Platform | Mobile (React Native + NativeWind) |
| Backend | Python FastAPI |
| Database | Supabase (minimal use for hackathon) |
| Sign Languages | FSL (Filipino Sign Language) + ASL (American Sign Language) |
| Spoken/Text Languages | Tagalog + English |
| Signs Per Language | 5 signs each (10 total) |
| Video Call Approach | Companion app alongside any meeting platform — NOT building our own video call |
| Screens | 2 only (Home + Session) |
| Auth/Login | None — app just opens |
| Saving History | None — everything lives in the moment |

# The Five Features

#### **Feature 1: Real-Time Sign Language to Speech and Text**

The deaf person opens the app and points the front camera at themselves. They start signing. The app recognizes the sign almost instantly and does two things — shows the word as text on screen and speaks it out loud through the phone speaker.

When the phone is sitting next to a laptop running a meeting the laptop microphone picks up the spoken words and sends them into the meeting. Everyone in the meeting hears the deaf person's signs as spoken words without knowing an AI is involved.

The AI model that recognizes signs is trained **before** the hackathon. During the hackathon we just load the trained model and use it. Training involves recording ourselves doing each of the 10 signs many times from different angles then letting the AI learn what each sign looks like.

The most important thing is speed. The gap between finishing a sign and hearing the spoken word must feel instant. If it is slow the conversation feels broken.

### **Feature 2: Multi-Language Support**

The user picks two things on the home screen. First their sign language — FSL or ASL. Then their preferred output language — Tagalog or English.

This creates four possible combinations:

- FSL signs → Tagalog output
- FSL signs → English output
- ASL signs → English output
- ASL signs → Tagalog output

When the AI recognizes a sign it looks up the right translation based on what the user selected. For our 10 signs we have every translation pre-written in a simple lookup table.

For example TULONG in FSL maps to "Kailangan ko ng tulong" in Tagalog and "I need help" in English. The app just picks the right version based on the user's choice.

The user can switch languages anytime during a session and the output adjusts immediately.

### **Feature 3: Live Conversation Mode (Two-Way Communication)**

Communication goes both directions.

**Deaf person → Hearing person:** The camera watches for signs. The AI recognizes them. The app shows the text and speaks the words out loud. The hearing person hears the words either directly from the phone speaker or through the meeting platform.

**Hearing person → Deaf person:** The phone microphone listens to the hearing person's voice — either from someone nearby or from meeting audio playing through the laptop speaker. The app converts their speech to text and displays it on the phone screen so the deaf person can read what everyone is saying.

Both directions feed into the same conversation thread on screen. The deaf person's signs appear as blue text bubbles. The hearing person's speech appears as gray text bubbles. It looks like a chat log but nobody is typing. One person is signing and the other is talking and the app translates between the two in real time.

### **Feature 4: Meeting Integration (Companion App)**

This is our **killer feature** and what makes SignVoice different from other sign language apps.

Instead of building our own video call system SignVoice works as a **companion** alongside whatever meeting platform the person is already using. Google Meet, Microsoft Teams, Zoom, Webex — it does not matter.

**The setup:**

The deaf person has their laptop open to the meeting. Their phone sits on the desk next to the laptop on a small stand with SignVoice running. The phone camera points at the user. That is the entire setup.

**When the deaf person signs:**

The phone camera watches their hands. The AI recognizes the signs. The phone speaks the words out loud. Because the phone is near the laptop the laptop microphone picks up the spoken words and sends them into the meeting. Everyone in the meeting hears the deaf person speaking.

From the perspective of other people in the meeting they just hear someone talking. They do not need to install anything. They do not need to know an AI is involved. Everything feels normal.

**When people in the meeting speak:**

Their voices come through the laptop speaker. The phone microphone picks up the meeting audio. SignVoice converts the speech to text and shows it on the phone screen. The deaf person reads what everyone is saying.

**Why this approach is better than building our own video call:**

- Works with every meeting platform that already exists
- Only the deaf person needs SignVoice — nobody else installs anything
- No need for IT approval or special setup at work or school
- Much simpler to build — no video streaming, no servers for calling, no room codes
- More impressive to judges because it works with tools they already know and use
- More useful in real life because deaf people cannot choose what meeting platform their company uses

 **Future vision we mention in the pitch:**

Today it is a companion phone app. In the future it becomes a plugin that runs directly inside Teams, Zoom, and Meet so the deaf person does not even need a second device. The sign recognition would happen through the webcam inside the meeting platform itself.

### **Feature 5: Context Awareness Per Word and Sentence**

The app does not just recognize hand shapes — it understands what the person **means**. This matters because Tagalog has many words that are signed the same way but mean completely different things.

**The Tagalog problem — real examples:**

**BASA** can mean "read" (basá) or "wet" (basâ). If the person signed LIBRO (book) before signing BASA the app knows books are involved and picks "read." If they signed ULAN (rain) before BASA the app knows weather is involved and picks "wet."

**BUKAS** can mean "tomorrow" or "open." If the person signed PUPUNTA (will go) before BUKAS the app picks "tomorrow" because it sounds like they are talking about plans. If they signed PINTO (door) before BUKAS the app picks "open" because they are talking about a door.

**SUKA** can mean "vinegar" or "vomit." If the conversation has been about cooking the app picks "vinegar." If the conversation has been about feeling sick the app picks "vomit." Imagine telling a doctor you want to vomit but the app says you want vinegar — getting this wrong is not just annoying, it could be dangerous.

**PUSO** can mean "heart" (the organ), "heart" (love), or "banana blossom" (a food). Medical conversation means the organ. Romantic conversation means love. Cooking conversation means the food ingredient.

**PATAY** can mean "dead" or "turn off." "My grandfather died" versus "turn off the light" are extremely different messages.

**How the app figures out the right meaning using four clues:**

**Clue 1 — Surrounding signs.** What the person signed right before and right after the ambiguous sign. This is the strongest clue. LIBRO + BASA almost always means "reading a book." ULAN + BASA almost always means "wet from rain."

**Clue 2 — Facial expression.** In sign language the face is part of the grammar. SUKA with a disgusted face pointing at the stomach means "vomit." SUKA with a calm face pointing at food means "vinegar." The AI watches the face alongside the hands.

**Clue 3 — Conversation history.** If the last several signs were all about health topics and someone signs PUSO the app guesses "heart" as the organ. If the conversation was about cooking it guesses "banana blossom." The longer the conversation goes the better the context gets.

**Clue 4 — Common probability.** When the app has no other clues it goes with the meaning that is statistically most common. This is the weakest clue and gets overridden by any of the other three.

**For the hackathon demo** we only need one or two ambiguous signs working. We will show the same sign twice in different contexts and the app gives different correct meanings each time. That single moment proves to judges that our app understands meaning not just hand shapes.

If the app ever gets it wrong there is a small "Did you mean...?" button showing the alternative meaning. The user taps it to correct the app.

## **The 10 Signs We're Using**

### **FSL (Filipino Sign Language)**

| **Sign** | **Tagalog Output** | **English Output** |
| --- | --- | --- |
| KAMUSTA | Kamusta! | Hello! |
| SALAMAT | Salamat! | Thank you! |
| TULONG | Kailangan ko ng tulong | I need help |
| OO | Oo | Yes |
| HINDI | Hindi | No |

ASL (American Sign Language)
| **Sign** | **English Output** | **Tagalog Output** |
| --- | --- | --- |
| How Are You | How Are You | Kamusta ka |
| THANK YOU | Thank you! | Salamat! |
| HELP | I need help | Kailangan ko ng tulong |
| YES | Yes | Oo |
| NO | No | Hindi |
