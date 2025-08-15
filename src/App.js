import React, { useState, useRef, useEffect } from "react";

const sarahProfile = {
  image: "https://randomuser.me/api/portraits/women/44.jpg", // Fake but realistic
  name: "Sarah Martinez",
  demographics: [
    { label: "Age", value: "45" },
    { label: "Gender", value: "Female" },
    { label: "Location", value: "Austin, Texas, USA" },
    { label: "Occupation", value: "Elementary school teacher" },
    { label: "Family", value: "Divorced, primary caregiver to two children (ages 12 and 15) and elderly mother" },
  ],
  personality: [
    "Anxious, underconfident, but principled",
    "Feels overwhelmed by responsibilities",
    "Prefers empathetic, reassuring, and slower-paced conversations",
    "Appreciates when information is broken down into simple terms",
    "Needs emotional support and encouragement to ask follow-up questions",
  ],
  medical: [
    "Diagnosed with Stage I breast cancer 9 months ago",
    "Underwent lumpectomy and radiation therapy",
    "Currently on hormone therapy, dealing with side effects like fatigue and mood swings",
  ],
  past: [
    "Hesitant to ask too many questions for fear of 'bothering' the doctor",
    "Needs reassurance that she is making the right treatment decisions",
  ],
  challenges: [
    "Worries about how her illness affects her children emotionally",
    "Financial stress due to missed work and medical bills",
  ],
  example: `Doctor, I’ve been feeling so tired lately, and I’m worried it’s a sign the cancer might be coming back. Could it just be the medication? And… how can I explain all this to my kids without scaring them?`,
};

const michaelProfile = {
  image: "https://randomuser.me/api/portraits/men/32.jpg", // Fake but realistic
  name: "Michael Thompson",
  demographics: [
    { label: "Age", value: "52" },
    { label: "Gender", value: "Male" },
    { label: "Location", value: "Boston, Massachusetts, USA" },
    { label: "Occupation", value: "Senior Financial Analyst at a major investment bank" },
    { label: "Family", value: "Married with two adult children" },
  ],
  personality: [
    "Reassured, confident, objective, practical",
    "Highly data-driven and analytical",
    "Prefers structured conversations and evidence-based explanations",
    "Values efficiency and directness in communication",
  ],
  medical: [
    "Diagnosed with Stage II colorectal cancer 18 months ago",
    "Underwent surgery and chemotherapy",
    "Currently in remission but on quarterly follow-up",
  ],
  past: [
    "Always arrives prepared with spreadsheets of lab results and medical history",
    "Asks for clinical trial data and statistical outcomes",
  ],
  challenges: [
    "Balances demanding work schedule with medical appointments",
    "Concerned about long-term recurrence risk",

  ],
  example: `Doctor, based on the last CEA trend and your experience, what’s the statistical likelihood of recurrence in my case over the next five years? Could you also share any peer-reviewed studies supporting lifestyle interventions for reducing that risk?`,
};



// Load Q&A from external JSON
function useQA() {
  const [qa, setQA] = useState({ sarah: [], michael: [] });
  useEffect(() => {
    fetch("/qa.json")
      .then(r => r.json())
      .then(setQA)
      .catch(() => setQA({ sarah: [], michael: [] }));
  }, []);
  // Convert array to map for fuzzy lookup
  const sarahQA = Object.fromEntries((qa.sarah || []).map(x => [x.q, x.a]));
  const michaelQA = Object.fromEntries((qa.michael || []).map(x => [x.q, x.a]));
  return { sarahQA, michaelQA };
}

const defaultSarahResponse = "I'm here for you, Sarah. Could you tell me a bit more about what's on your mind?";
const defaultMichaelResponse = "Michael, I can look that up or summarize the latest data if you’d like. Could you clarify your question?";

