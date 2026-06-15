import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../lib/firestore';
import { getInsights, streamChat } from '../lib/gemini';
import { Lightbulb, Send, RefreshCw, Leaf, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const DIFF_STYLE = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700' };
const CAT_COLOR  = { transport: 'text-blue-600', home: 'text-amber-600', food: 'text-green-600', shopping: 'text-pink-600' };

const STARTERS = [
  'How can I reduce my transport emissions in India?',
  'Is it worth switching to an electric vehicle in India?',
  'What are the biggest diet changes for CO₂ reduction?',
  'How much can solar panels save in India?',
];

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 bg-eco-600 rounded-full flex items-center justify-center mr-2 shrink-0 mt-0.5">
          <Leaf size={13} className="text-white" />
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser ? 'bg-eco-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
      }`}>
        {content}
      </div>
    </div>
  );
}

export default function Insights() {
  const { currentUser } = useAuth();
  const [userData, setUserData]     = useState(null);
  const [insights, setInsights]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [aiError, setAiError]       = useState(false);
  const [expanded, setExpanded]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [streaming, setStreaming]   = useState(false);
  const bottomRef = useRef(null);

  // Load data + insights
  useEffect(() => {
    (async () => {
      setLoading(true); setAiError(false);
      const data = await getUserData(currentUser.uid);
      setUserData(data);
      if (!data?.totalCO2) { setLoading(false); return; }
      try {
        const result = await getInsights(data);
        setInsights(result);
      } catch (e) {
        console.error(e);
        setAiError(true);
      }
      setLoading(false);
    })();
  }, [currentUser]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend(text) {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput('');
    const newHistory = [...messages, { role: 'user', content: msg }];
    setMessages(newHistory);
    setStreaming(true);

    let aiText = '';
    setMessages(h => [...h, { role: 'model', content: '' }]);

    try {
      await streamChat(
        newHistory.slice(0, -1).map(m => ({ role: m.role === 'model' ? 'model' : 'user', content: m.content })),
        msg,
        (chunk) => {
          aiText += chunk;
          setMessages(h => [...h.slice(0, -1), { role: 'model', content: aiText }]);
        }
      );
    } catch (e) {
      setMessages(h => [...h.slice(0, -1), { role: 'model', content: 'Sorry, I had trouble connecting. Please try again.' }]);
    }
    setStreaming(false);
  }

  async function regenerate() {
    setInsights(null); setLoading(true); setAiError(false);
    try {
      const result = await getInsights(userData);
      setInsights(result);
    } catch { setAiError(true); }
    setLoading(false);
  }

  const hasData = (userData?.totalCO2 || 0) > 0;

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">AI Insights</h1>
          <p className="text-gray-400 text-sm mt-0.5">Powered by Gemini — personalised for your footprint</p>
        </div>
        {insights && (
          <button onClick={regenerate}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-eco-600 border border-gray-200 hover:border-eco-300 px-4 py-2 rounded-xl transition-all">
            <RefreshCw size={14} /> Regenerate
          </button>
        )}
      </div>

      {/* No data state */}
      {!hasData && !loading && (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center mb-6">
          <div className="text-4xl mb-4">🌱</div>
          <p className="font-semibold text-gray-700 mb-2">No footprint data yet</p>
          <p className="text-gray-400 text-sm mb-5">Fill in the Calculator first so Gemini can personalise your plan.</p>
          <Link to="/calculator" className="inline-flex items-center gap-2 bg-eco-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-eco-500 transition-all">
            <Calculator size={15} /> Open Calculator
          </Link>
        </div>
      )}

      {/* Loading */}
      {loading && hasData && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center mb-6">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-eco-100 border-t-eco-500 animate-spin mb-4" />
          <p className="font-medium text-gray-700">Gemini is analysing your footprint…</p>
          <p className="text-gray-400 text-sm mt-1">Building your personalised action plan</p>
        </div>
      )}

      {/* Error */}
      {aiError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
          <p className="text-red-600 font-medium mb-2">Couldn't reach Gemini</p>
          <p className="text-red-400 text-sm mb-4">Check your API key in the .env file</p>
          <button onClick={regenerate} className="bg-red-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-400 transition-all">
            Retry
          </button>
        </div>
      )}

      {/* Insights */}
      {insights && (
        <div className="mb-6">
          {/* Summary banner */}
          <div className="bg-eco-950 rounded-2xl p-5 mb-4 flex items-start gap-3">
            <Lightbulb size={20} className="text-eco-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-eco-300 text-sm font-medium">Gemini's Summary</p>
              <p className="text-white text-sm mt-1 leading-relaxed">{insights.summary}</p>
            </div>
          </div>

          {/* Insight cards */}
          <div className="space-y-3">
            {insights.insights.map((ins) => (
              <div key={ins.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-eco-300 transition-all">
                <button onClick={() => setExpanded(expanded === ins.id ? null : ins.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4">
                  <span className="text-2xl shrink-0">{ins.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{ins.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_STYLE[ins.difficulty]}`}>
                        {ins.difficulty}
                      </span>
                      <span className={`text-[10px] font-semibold capitalize ${CAT_COLOR[ins.category] || 'text-gray-400'}`}>
                        {ins.category}
                      </span>
                    </div>
                    <p className="text-xs text-eco-600 font-semibold mt-0.5">💚 {ins.impact}</p>
                  </div>
                  {expanded === ins.id ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>
                {expanded === ins.id && (
                  <div className="px-5 pb-4 pt-0 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed">{ins.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 bg-eco-600 rounded-full flex items-center justify-center">
            <Leaf size={12} className="text-white" />
          </div>
          <span className="font-semibold text-gray-800 text-sm">Chat with EcoAI</span>
          <span className="bg-eco-50 text-eco-600 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">GEMINI</span>
        </div>

        {/* Messages */}
        <div className="p-4 min-h-40 max-h-72 overflow-y-auto scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm mb-4">Ask EcoAI anything about reducing your footprint</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {STARTERS.map(s => (
                  <button key={s} onClick={() => handleSend(s)}
                    className="text-xs bg-gray-100 hover:bg-eco-50 hover:text-eco-700 text-gray-600 px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-eco-200">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
          {streaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-center gap-2 text-gray-400 text-sm pl-10">
              <div className="w-1.5 h-1.5 bg-eco-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-eco-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-eco-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything about sustainability…"
            disabled={streaming}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-eco-400 transition-colors disabled:opacity-50"
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || streaming}
            className="w-10 h-10 bg-eco-600 hover:bg-eco-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
