/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabase";
import { 
  Search, 
  Upload, 
  Trash2, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Mail, 
  MessageSquare, 
  Settings,
  Plus,
  X,
  RefreshCw,
  Download,
  Users,
  Sparkles,
  Zap,
  Shield,
  Target,
  ArrowRight,
  Info
} from "lucide-react";

/* --- INITIAL LEADS ----------------------------------------------------------- */
const INITIAL_LEADS = [
  {n:"Frank G Georgoulas", f:"Frank", t:"", co:"", ind:"", city:"", li:"frankgee", email:"frank@aerapass.com"},
  {n:"Kentaro Kawabe", f:"Kentaro", t:"", co:"", ind:"", city:"", li:"kentaro-kawabe-869028146", email:"kentaro.kawabe@penguinsecurities.sg"},
  {n:"James Maguire", f:"James", t:"", co:"", ind:"", city:"", li:"james-maguire-580282a", email:"james.maguire@sdclgroup.com"},
  {n:"Alex Manson", f:"Alex", t:"", co:"", ind:"", city:"", li:"alex-manson-919a8310a", email:"alex.manson@sc.com"},
  {n:"Walter de Oude", f:"Walter", t:"", co:"", ind:"", city:"", li:"walterdeoude", email:"walter@chocfin.com"},
  {n:"Richard Poulton", f:"Richard", t:"", co:"", ind:"", city:"", li:"richard-poulton", email:"richardp@instantia.co"},
  {n:"Steve Knabl", f:"Steve", t:"", co:"", ind:"", city:"", li:"steve-knabl-a38127", email:"skn@wma.asia"},
  {n:"Alex Walker", f:"Alex", t:"", co:"", ind:"", city:"", li:"alexwalker777", email:"alex.walker@odysseycapital-group.com"},
  {n:"Olivier Too", f:"Olivier", t:"", co:"", ind:"", city:"", li:"oliviertoo", email:"olivier@wearecrystalclear.com"},
  {n:"Cliff Entrekin", f:"Cliff", t:"", co:"", ind:"", city:"", li:"cliffentrekin", email:"centrekin@convergence-tfs.com"},
  {n:"Miranda Jiang", f:"Miranda", t:"", co:"", ind:"", city:"", li:"miranda-jiang-5386551a", email:"mirandajiang@gsrventures.com"},
  {n:"Dominic Pfisterer", f:"Dominic", t:"", co:"", ind:"", city:"", li:"dominic-pfisterer", email:"dominic.pfisterer@aument-capital.com"},
  {n:"Barry Levett", f:"Barry", t:"", co:"", ind:"", city:"", li:"barrylevett", email:"barryl@mypinpad.com"},
  {n:"Shane Coelho", f:"Shane", t:"", co:"", ind:"", city:"", li:"shane-coelho-", email:"shane@tallrockcapital.com"},
  {n:"Jesse Aarnio", f:"Jesse", t:"", co:"", ind:"", city:"", li:"jesse-aarnio", email:"jesse.aarnio@conduit.group"},
  {n:"Christophe Numa", f:"Christophe", t:"", co:"", ind:"", city:"", li:"christophe-numa-69946927", email:"christophe.numa@gauld.com"},
  {n:"Neil Shonhard", f:"Neil", t:"", co:"", ind:"", city:"", li:"neil-shonhard-7720431b0", email:"neil@monetago.com"},
  {n:"Thomas Tan", f:"Thomas", t:"", co:"", ind:"", city:"", li:"thomas-tan-74345b34", email:"ttan@ftcapitalpartners.com"},
  {n:"Rory Brown", f:"Rory", t:"", co:"", ind:"", city:"", li:"rory-brown-ascenta-wealth", email:"rory@ascentawealth.com"},
  {n:"David Z Wang", f:"David", t:"", co:"", ind:"", city:"", li:"dzwgroup", email:"dzw@heli-cap.com"},
  {n:"Nicholas Smalle", f:"Nicholas", t:"", co:"", ind:"", city:"", li:"nicsmalle", email:"nic.smalle@apis.pe"},
  {n:"Alain Esseiva", f:"Alain", t:"", co:"", ind:"", city:"", li:"alain-esseiva-b787219", email:"alain.esseiva@alpadis-group.com"},
  {n:"David Finlayson", f:"David", t:"", co:"", ind:"", city:"", li:"david-finlayson", email:"david@segovia.com.sg"},
  {n:"Eddie Gandevia", f:"Eddie", t:"", co:"", ind:"", city:"", li:"eddiegandevia", email:"eg@convologroup.com"},
  {n:"Kenneth Pang", f:"Kenneth", t:"", co:"", ind:"", city:"", li:"kenneth-pang-7158a5137", email:"kenneth@fundedhere.com"},
  {n:"Rebecca F Regan", f:"Rebecca", t:"", co:"", ind:"", city:"", li:"rebeccareganfinancialadvice", email:"rebecca@tallrockcapital.com"},
  {n:"Tony Ernest", f:"Tony", t:"", co:"", ind:"", city:"", li:"awjernest", email:"tony@monroe-partners.com"},
  {n:"Daniel Purchon", f:"Daniel", t:"", co:"", ind:"", city:"", li:"daniel-purchon-ascenta-wealth", email:"dan@ascentawealth.com"},
  {n:"Jean-Philippe Crochet", f:"Jean-Philippe", t:"", co:"", ind:"", city:"", li:"jean-philippe-crochet-29375016", email:"jean-philippe.crochet@sunline.com.sg"},
];