function ProfileCard({ profile }) {
  return (
    <div className="profile-card">
      <div className="profile-img-wrap">
        <img src={profile.image} alt={profile.name} className="profile-img" />
      </div>
      <h2>{profile.name}</h2>
      <div className="section">
        <h4>Demographics</h4>
        <ul>
          {profile.demographics.map((d, i) => (
            <li key={i}><b>{d.label}:</b> {d.value}</li>
          ))}
        </ul>
      </div>
      <div className="section">
        <h4>Personality & Communication Style</h4>
        <ul>
          {profile.personality.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
      <div className="section">
        <h4>Medical Background</h4>
        <ul>
          {profile.medical.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </div>
      <div className="section">
        <h4>Past Interactions with Doctor</h4>
        <ul>
          {profile.past.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
      <div className="section">
        <h4>Challenges & Concerns</h4>
        <ul>
          {profile.challenges.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </div>
    </div>
  );
}

function ChatBubble({ sender, text, align, avatar, isThinking }) {
  return (
    <div className={`chat-bubble ${align}`}> 
      {avatar && <img src={avatar} alt={sender} className="bubble-avatar" onError={e => {e.target.style.display='none';}} />}
      <div className="bubble-content">
        <div className="sender">{sender}</div>
        <div className="text">
          {isThinking ? (
            <span className="ai-thinking">
              <span className="gpt-dot" />
              <span className="gpt-dot" />
              <span className="gpt-dot" />
            </span>
          ) : text}
        </div>
      </div>
    </div>
  );
}


function getFuzzyAnswer(question, qaMap, defaultResponse) {
  // Simple fuzzy match: find the key with the highest number of shared words (case-insensitive)
  const input = question.trim().toLowerCase();
  let bestKey = null;
  let bestScore = 0;
  for (const key of Object.keys(qaMap)) {
    const keyWords = key.toLowerCase().split(/\W+/);
    const inputWords = input.split(/\W+/);
    const shared = inputWords.filter(w => w && keyWords.includes(w)).length;
    if (shared > bestScore) {
      bestScore = shared;
      bestKey = key;
    }
  }
  // Only return if at least 1 word matches, else default
  return bestScore > 0 ? qaMap[bestKey] : defaultResponse;
}

function ChatScreen({ profile, qaMap, defaultResponse, align }) {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, thinking]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || thinking) return;
    const userMsg = { sender: profile.name.split(" ")[0], text: input, avatar: profile.image };
    setChat(prev => [...prev, userMsg]);
    setThinking(true);
    const aiText = getFuzzyAnswer(input, qaMap, defaultResponse);
    setInput("");
    setTimeout(() => {
      setChat(prev => [...prev, {
        sender: "Ava",
        text: aiText,
        avatar: "https://cdn.jsdelivr.net/gh/magnetikonline/svg-assets@main/openai-gpt-icon.png"
      }]);
      setThinking(false);
    }, 1200 + Math.random() * 800);
  }

  return (
    <div className="chat-screen">
      <div className="chat-session">
        {chat.map((msg, i) => (
          <ChatBubble
            key={i}
            sender={msg.sender}
            text={msg.text}
            align={msg.sender === "Ava" ? "ai" : align}
            avatar={msg.avatar}
          />
        ))}
        {thinking && (
          <ChatBubble
            sender="Ava"
            text=""
            align="ai"
            avatar="https://cdn.jsdelivr.net/gh/magnetikonline/svg-assets@main/openai-gpt-icon.png"
            isThinking={true}
          />
        )}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-input-row" onSubmit={handleSend} autoComplete="off">
        <input
          className="chat-input"
          type="text"
          placeholder="Type your question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={thinking}
        />
        <button className="chat-send-btn" type="submit" disabled={thinking}>Send</button>
      </form>
      <style>{`
        .ai-thinking {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .gpt-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin: 0 1px;
          border-radius: 50%;
          background: #3976a3;
          opacity: 0.7;
          animation: gpt-bounce 1.2s infinite both;
        }
        .gpt-dot:nth-child(2) { animation-delay: 0.2s; }
        .gpt-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes gpt-bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.7; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const { sarahQA, michaelQA } = useQA();
  return (
    <div className="split-screen">
      <div className="side left">
        <div className="profile-and-chat">
          <ProfileCard profile={sarahProfile} />
          <div className="chat-title">Sarah’s Chat with Ava</div>
          <ChatScreen
            profile={sarahProfile}
            qaMap={sarahQA}
            defaultResponse={defaultSarahResponse}
            align="left"
          />
        </div>
      </div>
      <div className="divider" />
      <div className="side right">
        <div className="profile-and-chat">
          <ProfileCard profile={michaelProfile} />
          <div className="chat-title">Michael’s Chat with Ava</div>
          <ChatScreen
            profile={michaelProfile}
            qaMap={michaelQA}
            defaultResponse={defaultMichaelResponse}
            align="right"
          />
        </div>
      </div>
  {/* Medical SVG overlay removed as per user request */}
      <style>{`
        body, html, #root {
          height: 100%;
          margin: 0;
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #f6fafd;
          background-image:
            linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.93)),
            url('https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80');
          background-size: cover, cover;
          background-repeat: no-repeat, no-repeat;
          background-attachment: fixed, fixed;
          background-position: center, center;
        }
  /* .medical-bg-svg styles removed */
        .split-screen {
          display: flex;
          height: 100vh;
          background: linear-gradient(90deg, #eaf6fb 0%, #f6fafd 100%);
        }
        .side {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0;
          min-width: 0;
          background: none;
        }
        .profile-and-chat {
          width: 100%;
          max-width: 480px;
          margin: 32px auto 32px auto;
          background: rgba(255,255,255,0.92);
          border-radius: 28px;
          box-shadow: 0 6px 32px 0 rgba(60,120,180,0.13), 0 1.5px 8px 0 rgba(60,120,180,0.07);
          padding: 32px 28px 24px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: box-shadow 0.2s;
        }
        .divider {
          width: 2px;
          background: linear-gradient(180deg, #b3d0e6 0%, #eaf6fb 100%);
          margin: 0 0.5rem;
        }
        .profile-card {
          background: linear-gradient(120deg, #fafdff 60%, #eaf6fb 100%);
          border-radius: 18px;
          box-shadow: 0 2px 16px rgba(60,120,180,0.10);
          padding: 24px 20px 18px 20px;
          margin-bottom: 18px;
          width: 100%;
          max-width: 420px;
          position: relative;
          border: 1.5px solid #e3eaf3;
        }
        .profile-img-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
        }
        .profile-img {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #b3d0e6;
          box-shadow: 0 2px 8px rgba(60,120,180,0.10);
        }
        .profile-card h2 { margin-top: 0; color: #2a4d69; text-align: center; }
        .profile-card .section { margin-bottom: 10px; }
        .profile-card h4 { margin: 0 0 4px 0; color: #3976a3; font-size: 1.05em; }
        .profile-card ul { margin: 0 0 0 18px; padding: 0; }
        .profile-card li { margin-bottom: 2px; font-size: 0.98em; }
        .profile-card .example blockquote {
          background: #eaf6fb;
          border-left: 4px solid #b3d0e6;
          margin: 6px 0 0 0;
          padding: 8px 12px;
          font-style: italic;
          color: #2a4d69;
        }
        .chat-title {
          font-weight: 700;
          color: #2a4d69;
          margin: 10px 0 18px 0;
          font-size: 1.18em;
          letter-spacing: 0.01em;
          text-align: center;
        }
        .chat-screen {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          background: #fafdff;
          border-radius: 16px;
          box-shadow: 0 1px 8px rgba(60,120,180,0.06);
          padding: 12px 0 0 0;
          margin-bottom: 0;
          border: 1.5px solid #e3eaf3;
        }
        .chat-session {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 180px;
          max-height: 320px;
          overflow-y: auto;
          padding: 0 10px;
        }
        .chat-bubble {
          display: flex;
          align-items: flex-end;
          margin-bottom: 2px;
        }
        .chat-bubble.left {
          flex-direction: row;
        }
        .chat-bubble.right {
          flex-direction: row-reverse;
        }
        .chat-bubble.ai {
          flex-direction: row;
          justify-content: center;
        }
        .bubble-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 10px 0 0;
          border: 2px solid #b3d0e6;
          background: #fff;
        }
        .chat-bubble.right .bubble-avatar {
          margin: 0 0 0 10px;
        }
        .chat-bubble.ai .bubble-avatar {
          margin: 0 10px 0 0;
        }
        .bubble-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .chat-bubble.right .bubble-content {
          align-items: flex-end;
        }
        .chat-bubble.ai .bubble-content {
          align-items: center;
        }
        .chat-bubble .sender {
          font-size: 0.92em;
          color: #3976a3;
          margin-bottom: 2px;
        }
        .chat-bubble .text {
          background: #eaf6fb;
          border-radius: 12px;
          padding: 10px 14px;
          color: #2a4d69;
          font-size: 1.04em;
          box-shadow: 0 1px 6px rgba(60,120,180,0.06);
          max-width: 320px;
        }
        .chat-bubble.right .text {
          background: #d1eaf7;
        }
        .chat-bubble.ai .text {
          background: #f7fafd;
          border: 1px solid #b3d0e6;
        }
        .chat-input-row {
          display: flex;
          width: 100%;
          padding: 10px 10px 10px 10px;
          background: #fafdff;
          border-radius: 0 0 16px 16px;
          box-shadow: 0 -1px 4px rgba(60,120,180,0.03);
        }
        .chat-input {
          flex: 1;
          border: 1.5px solid #b3d0e6;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 1.05em;
          outline: none;
          margin-right: 8px;
          background: #fff;
          transition: border 0.2s;
        }
        .chat-input:focus {
          border: 1.5px solid #3976a3;
        }
        .chat-send-btn {
          background: linear-gradient(90deg, #3976a3 0%, #2a4d69 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 18px;
          font-size: 1.05em;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(60,120,180,0.08);
          transition: background 0.2s;
        }
        .chat-send-btn:hover {
          background: linear-gradient(90deg, #2a4d69 0%, #3976a3 100%);
        }
        @media (max-width: 900px) {
          .split-screen { flex-direction: column; }
          .divider { width: 100%; height: 2px; margin: 0.5rem 0; }
          .profile-and-chat { max-width: 98vw; padding: 16px 2vw 12px 2vw; margin: 18px auto; }
        }
        @media (max-width: 600px) {
          .profile-and-chat { max-width: 100vw; padding: 8px 0 8px 0; border-radius: 0; }
        }
      `}</style>
    </div>
  );
}