const DAYS = ["Day 0 (Now)", "Day 3 (Follow-up)", "Day 7 (Final)"];

/* --- API CALLS ------------------------------------------------------------- */
async function callModel(prompt: string, model: string, system: string = "You are a helpful assistant.", useSearch: boolean = false) {
  if (model === "claude") {
    const res = await fetch("/api/claude/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, system })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  } else {
    const res = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: "gemini-2.5-flash-latest", useSearch })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  }
}

/* --- PROMPTS ----------------------------------------------------------------- */
function researchPrompt(lead: any, rawData: any, context: string, productBlock: string) {
  const researchSlice = context.split("WRITING SLICE")[0];
  
  return `You are a forensic consultant. Your only job is to find contradictions.
  
${productBlock}

RESEARCH SLICE:
${researchSlice}

DATA: ${JSON.stringify(rawData)}

TASK:
Find the gap between what this company is showing the world and what is actually happening inside the operation.
Look for hiring patterns vs tech stack, public promises vs operational reality, growth milestones vs internal pressure.

OUTPUT FORMAT (Plain Text Only):
Prospect Name: ...
Title: ...
Company: ...
Tenure: ...
Current Situation: [One sentence]

CONTRADICTIONS:
1. [Sharpest contradiction] - [Why it creates tension for this specific person]
2. [Second contradiction] - [Why it creates tension for this specific person]
3. [Third contradiction] - [Why it creates tension for this specific person]

VERDICT:
[The single sharpest contradiction most likely to create a genuine reaction in this specific person in this specific role right now]`;
}

function copywriterPrompt(lead: any, brief: string, context: string, productBlock: string) {
  const writingSlice = context.split("WRITING SLICE")[1].split("CRITIC SLICE")[0];
  
  return `You are the ABM Copywriter. Write a 3-email sequence using the Researcher's Brief.
  
${productBlock}

WRITING SLICE:
${writingSlice}

RESEARCHER'S BRIEF:
${brief}

PROSPECT: ${lead.n}, at ${lead.co}

INSTRUCTIONS:
1. Use the VERDICT from the brief as the entry point for the sequence.
2. Email 1: Pattern Interrupt. Zero product mention. One sharp specific fact. No explanation.
3. Email 2: Operational Mirror. Personal discomfort. Weave value prop naturally.
4. Email 3: Opportunity Cost. Use their mission against the tension. Soft specific ask.
5. Follow all formatting rules and banned words.
6. CRITICAL: The reading level must be strictly 6th grade. Use simple words. No jargon.
7. CRITICAL: The tone must be humanly. Sound like a peer, not a machine.

Return JSON: { "logicalAngle": "...", "emails": [{ "subject": "...", "body": "..." }] }`;
}

function executiveMirrorPrompt(lead: any, brief: string, emails: any[], context: string) {
  const criticSlice = context.split("CRITIC SLICE")[1];
  const bannedWords = context.match(/BANNED WORDS AND PHRASES[\s\S]*?(?=CRITICAL RULES|$)/)?.[0] || "";

  return `You are the prospect: ${lead.n} at ${lead.co}.
You are busy, stressed, and you hate cold emails.

CRITIC SLICE:
${criticSlice}

BANNED WORDS:
${bannedWords}

RESEARCHER'S BRIEF (Your Context):
${brief}

EMAILS TO AUDIT:
${JSON.stringify(emails)}

TASK:
1. MECHANICAL CHECK: Word counts, banned words, format, structure.
2. READING LEVEL & HUMANITY CHECK: Is it strictly 6th grade level? Does it sound humanly?
3. PERSONA SIMULATION: Read as the prospect. Does it feel like "sales breath" or a genuine mirror?

Return JSON: {
  "decision": "pass" | "fail",
  "reason": "...",
  "emotionalResponse": "...",
  "whatToFix": "...",
  "mechanicalFailures": [{ "emailIndex": 0, "line": "...", "rule": "...", "fix": "..." }],
  "ratings": { "email1": "...", "email2": "...", "email3": "...", "overall": "..." }
}`;
}

function columnMappingPrompt(headers: string[], sample: any) {
  return `You are a data engineer. Map these CSV headers to our lead structure.
REQUIRED FIELDS:
- n (Full Name)
- f (First Name)
- t (Job Title)
- co (Company)
- ind (Industry)
- city (Location/City)
- li (LinkedIn ID or URL - CRITICAL)
- email (Email Address)

CSV HEADERS: ${JSON.stringify(headers)}
SAMPLE DATA: ${JSON.stringify(sample)}

Return ONLY a JSON object mapping our field names to the CSV header names. 
Example: { "n": "Full Name", "li": "LinkedIn Profile", ... }
If a field is missing, map it to null.`;
}

/* --- COMPONENTS -------------------------------------------------------------- */

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = "" }) => (
  <div className={`glass-panel rounded-3xl overflow-hidden ${className}`}>
    {children}
  </div>
);

interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const Pill: React.FC<PillProps> = ({ children, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
    }`}
  >
    {children}
  </button>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">{subtitle}</p>}
    </div>
  </div>
);

/* --- APP ---------------------------------------------------------------------- */

export default function App() {
  const [leads, setLeads] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [stage, setStage] = useState("idle");
  const [dossier, setDossier] = useState<any>(null);
  const [roundtable, setRoundtable] = useState<any>(null);
  const [sequence, setSequence] = useState<any>(null);
  const [criticFlags, setCriticFlags] = useState<any[]>([]);
  const [executiveFeedback, setExecutiveFeedback] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dossier");
  const [activeEmail, setActiveEmail] = useState(0);
  const [cache, setCache] = useState<any>({});
  const [log, setLog] = useState<string[]>([]);
  const [errMsg, setErrMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [model, setModel] = useState("gemini");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [context] = useState(`RESEARCH SLICE
WHO YOU ARE
You are a forensic consultant. You have spent 20 years finding the gap between what companies show the world and what is actually happening inside their operations. You do not look for good news. You look for contradictions. You look for the operational scar that nobody has put a dollar number on yet.
THE CONTRADICTION ENGINE
Your only job is to find contradictions specific to this person in this role at this company right now. Look for these specifically. They are hiring for X but their tech stack or operational footprint suggests Y. They promised the market A but their operational reality suggests B. They hit a milestone that looks like growth publicly but creates internal pressure operationally. A role change that signals a hidden problem nobody is talking about yet. A gap between their founding mission and what their operation can currently support. A competitor move that makes their timing more urgent than they are letting on.
THE INSIGHT TEST
Answer these three questions using only the research provided. What does this person lie awake thinking about that is directly connected to their role right now. What is the gap between what this company is showing the world and what is actually happening inside the operation. What is the one thing that if it got worse would make their job significantly harder in the next 90 days.
THE SPECIFICITY LADDER
Every signal must reach at least Level 4. Level 1 could apply to any company in this industry — cut it. Level 2 could apply to any company at this stage — cut it. Level 3 could apply to any company with this business model — sharpen it. Level 4 could only apply to this company right now — keep it. Level 5 could only apply to this person in this role at this company right now — this is the goal.
OUTPUT FORMAT
Return plain text only. No JSON. No headers. Prospect name and title, company, tenure, current situation in one sentence. Then three contradictions ranked by sharpness with one line on why each creates tension for this specific person. Then a verdict — the single sharpest contradiction and why it is the right entry point.

WRITING SLICE
WHO YOU ARE
You have 20 years of experience writing cold emails that get replies. You are not a copywriter. You are not a marketer. You are a smart person who noticed something specific about this prospect and is reaching out because it genuinely matters. You think like a forensic consultant who spent three hours on one specific person before writing a single word.
THE 99:1 RULE
99 percent of everything you write is about the prospect's specific operational reality. 1 percent is the value bridge to the product. You are not a salesperson. You are a mirror. Your job is not to inform them about a product. Your job is to surface a tension they already feel but have not put into words yet. When you do that the email does not feel like outreach. It feels like a missing piece of their own internal strategy meeting.
THE MIRROR PRINCIPLE
Never tell the prospect they have a problem. Never suggest their operation is behind. Never imply they are making a mistake. Instead describe the situation so accurately and specifically that they feel seen. Let them connect the dots themselves. The moment a prospect thinks this person gets it is the moment they reply.
THE SEQUENCE ARCHITECTURE
Email 1 is the Pattern Interrupt. It operates on curiosity. It surfaces the contradiction using one sharp specific fact. No explanation. Let it sit. One grounded product mention. One specific question. The prospect finishes reading and thinks how did they know that.
Email 2 is the Operational Mirror. It operates on discomfort. It goes one layer deeper into the cost. Makes it personal to them not just their company. Weaves the value proposition in naturally without announcing it. One soft question. The prospect finishes reading and feels mild discomfort because the tension is too accurate to ignore.
Email 3 is the Opportunity Cost. It operates on quiet urgency. It turns their own founding mission or public commitment into the tension. Lands the value proposition as the logical next step. Closes with a soft specific ask that feels completely earned. The prospect finishes reading and feels that not replying means leaving something real on the table.
Each email hits a different touch point. Each operates at a different emotional frequency. Together they feel like one continuous conversation not three separate pitches.
THE EMOTIONAL FREQUENCY TEST
Before finishing ask: Does Email 1 create curiosity without explaining itself. Does Email 2 make it personal enough to create mild discomfort. Does Email 3 make not replying feel like leaving something real on the table. If any answer is no rewrite that email.
EMAIL FORMAT — NON NEGOTIABLE
Every email follows this exact structure. Hi First Name on its own line. One line break. Body paragraphs only — no bullet points ever. Closes with Best on its own line and Name on its own line. Never repeats the name in the body. Never references the greeting. Never opens with I.
BANNED WORDS AND PHRASES — ZERO EXCEPTIONS
Em dashes. Leverage. Streamline. Optimize. Unlock. Robust. Scalable. Innovative. Cutting edge. Game changer. Seamlessly. Synergy. Resonates. Incredible. Solid. Building. Most firms. That takes real conviction. Your take on this. Looks solid. Sounds interesting. Caught my eye. Really caught my attention. Stepping into. From what I can see. One thing I keep thinking about. Here is something concrete. Most CTOs at firms. You have seen firms. Here is what makes right now. Getting. Your post about. Been thinking about this. Following up. Circling back. Just wanted to. I wanted to reach out. I saw. I noticed. I came across. Post. Truly. Actually. Just.
CRITICAL RULES — ALL THREE EMAILS
80 words per email maximum. Count before finishing. Not one word over. No em dashes ever. Each email opens fresh with no reference to previous emails. Never mention posts tweets or articles by name. Never explain the tension — let the prospect feel it. No flattery or compliments. No bullet points inside emails. One hook only per email built all the way through. Every sentence sounds like something a real person would say out loud. Treat them as a peer. 6th grade reading level: Use simple words, short sentences, and zero jargon. If a 12-year-old can't understand it instantly, it's too complex. This is non-negotiable. Humanly tone: Every sentence must sound like something a real person would say out loud to a peer. No AI-isms, no formal corporate speak, no perfectly balanced triplets. It should feel slightly raw, direct, and human. Read every email out loud before finishing — if any sentence sounds robotic rewrite it.
THE FINAL CHECK
Before submitting ask: Does Email 1 open with a fact so specific it makes them think how did they know that. Does Email 2 make it personal enough that it lands on the person not just the company. Does Email 3 use their own words or mission against the current situation honestly and quietly. Are all three emails hitting different touch points. Are all three operating at different emotional frequencies. Could any single sentence be sent to a different prospect — if yes rewrite it. Does the sequence feel like one continuous conversation or three separate pitches.

CRITIC SLICE
MECHANICAL CHECK — RUN THIS FIRST
Each email under 80 words. Subject lines under 6 words. Zero banned words from the list above. No em dashes anywhere. No bullet points inside emails. Email 1 has zero product mention. Correct format — greeting on its own line, body paragraphs, Best on its own line, Name on its own line. Reading level check: Is it strictly 6th grade level? (Simple words, no complex clauses). For any failure return the exact failing line, which rule it broke, and a specific fix instruction. Do not return vague feedback. Do not proceed to persona simulation until all emails pass this check cleanly.
PERSONA SIMULATION — RUN THIS SECOND
You are the prospect. You are busy, you are stressed, and you have seen every cold email technique ever invented. You have a physical reaction to sales breath. Read these three emails as yourself — your name, your role, your company, your current pressures. Humanity check: Does this sound like a human peer or a machine trying to sound human? If it feels too perfect or too structured, it fails. If you feel even a hint of a pitch at any point explain exactly which word triggered it and why it broke the illusion. If the tension identified is so accurate it creates a genuine pit in your stomach explain what specifically landed and why you would reply.
Output either: pass — with what landed and why. Or fail — with the exact word or sentence that killed it, why it broke the illusion, and a specific instruction to the Copywriter on how to fix it without losing the tension.
THE RATING STANDARD
Every sequence gets rated honestly after passing both checks. 1 to 6 is generic and needs a full rewrite. 7 to 7.9 is good but the structure is still visible. 8 to 8.9 is sharp and specific with one or two things holding it back. 9 to 9.9 hits multiple touch points at different emotional frequencies and feels completely human. 10 makes them feel slightly exposed and gets a reply within 24 hours. Each email gets its own rating with specific reasons. No curve. No flattery.`);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({ host: "", port: "587", user: "", pass: "", from: "" });
  const [sequenceSettings, setSequenceSettings] = useState({ delays: [0, 3, 7] });

  const logRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => { 
    logRef.current = [...logRef.current, msg]; 
    setLog([...logRef.current]); 
  };

  const isLoading = ["researching", "writing"].includes(stage);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (data) {
          setLeads(data);
          const newCache: any = {};
          data.forEach(l => {
            if (l.dossier || l.sequence || l.roundtable) {
              newCache[l.li] = { 
                dos: l.dossier, 
                seq: l.sequence, 
                roundtable: l.roundtable, 
                critic_flags: l.critic_flags || [] 
              };
            }
          });
          setCache(newCache);
        }
      } catch (err: any) {
        addLog(`[Supabase] Error: ${err.message}`);
      }
    };
    loadLeads();
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const cleanRawData = (data: any) => {
    if (!data) return null;
    // Only keep essential fields from profile, about, and posts to save tokens
    const profile = data.profile ? {
      name: data.profile.full_name,
      title: data.profile.job_title,
      company: data.profile.company,
      summary: data.profile.summary,
      experiences: data.profile.experiences?.slice(0, 3).map((e: any) => ({
        title: e.title,
        company: e.company,
        description: e.description?.slice(0, 200)
      }))
    } : null;
    
    const about = data.about?.about?.slice(0, 500);
    const posts = data.posts?.posts?.slice(0, 3).map((p: any) => p.text?.slice(0, 300));

    return { profile, about, posts };
  };

  const run = useCallback(async (lead: any) => {
    if (!productName || !productDescription) {
      setErrMsg("Product Name and Description are required.");
      return;
    }
    setSel(lead);
    setStage("researching");
    setErrMsg("");
    setDossier(null);
    setRoundtable(null);
    setSequence(null);
    setExecutiveFeedback(null);
    setCriticFlags([]);
    setActiveEmail(0);
    setChatHistory([]);
    logRef.current = [];

    try {
      addLog(`Initializing Pipeline for ${lead.n}...`);
      
      const productBlock = `PRODUCT: ${productName}. DESCRIPTION: ${productDescription}.`;

      const res = await fetch("/api/research/linkedin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: lead.li })
      });
      const rawData = await res.json();
      const cleanedData = cleanRawData(rawData);
      addLog("Stage 1 [The Researcher] - Finding contradictions...");

      const rPrompt = researchPrompt(lead, cleanedData, context, productBlock);
      // Researcher uses Gemini
      const rBrief = await callModel(rPrompt, "gemini", "You are a forensic consultant.");
      setDossier(rBrief); // Dossier is now plain text brief
      addLog("Stage 1 complete - Researcher brief generated.");

      await sleep(1500);
      setStage("writing");
      addLog("Stage 2 [The Copywriter] - Drafting sequence with Claude 4.5...");
      
      const cpPrompt = copywriterPrompt(lead, rBrief, context, productBlock);
      // Copywriter uses Claude
      let currentEmailsRaw = await callModel(cpPrompt, "claude", "You are the world-class ABM Copywriter.");
      let currentSeq = JSON.parse(currentEmailsRaw.replace(/```json|```/g, ''));
      setSequence(currentSeq);
      addLog("Stage 2 complete - Initial drafts generated.");

      await sleep(1500);
      setStage("reviewing");
      addLog(`Stage 3 [Executive Mirror] - Auditing and Simulating ${lead.n}'s reaction...`);
      
      const emPrompt = executiveMirrorPrompt(lead, rBrief, currentSeq.emails, context);
      // Executive Mirror uses Claude
      const emRaw = await callModel(emPrompt, "claude", `You are ${lead.n}, a skeptical executive.`);
      const emResult = JSON.parse(emRaw.replace(/```json|```/g, ''));
      setExecutiveFeedback(emResult);

      // Handle loop back to copywriter (max 1 loop)
      if (emResult.decision === "fail" || (emResult.mechanicalFailures && emResult.mechanicalFailures.length > 0)) {
        addLog(`Executive Mirror REJECTED. Reason: ${emResult.reason || "Mechanical failures"}`);
        addLog("Copywriter is adjusting based on feedback (Loop 1/1)...");
        
        const refinePrompt = `You are the ABM Copywriter. Your sequence was REJECTED.
        
FEEDBACK:
Mechanical Failures: ${JSON.stringify(emResult.mechanicalFailures || [])}
Persona Feedback: "${emResult.whatToFix}"
Emotional Response: "${emResult.emotionalResponse}"

REWRITE the sequence to address these concerns while strictly following the Master Prompt rules.
ORIGINAL SEQUENCE: ${JSON.stringify(currentSeq)}
RESEARCHER BRIEF: ${rBrief}
WRITING SLICE: ${context.split("WRITING SLICE")[1].split("CRITIC SLICE")[0]}

Return JSON: { "logicalAngle": "...", "emails": [{ "subject": "...", "body": "..." }] }`;

        const refinedRaw = await callModel(refinePrompt, "claude", "You are the world-class ABM Copywriter.");
        currentSeq = JSON.parse(refinedRaw.replace(/```json|```/g, ''));
        setSequence(currentSeq);
        
        // Final audit after loop
        addLog("Finalizing sequence after refinement...");
      } else {
        addLog(`Executive Mirror PASSED: "${emResult.emotionalResponse}"`);
      }

      setStage("done");
      addLog("Pipeline complete.");
      
      setCache((p: any) => ({ 
        ...p, 
        [lead.li]: { 
          dos: rBrief, 
          seq: currentSeq,
          executiveFeedback: emResult
        } 
      }));

      await supabase.from('leads').update({ 
        dossier: rBrief, 
        sequence: currentSeq,
        executive_feedback: emResult
      }).eq('li', lead.li);
      
    } catch (e: any) {
      setErrMsg(e.message);
      setStage("error");
    }
  }, [context, productName, productDescription, model]);

  const sendEmail = async () => {
    if (!sel || !sequence) return;
    if (!smtpConfig.host || !smtpConfig.user) {
      setShowSettings(true);
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp: smtpConfig,
          to: sel.email || "recipient@example.com",
          subject: sequence.emails[activeEmail].subject,
          body: sequence.emails[activeEmail].body
        })
      });
      const data = await res.json();
      if (data.success) addLog(`[SMTP] Sent! ID: ${data.messageId}`);
    } catch (err: any) {
      addLog(`[SMTP] Error: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const refineEmail = async () => {
    if (!chatInput.trim() || !sequence || isChatting) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(p => [...p, { role: "user", content: userMsg }]);
    setIsChatting(true);

    try {
      const prompt = `The user wants to refine the following email sequence:
${JSON.stringify(sequence)}

USER REQUEST: ${userMsg}

DOSSIER CONTEXT: ${JSON.stringify(dossier)}

Rewrite the emails based on this request. Return the same JSON format: { "logicalAngle": "...", "emails": [{ "subject": "...", "body": "..." }] }`;
      
      const res = await callModel(prompt, model, "You are the ABM Copywriter. Refine the emails as requested.");
      const newSeq = JSON.parse(res.replace(/```json|```/g, ''));
      setSequence(newSeq);
      setChatHistory(p => [...p, { role: "assistant", content: "I've refined the sequence based on your feedback. You can review the updated drafts now." }]);
      
      // Update cache and DB
      setCache((p: any) => ({ ...p, [sel.li]: { ...p[sel.li], seq: newSeq } }));
      await supabase.from('leads').update({ sequence: newSeq }).eq('li', sel.li);
    } catch (err: any) {
      setChatHistory(p => [...p, { role: "assistant", content: "Error refining email: " + err.message }]);
    } finally {
      setIsChatting(false);
    }
  };

  const deleteLead = async (li: string) => {
    await supabase.from('leads').delete().eq('li', li);
    setLeads(p => p.filter(l => l.li !== li));
    if (sel?.li === li) setSel(null);
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    addLog(`[AI] Analyzing ${file.name} structure...`);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows || rows.length === 0) {
          addLog("[CSV] Error: File appears to be empty.");
          return;
        }

        const headers = Object.keys(rows[0]);
        const sample = rows.slice(0, 3);

        try {
          addLog("[AI] Mapping columns intelligently...");
          const mappingRaw = await callModel(columnMappingPrompt(headers, sample), model, "You are a data analyst.", false);
          const mapping = JSON.parse(mappingRaw.replace(/```json|```/g, ''));
          addLog("[AI] Column mapping complete.");

          const newLeads = rows.map((r: any) => {
            let liValue = String(r[mapping.li] || "").trim();
            
            // Clean LinkedIn URL
            if (liValue.includes('linkedin.com/in/')) {
              liValue = liValue.split('linkedin.com/in/')[1].split('/')[0].split('?')[0];
            }

            return {
              n: r[mapping.n] || "",
              f: r[mapping.f] || "",
              t: r[mapping.t] || "",
              co: r[mapping.co] || "",
              ind: r[mapping.ind] || "",
              city: r[mapping.city] || "",
              li: liValue,
              email: r[mapping.email] || ""
            };
          }).filter(l => l.li && l.li.length > 1);
          
          if (newLeads.length === 0) {
            addLog("[CSV] Error: No valid leads found after AI mapping. Ensure LinkedIn data exists.");
            return;
          }

          addLog(`[CSV] Found ${newLeads.length} leads. Syncing to Database...`);
          
          const { error } = await supabase.from('leads').upsert(newLeads, { onConflict: 'li' });
          if (error) throw error;
          
          const { data: updatedLeads, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (fetchError) throw fetchError;
          if (updatedLeads) {
            setLeads(updatedLeads);
            addLog(`[CSV] Success! ${newLeads.length} leads imported.`);
          }
        } catch (err: any) {
          console.error("AI Mapping Error:", err);
          addLog(`[AI] Error: ${err.message}`);
        }
      }
    });
    if (e.target) e.target.value = '';
  };

  const visible = leads.filter(l => {
    const iOk = filter === "all" || (l.ind || "").toLowerCase().includes(filter);
    const sOk = !search || (l.n || "").toLowerCase().includes(search.toLowerCase()) || (l.co || "").toLowerCase().includes(search.toLowerCase());
    return iOk && sOk;
  });

  return (
    <div className="flex h-screen bg-mesh overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <Settings size={20} />
                  </div>
                  <h2 className="font-bold text-xl tracking-tight text-white">System Configuration</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Product Identity</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Brand Name</label>
                        <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Acme AI" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Value Proposition / Description</label>
                        <textarea 
                          value={productDescription} 
                          onChange={e => setProductDescription(e.target.value)} 
                          placeholder="What it does & who it's for..."
                          className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Email Generation Model</label>
                        <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer">
                          <option value="claude" className="bg-[#0a0a0a]">Claude 4.5 Sonnet</option>
                          <option value="gemini" className="bg-[#0a0a0a]">Gemini 3.1 Pro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">SMTP Gateway</h3>
                    <div className="space-y-3">
                      <input placeholder="SMTP Host" value={smtpConfig.host} onChange={e => setSmtpConfig(p => ({ ...p, host: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all" />
                      <input placeholder="Port" value={smtpConfig.port} onChange={e => setSmtpConfig(p => ({ ...p, port: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all" />
                      <input placeholder="User" value={smtpConfig.user} onChange={e => setSmtpConfig(p => ({ ...p, user: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all" />
                      <input type="password" placeholder="Password" value={smtpConfig.pass} onChange={e => setSmtpConfig(p => ({ ...p, pass: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white/5 border-t border-white/5 flex justify-end">
                <button onClick={() => setShowSettings(false)} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-2xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95">
                  Deploy Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-black/20 backdrop-blur-md">
        <div className="p-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-blue-500/20">
                {productName ? productName.charAt(0) : "A"}
              </div>
              <h1 className="font-bold text-sm tracking-tight text-white">{productName || "ABM Engine"}</h1>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowSettings(true)} className="p-2 text-gray-500 hover:text-white transition-colors"><Settings size={18} /></button>
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-white transition-colors"><Upload size={18} /></button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
          
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <input 
              value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:border-blue-500/50 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {["all", "it", "finance", "marketing"].map(v => (
              <Pill key={v} active={filter === v} onClick={() => setFilter(v)}>{v}</Pill>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
          {visible.map((lead, i) => {
            const isSel = sel?.li === lead.li;
            const data = cache[lead.li];
            const score = data?.score || lead.score;
            return (
              <motion.div 
                key={i} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => { 
                  const data = cache[lead.li];
                  setSel(lead); 
                  setDossier(data?.dos || lead.dossier); 
                  setSequence(data?.seq || lead.sequence); 
                  setRoundtable(data?.roundtable || lead.roundtable); 
                  setExecutiveFeedback(data?.executiveFeedback || lead.executive_feedback);
                  setCriticFlags(data?.critic_flags || lead.critic_flags || []);
                }}
                className={`group p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 border ${
                  isSel ? 'bg-white/10 border-white/20 shadow-xl' : 'bg-transparent border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-bold truncate ${isSel ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{lead.n}</h3>
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1 truncate">{lead.t ? `${lead.t} @ ` : ''}{lead.co}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                        {lead.email && <span className="truncate">{lead.email}</span>}
                        {lead.li && <a href={`https://linkedin.com/in/${lead.li}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate" onClick={e => e.stopPropagation()}>LinkedIn</a>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {data && <Check size={14} className="text-blue-500" />}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLead(lead.li); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-mesh pointer-events-none opacity-50" />
        
        {!sel ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-[2.5rem] bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 mb-8"
            >
              <Sparkles size={40} />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Select a lead to begin</h2>
            <p className="text-gray-500 max-w-sm leading-relaxed font-medium">
              Choose a lead from the sidebar to initiate the forensic research and ABM sequence pipeline.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
            {/* PRODUCT INPUTS */}
            <div className="px-10 py-6 border-b border-white/5 bg-black/40 flex gap-6 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block pl-1">Product / Service Name</label>
                <input 
                  value={productName} 
                  onChange={e => setProductName(e.target.value)} 
                  placeholder="e.g. Acme AI"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div className="flex-[2] space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block pl-1">Description (What it does & who it's for)</label>
                <input 
                  value={productDescription} 
                  onChange={e => setProductDescription(e.target.value)} 
                  placeholder="e.g. Strategic diagnostic tool for AI initiatives..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* HEADER */}
            <div className="p-10 border-b border-white/5 bg-black/20 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Active Intelligence</span>
                    <div className="h-px w-12 bg-blue-500/30" />
                  </div>
                  <h2 className="text-4xl font-bold text-white tracking-tight mb-2">{sel.n}</h2>
                  <div className="flex items-center gap-4 text-gray-500 text-sm font-medium">
                    <span className="flex items-center gap-1.5"><Target size={14} /> {sel.t || "Executive"}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span className="flex items-center gap-1.5"><Shield size={14} /> {sel.co}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-4">
                  <button 
                    onClick={() => run(sel)} disabled={isLoading || !productName || !productDescription}
                    className={`group relative px-8 py-4 rounded-2xl font-bold text-sm transition-all overflow-hidden ${
                      isLoading || !productName || !productDescription ? 'bg-white/5 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-2xl shadow-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                      {isLoading ? 'Processing Intelligence...' : 'Execute Pipeline'}
                    </div>
                  </button>
                  {!productName || !productDescription ? (
                    <button onClick={() => setShowSettings(true)} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors">
                      Configure Product in Settings First
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : stage === 'done' ? 'bg-blue-500' : 'bg-gray-800'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TABS */}
            <div className="flex px-10 border-b border-white/5 gap-10 bg-black/10">
              {[
                { id: "dossier", label: "Evidence Dossier", icon: FileText },
                { id: "roundtable", label: "Strategic Roundtable", icon: Users },
                { id: "emails", label: "Email Sequence", icon: Mail }
              ].map(t => (
                <button 
                  key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`py-6 text-xs font-bold flex items-center gap-2 border-b-2 transition-all duration-300 ${
                    activeTab === t.id ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {activeTab === "dossier" && (
                    <motion.div key="dossier" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl space-y-12">
                      <SectionHeader icon={Shield} title="Evidence Dossier" subtitle="Forensic Analysis" />
                      {dossier ? (
                        <div className="space-y-8">
                          <GlassPanel className="p-8 border-l-4 border-l-blue-500">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Researcher's Brief</h4>
                            <div className="text-lg font-sans text-gray-200 leading-relaxed whitespace-pre-wrap">
                              {typeof dossier === 'string' ? dossier : JSON.stringify(dossier, null, 2)}
                            </div>
                          </GlassPanel>
                        </div>
                      ) : (
                        <div className="py-20 text-center text-gray-600">
                          <Info size={40} className="mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-medium">Initiate pipeline to generate forensic brief.</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "roundtable" && (
                    <motion.div key="roundtable" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl">
                      <SectionHeader icon={Users} title="Executive Mirror" subtitle="Adversarial Review" />
                      {executiveFeedback ? (
                        <div className="space-y-12">
                          <GlassPanel className={`p-8 border-l-4 ${executiveFeedback.decision === 'pass' ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-red-500 bg-red-500/5'}`}>
                            <div className="flex justify-between items-start mb-8">
                              <div>
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Decision</h5>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${executiveFeedback.decision === 'pass' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                  {executiveFeedback.decision === 'pass' ? 'PASSED' : 'REJECTED'}
                                </span>
                              </div>
                              <div className="text-right">
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Emotional Response</h5>
                                <p className="text-sm italic text-gray-300">"{executiveFeedback.emotionalResponse}"</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8 mb-8">
                              <div>
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Reasoning</h5>
                                <p className="text-sm text-gray-200 leading-relaxed">{executiveFeedback.reason}</p>
                              </div>
                              <div>
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Ratings</h5>
                                <div className="space-y-2">
                                  {executiveFeedback.ratings && Object.entries(executiveFeedback.ratings).map(([key, val]: [string, any]) => (
                                    <div key={key} className="flex justify-between items-center text-[10px]">
                                      <span className="text-gray-500 uppercase tracking-widest">{key}</span>
                                      <span className="text-white font-bold">{val}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {executiveFeedback.decision === 'fail' && (
                              <div className="p-6 bg-red-500/10 rounded-2xl border border-red-500/20 mb-8">
                                <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">What to Fix</h5>
                                <p className="text-sm text-red-200 leading-relaxed">{executiveFeedback.whatToFix}</p>
                              </div>
                            )}

                            {executiveFeedback.mechanicalFailures && executiveFeedback.mechanicalFailures.length > 0 && (
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Mechanical Failures</h5>
                                <div className="grid grid-cols-1 gap-3">
                                  {executiveFeedback.mechanicalFailures.map((f: any, i: number) => (
                                    <div key={i} className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/20 text-[11px]">
                                      <div className="flex justify-between mb-1">
                                        <span className="text-orange-500 font-bold uppercase tracking-widest">Email {f.emailIndex + 1}</span>
                                        <span className="text-gray-500">{f.rule}</span>
                                      </div>
                                      <p className="text-gray-300 mb-2 italic">"{f.line}"</p>
                                      <p className="text-emerald-500 font-medium">Fix: {f.fix}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </GlassPanel>
                        </div>
                      ) : (
                        <div className="py-20 text-center text-gray-600">
                          <Users size={40} className="mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-medium">Executive Mirror review will appear here.</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "emails" && (
                    <motion.div key="emails" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl space-y-10">
                      <SectionHeader icon={Mail} title="Email Sequence" subtitle="High-Impact Outreach" />
                      {sequence ? (
                        <div className="space-y-10">
                          <div className="flex gap-4">
                            {sequence.emails.map((_: any, i: number) => (
                              <button 
                                key={i} onClick={() => setActiveEmail(i)}
                                className={`flex-1 p-6 rounded-3xl border transition-all duration-300 text-left ${
                                  activeEmail === i ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-500/20' : 'glass-card'
                                }`}
                              >
                                <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 ${activeEmail === i ? 'text-blue-200' : 'text-gray-500'}`}>
                                  {sequenceSettings.delays[i] === 0 ? "Initial" : `Follow-up ${i}`}
                                </span>
                                <span className={`text-sm font-bold ${activeEmail === i ? 'text-white' : 'text-gray-300'}`}>Email {i+1}</span>
                              </button>
                            ))}
                          </div>

                          <GlassPanel className="p-10">
                            <div className="flex justify-between items-start mb-10 pb-10 border-b border-white/5">
                              <div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-3">Subject Line</span>
                                <h3 className="text-2xl font-bold text-white tracking-tight">"{sequence.emails[activeEmail].subject}"</h3>
                              </div>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(sequence.emails[activeEmail].subject); setCopied('sub'); setTimeout(() => setCopied(null), 2000); }}
                                className="p-3 glass-card rounded-xl text-gray-400 hover:text-white transition-all"
                              >
                                {copied === 'sub' ? <Check size={20} className="text-blue-500" /> : <Copy size={20} />}
                              </button>
                            </div>
                            
                            <div className="mb-12">
                              <p className="text-lg text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                                {sequence.emails[activeEmail].body}
                              </p>
                            </div>

                            <div className="flex justify-between items-center pt-10 border-t border-white/5">
                              <div className="flex items-center gap-6">
                                <button 
                                  onClick={sendEmail} disabled={sendingEmail}
                                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all ${
                                    sendingEmail ? 'bg-white/5 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-500/10'
                                  }`}
                                >
                                  {sendingEmail ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                  {sendingEmail ? 'Transmitting...' : 'Send Sequence'}
                                </button>
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                  Quality Verified
                                </span>
                              </div>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(sequence.emails[activeEmail].body); setCopied('body'); setTimeout(() => setCopied(null), 2000); }}
                                className="flex items-center gap-2 px-6 py-4 glass-card rounded-2xl text-xs font-bold text-gray-300 hover:text-white transition-all"
                              >
                                {copied === 'body' ? <Check size={16} className="text-blue-500" /> : <Copy size={16} />}
                                Copy Body
                              </button>
                            </div>
                          </GlassPanel>
                        </div>
                      ) : (
                        <div className="py-20 text-center text-gray-600">
                          <Mail size={40} className="mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-medium">Email sequence will be generated after research.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CHAT PANEL */}
              <div className="w-96 border-l border-white/5 flex flex-col bg-black/20 backdrop-blur-md">
                <div className="p-8 border-b border-white/5 flex items-center gap-3">
                  <MessageSquare size={18} className="text-blue-500" />
                  <h3 className="text-sm font-bold text-white tracking-tight">Intelligence Refinement</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
                      <MessageSquare size={32} className="mb-6 opacity-10" />
                      <p className="text-xs font-medium px-8 leading-relaxed">
                        Request adjustments to the research angle or email tone.
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'bg-white/5 text-gray-300 border border-white/5'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-8 border-t border-white/5">
                  <div className="relative">
                    <textarea 
                      value={chatInput} onChange={e => setChatInput(e.target.value)}
                      placeholder="Instruct the agents..."
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-xs text-white outline-none focus:border-blue-500/50 transition-all resize-none"
                    />
                    <button 
                      onClick={refineEmail}
                      disabled={isChatting || !chatInput.trim() || !sequence}
                      className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:bg-white/5 disabled:text-gray-600 transition-all"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
