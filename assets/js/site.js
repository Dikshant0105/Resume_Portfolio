/* Dikshant Meshram — portfolio scripts
 * - Visit tracking, contact form and AI chat all go to the Portfolio Tracker Google Apps Script.
 * - The Groq key lives only in Google's Script Properties, never in this file.
 * - Open the site once with ?notrack=1 to stop counting your own visits (?notrack=0 to undo).
 */
(function () {
  "use strict";

  var CONFIG = {
    endpoint: "https://script.google.com/macros/s/AKfycbzLFAdLjrWVgzPBmKvhAttE3UciMGoYm4hFEN5Fj6O74oHtoc6OAsBYXJhD4OFRJ-f4/exec",
    // Upload your resume PDF to this path in the repo. Until it exists, Resume buttons go to the contact page.
    resumeUrl: "assets/Dikshant-Meshram-Resume.pdf",
    email: "dikshant12225@gmail.com",
    linkedin: "https://www.linkedin.com/in/dikshant-meshram-80a625193"
  };

  /* ---------------- helpers ---------------- */
  function store(kind) {
    try { return kind === "local" ? window.localStorage : window.sessionStorage; } catch (e) { return null; }
  }
  function getId(kind, key) {
    var s = store(kind);
    if (!s) return "";
    try {
      var v = s.getItem(key);
      if (!v) { v = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); s.setItem(key, v); }
      return v;
    } catch (e) { return ""; }
  }
  function ignored() {
    try { return window.localStorage.getItem("pt_ignore") === "1"; } catch (e) { return false; }
  }
  function device() {
    var w = window.innerWidth;
    return w < 768 ? "Mobile" : w < 1100 ? "Tablet" : "Desktop";
  }
  function pageName() {
    return document.body.getAttribute("data-page") || window.location.pathname;
  }
  function base() {
    return {
      page: pageName(),
      visitorId: getId("local", "pt_vid"),
      sessionId: getId("session", "pt_sid"),
      device: device(),
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || ""),
      language: navigator.language || ""
    };
  }
  function assign(a, b) { for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k]; return a; }
  function beacon(payload) {
    if (!CONFIG.endpoint || ignored() || navigator.webdriver) return;
    try {
      fetch(CONFIG.endpoint, {
        method: "POST", mode: "no-cors", keepalive: true,
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(assign(base(), payload))
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------------- visit tracking ---------------- */
  function trackVisit() {
    try {
      var p = new URLSearchParams(window.location.search);
      if (p.get("notrack") === "1") window.localStorage.setItem("pt_ignore", "1");
      if (p.get("notrack") === "0") window.localStorage.removeItem("pt_ignore");
    } catch (e) {}
    var ref = "";
    try {
      if (document.referrer) {
        var host = new URL(document.referrer).hostname.replace(/^www\./, "");
        ref = host === window.location.hostname.replace(/^www\./, "") ? "" : host;
      }
    } catch (e) {}
    beacon({ type: "pageview", referrer: ref });
  }

  /* ---------------- nav + reveal ---------------- */
  function navState() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var on = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
    on();
    window.addEventListener("scroll", on, { passive: true });
  }
  function reveal() {
    var els = document.querySelectorAll(".reveal");
    var showAll = function () { els.forEach(function (e) { e.classList.add("in"); }); };
    if (!("IntersectionObserver" in window)) { showAll(); return; }
    document.documentElement.classList.add("js");
    setTimeout(showAll, 2500); // safety net: never leave content hidden
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------------- resume buttons ---------------- */
  function resumeButtons() {
    var btns = document.querySelectorAll("[data-resume]");
    if (!btns.length) return;
    var fallback = "contact.html?topic=resume";
    btns.forEach(function (b) {
      b.setAttribute("href", fallback);
      b.addEventListener("click", function () { beacon({ type: "resume_download" }); });
    });
    // Point buttons at the PDF only if it has been uploaded.
    fetch(CONFIG.resumeUrl, { method: "HEAD" }).then(function (r) {
      var type = r.headers.get("content-type") || "";
      if (r.ok && type.indexOf("pdf") !== -1) {
        btns.forEach(function (b) {
          b.setAttribute("href", CONFIG.resumeUrl);
          b.setAttribute("download", "Dikshant-Meshram-Resume.pdf");
          b.setAttribute("target", "_blank");
          b.setAttribute("rel", "noopener");
        });
      }
    }).catch(function () {});
  }

  /* ---------------- project filters ---------------- */
  function projectFilters() {
    var bar = document.querySelector(".filters");
    if (!bar) return;
    var rows = document.querySelectorAll(".proj");
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (!btn) return;
      bar.querySelectorAll(".filter").forEach(function (f) { f.setAttribute("aria-pressed", String(f === btn)); });
      var tag = btn.getAttribute("data-filter");
      rows.forEach(function (r) {
        var tags = (r.getAttribute("data-tags") || "").split(" ");
        r.hidden = !(tag === "all" || tags.indexOf(tag) !== -1);
      });
    });
  }

  /* ---------------- contact form ---------------- */
  function contactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    try {
      var t = new URLSearchParams(window.location.search).get("topic");
      if (t === "resume") {
        form.topic.value = "Resume request";
        if (!form.message.value) form.message.value = "Hi Dikshant, could you send me a copy of your resume?";
      }
    } catch (e) {}

    var err = form.querySelector(".form-error");
    var btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var done = function () {
        var box = document.createElement("div");
        box.className = "form-done";
        box.setAttribute("role", "status");
        box.innerHTML = "Thanks, " + escapeHtml(form.name.value.split(" ")[0] || "") +
          " — your message is on its way.<p>I usually reply within a day or two at the email you gave.</p>";
        form.replaceWith(box);
      };
      if (form.website.value) { done(); return; } // honeypot
      btn.disabled = true;
      btn.firstChild.nodeValue = "Sending… ";
      var payload = assign(base(), {
        type: "contact",
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        company: form.company.value.trim(),
        topic: form.topic.value,
        message: form.message.value.trim(),
        website: ""
      });
      fetch(CONFIG.endpoint, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).then(done).catch(function () {
        btn.disabled = false;
        btn.firstChild.nodeValue = "Send message ";
        err.hidden = false;
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------- chat assistant ---------------- */
  var INTENTS = [
    { keys: ["hi", "hello", "hey", "yo", "hola", "sup", "morning", "evening"], a: {
      text: "Hi! I'm Dikshant's site assistant. Ask me about his experience, projects, skills, education or how to reach him.",
      follow: ["Who is Dikshant?", "What's his experience?", "Show me his projects"] } },
    { keys: ["who", "yourself", "introduce", "intro", "summary", "dikshant", "background"], w: 1, a: {
      text: "Dikshant Meshram is a software engineer based in Tempe, Arizona. He spent over a year at Accenture building enterprise web apps in .NET Core and React, and is now finishing an MS in Software Engineering at Arizona State University with a 4.00 GPA. He works across web, cloud and applied AI.",
      follow: ["Is he open to roles?", "What are his skills?", "Best projects?"] } },
    { keys: ["hire", "hiring", "open", "available", "availability", "looking", "job", "role", "roles", "position", "opportunity", "fulltime", "full-time", "start", "join"], a: {
      text: "Yes — Dikshant is open to full-time software engineering roles. He's based in Tempe, AZ and open to relocation and remote work. The fastest way to start a conversation is the contact form or email.",
      links: [{ label: "Contact form", href: "contact.html" }, { label: "Email him", href: "mailto:dikshant12225@gmail.com" }],
      follow: ["Download his resume", "What's his experience?"] } },
    { keys: ["experience", "work", "worked", "accenture", "industry", "career", "company", "companies", "professional"], w: 1, a: {
      text: "At Accenture (Nov 2022 – Dec 2023) he was a Custom Software Engineering Associate building enterprise apps with .NET Core and React in Agile teams. Highlights: delivery timelines 20% faster, code coverage raised from 65% to 85% with 30% fewer post-release bugs, legacy VBA macros rebuilt in React (20 → 8 minutes per task for 500+ users), and releases moved from weekly to daily on Azure DevOps at 99.9% uptime. Since Summer 2026 he's also been a Graduate Service Assistant on ASU's Elder Abuse Atlas research project.",
      follow: ["Tell me about the research", "What are his skills?"] } },
    { keys: ["education", "degree", "study", "studied", "university", "college", "school", "masters", "master", "ms", "gpa", "asu", "arizona", "bachelor", "be", "mumbai", "graduate", "graduation"], a: {
      text: "He's completing an MS in Computer Software Engineering at Arizona State University with a 4.00/4.00 GPA. Before that he earned a BE in Information Technology from Mumbai University (2018–2022).",
      follow: ["Any publications?", "What's his experience?"] } },
    { keys: ["skill", "skills", "stack", "tech", "technologies", "technology", "tools", "languages", "language", "know", "proficient", "expertise"], w: 1, a: {
      text: "Languages: Python, TypeScript, JavaScript, Java, C#, PHP. Front-end: React, Next.js, Vue 3, Tailwind. Back-end & data: .NET Core, Spring Boot, FastAPI, Flask, GraphQL, PostgreSQL, MySQL, MongoDB. Cloud & DevOps: AWS, Azure, Docker, Jenkins, GitHub Actions, CI/CD. AI/ML: RAG, pgvector, LangChain, LLM APIs, TensorFlow.",
      follow: ["AI experience?", "Cloud experience?", "Show me his projects"] } },
    { keys: ["project", "projects", "built", "build", "portfolio", "best", "showcase", "favorite", "made"], w: 1, a: {
      text: "A few highlights: Clinavis (AI clinical summarization — he led a team of 4), Elder Abuse Atlas (NIJ-funded research platform), DispatchIQ (explainable AI fleet dispatch), Coverage IQ (prescription policy analysis with cited answers), and an autoscaling face-recognition system on AWS. There are 14 in total.",
      links: [{ label: "See all 14 projects", href: "projects.html" }],
      follow: ["Tell me about Clinavis", "Tell me about DispatchIQ"] } },
    { keys: ["clinavis", "clinical", "summarization", "healthcare", "medical", "soap"], w: 3, a: {
      text: "Clinavis is an AI clinical summarization platform with dashboards for admins, doctors, nurses and patients. Dikshant led a 4-person team and built SOAP-aware chunking, MiniLM embeddings with patient-scoped pgvector retrieval, and role-aware reranking. Results: +19.4% Precision@5, +18.0% Recall@5 and +20.6% BERTScore F1. Stack: React, FastAPI, PostgreSQL, Supabase.",
      follow: ["Other AI projects?", "Show me his projects"] } },
    { keys: ["dispatchiq", "dispatch", "fleet", "driver", "drivers", "trucking", "logistics"], w: 3, a: {
      text: "DispatchIQ (hackathon, April 2026) combines fleet monitoring, rule-based driver ranking, LLM-generated explanations, a LangChain + Groq assistant and ElevenLabs voice briefings. Scoring was validated across 11 controlled scenarios. Stack: React, Flask, Supabase/PostgreSQL.",
      follow: ["Tell me about Coverage IQ", "Does he do hackathons?"] } },
    { keys: ["coverage", "coverageiq", "prescription", "payer", "policy", "insurance", "appeal", "drug"], w: 3, a: {
      text: "Coverage IQ (hackathon, 2026) extracts payer policy PDFs into a 13-field schema, answers questions with RAG over pgvector with source citations, detects changes between policy versions, and drafts appeals. It orchestrates Gemini, Groq and Cerebras with automatic fallback. Stack: React, FastAPI, Supabase, Auth0.",
      follow: ["Tell me about Clinavis", "Show me his projects"] } },
    { keys: ["research", "elder", "atlas", "abuse", "nij", "skeletal", "assistant", "gsa"], w: 3, a: {
      text: "Elder Abuse Atlas is a National Institute of Justice-funded research platform: a skeletal atlas and diagnostic tool that helps distinguish abuse-related trauma from accidental falls in older adults. Dikshant contributes to its Vue 3/TypeScript + Spring Boot platform (GraphQL, REST, MongoDB), integrates an R/Plumber + JAGS diagnosis service, supports Docker Compose deployment, and proposed a plugin architecture for swappable diagnosis algorithms.",
      follow: ["What's his education?", "Show me his projects"] } },
    { keys: ["aws", "cloud", "azure", "devops", "docker", "lambda", "ec2", "serverless", "kubernetes", "ci", "cd", "pipeline", "deploy", "deployment"], w: 3, a: {
      text: "On the cloud side he built an AWS face-recognition system with custom queue-driven autoscaling (0 → 15 EC2 workers using S3 and SQS), plus a serverless/edge version on Lambda, ECR and IoT Greengrass. At Accenture he optimized Azure DevOps CI/CD with containerized builds, taking releases from weekly to daily at 99.9% uptime.",
      follow: ["AI experience?", "What are his skills?"] } },
    { keys: ["ai", "ml", "machine", "learning", "llm", "llms", "rag", "gpt", "langchain", "embedding", "embeddings", "nlp", "genai", "generative", "model", "models", "neural", "deep"], w: 3, a: {
      text: "Lots of applied AI: RAG pipelines with pgvector and reranking (Clinavis), explainable recommendations (DispatchIQ), multi-provider LLM orchestration with fallback (Coverage IQ), ML inference on AWS, and a CNN for handwriting recognition published in IEEE Xplore. He's worked with OpenAI, Anthropic, Groq, Gemini and Cerebras APIs.",
      follow: ["Tell me about Clinavis", "Any publications?"] } },
    { keys: ["frontend", "front-end", "react", "next", "nextjs", "vue", "ui", "javascript", "typescript", "tailwind"], w: 3, a: {
      text: "Front-end: React (Accenture, Clinavis, DispatchIQ, Coverage IQ, GreenLoop), Next.js (FinSecure), and Vue 3 with TypeScript (Elder Abuse Atlas). He also built a React app that replaced legacy VBA macros for 500+ users.",
      follow: ["Back-end experience?", "Show me his projects"] } },
    { keys: ["backend", "back-end", "api", "apis", ".net", "dotnet", "net", "c#", "java", "spring", "python", "fastapi", "flask", "database", "sql", "postgres", "mongodb", "graphql"], w: 3, a: {
      text: "Back-end: .NET Core / ASP.NET Core (Accenture), Spring Boot (Elder Abuse Atlas, GreenLoop), FastAPI and Flask (Clinavis, Coverage IQ, DispatchIQ), Java/Javalin (Software Quality Metrics Platform), with PostgreSQL, MySQL, MongoDB and GraphQL.",
      follow: ["Cloud experience?", "What are his skills?"] } },
    { keys: ["test", "testing", "quality", "unit", "pytest", "junit", "bugs"], a: {
      text: "He treats testing as part of shipping: at Accenture he raised coverage from 65% to 85% and cut post-release bugs by 30%. His projects use pytest, Vitest, JUnit and CI on GitHub Actions or Jenkins.",
      follow: ["What's his experience?"] } },
    { keys: ["publication", "publications", "paper", "published", "ieee", "handwritten", "handwriting", "cnn"], w: 3, a: {
      text: "Yes — his CNN-based handwritten text recognition research (TensorFlow/Keras with image preprocessing) was published in IEEE Xplore at GCAT 2022.",
      follow: ["What's his education?", "AI experience?"] } },
    { keys: ["certification", "certifications", "certified", "sc-900", "sc900", "microsoft", "certificate"], w: 3, a: {
      text: "He holds Microsoft SC-900 (Security, Compliance, and Identity Fundamentals, 2023) and completed Accenture's .NET Primer." } },
    { keys: ["lead", "leader", "leadership", "led", "team", "teamwork", "agile", "scrum", "manage", "managed", "collaborate"], a: {
      text: "He led a 4-person team on Clinavis, served as Scrum Master for the first sprint of a 5-person Scrum Simulator project, and was Management Head of the RAIT ACM Student Chapter (2019–2020). At Accenture he partnered closely with UX, QA and product in Agile/Scrum teams.",
      follow: ["Tell me about Clinavis", "What's his experience?"] } },
    { keys: ["hackathon", "hackathons", "globehack", "hack"], w: 3, a: {
      text: "He loves hackathons — DispatchIQ, Coverage IQ and Desert Sprout all started at one. You'll find a photo from GlobeHack '26 on his About page.",
      links: [{ label: "About page", href: "about.html" }] } },
    { keys: ["hobby", "hobbies", "fun", "free", "interests", "interest", "outside", "weekend", "personal", "hiking", "hike", "baseball", "games", "gaming", "photography", "photos", "sky", "sunset"], a: {
      text: "Off the clock he's usually hiking, at a hackathon, catching a baseball game, gaming, or photographing sunsets and the sky.",
      links: [{ label: "See his photos", href: "about.html#off-the-clock" }] } },
    { keys: ["contact", "reach", "email", "mail", "message", "talk", "connect", "linkedin", "call", "touch"], a: {
      text: "You can email him at dikshant12225@gmail.com (or dmeshram@asu.edu), connect on LinkedIn, or use the contact form — he usually replies within a day or two.",
      links: [{ label: "Contact form", href: "contact.html" }, { label: "LinkedIn", href: "https://www.linkedin.com/in/dikshant-meshram-80a625193" }] } },
    { keys: ["resume", "cv", "pdf", "download"], a: {
      text: "You can get his resume from the black \"Resume\" button in the top-right of any page.",
      follow: ["How do I contact him?"] } },
    { keys: ["where", "location", "located", "live", "based", "city", "relocate", "relocation", "remote", "onsite", "hybrid", "tempe", "phoenix"], a: {
      text: "He's based in Tempe, Arizona, and open to relocation and remote roles.",
      follow: ["Is he open to roles?"] } },
    { keys: ["visa", "sponsorship", "sponsor", "authorization", "citizen", "h1b", "opt", "stem"], w: 3, a: {
      text: "For work authorization details, it's best to ask Dikshant directly — he'll give you a clear answer.",
      links: [{ label: "Contact form", href: "contact.html" }] } },
    { keys: ["thanks", "thank", "thx", "cool", "great", "awesome", "nice", "bye", "goodbye"], a: {
      text: "Happy to help! If you'd like to talk to Dikshant directly, the contact page is the quickest route.",
      links: [{ label: "Contact", href: "contact.html" }] } }
  ];
  var FALLBACK = {
    text: "I'm not sure about that one — I mostly know about Dikshant's experience, projects, skills, education and interests. Try one of these, or ask him directly:",
    links: [{ label: "Contact Dikshant", href: "contact.html" }],
    follow: ["What's his experience?", "What are his skills?", "Is he open to roles?"]
  };

  function findAnswer(q) {
    var words = {};
    q.toLowerCase().replace(/[^a-z0-9#.+\-\s]/g, " ").split(/\s+/).forEach(function (w) { if (w) words[w] = 1; });
    var best = null, bestScore = 0;
    INTENTS.forEach(function (it) {
      var w = it.w || 2, s = 0;
      it.keys.forEach(function (k) { if (words[k]) s += w; });
      if (s > bestScore) { bestScore = s; best = it; }
    });
    return best ? best.a : FALLBACK;
  }

  function askAI(question, history) {
    if (!CONFIG.endpoint || !window.fetch) return Promise.resolve(null);
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    return fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        type: "chat", question: question,
        history: history.slice(-6),
        sessionId: getId("session", "pt_sid"), visitorId: getId("local", "pt_vid"), page: pageName()
      }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok && d.answer) return { text: String(d.answer), sources: d.sources };
      if (d && d.error === "rate_limited" && d.answer) return { text: String(d.answer) };
      return null;
    }).catch(function () { return null; }).finally(function () { clearTimeout(timer); });
  }

  var ICON_CHAT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><circle cx="8.5" cy="12" r=".6" fill="currentColor"/><circle cx="12" cy="12" r=".6" fill="currentColor"/><circle cx="15.5" cy="12" r=".6" fill="currentColor"/></svg>';
  var ICON_X = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function chat() {
    var greeting = "Hi! I can answer questions about Dikshant's experience, projects, skills and background. What would you like to know?";
    var history = [];
    var busy = false;

    var fab = document.createElement("button");
    fab.className = "chat-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Open chat");
    fab.setAttribute("aria-expanded", "false");
    fab.setAttribute("aria-controls", "chat-panel");
    fab.innerHTML = ICON_CHAT + '<span class="ping"></span>';

    var panel = document.createElement("div");
    panel.className = "chat-panel";
    panel.id = "chat-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Ask about Dikshant");
    panel.innerHTML =
      '<div class="chat-head"><div class="t"><span class="s"></span><div><b>Ask about Dikshant</b><small>AI · answers from his resume</small></div></div>' +
      '<button class="chat-x" type="button" aria-label="Close chat">×</button></div>' +
      '<div class="chat-list" aria-live="polite"></div>' +
      '<div class="chips"></div>' +
      '<form class="chat-input"><input type="text" maxlength="300" placeholder="Ask about Dikshant…" aria-label="Your question" autocomplete="off">' +
      '<button class="chat-send" type="submit" aria-label="Send"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></button></form>';

    document.body.appendChild(panel);
    document.body.appendChild(fab);

    var list = panel.querySelector(".chat-list");
    var chips = panel.querySelector(".chips");
    var form = panel.querySelector(".chat-input");
    var input = form.querySelector("input");
    var send = form.querySelector("button");

    function add(from, text, extra) {
      var m = document.createElement("div");
      m.className = "msg " + from;
      var b = document.createElement("div");
      b.className = "bubble";
      b.textContent = text;
      m.appendChild(b);
      if (extra && extra.sources && extra.sources.length) {
        var s = document.createElement("span");
        s.className = "src";
        s.textContent = "Sources: " + extra.sources.join(" · ");
        m.appendChild(s);
      }
      if (extra && extra.links && extra.links.length) {
        var l = document.createElement("div");
        l.className = "links";
        extra.links.forEach(function (lk) {
          var a = document.createElement("a");
          a.href = lk.href;
          a.textContent = lk.label + " →";
          if (/^https?:/.test(lk.href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
          l.appendChild(a);
        });
        m.appendChild(l);
      }
      list.appendChild(m);
      list.scrollTop = list.scrollHeight;
      return m;
    }
    function setChips(arr) {
      chips.innerHTML = "";
      (arr || []).forEach(function (c) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "chip"; b.textContent = c;
        b.addEventListener("click", function () { ask(c); });
        chips.appendChild(b);
      });
    }
    function setOpen(open) {
      panel.hidden = !open;
      fab.setAttribute("aria-expanded", String(open));
      fab.setAttribute("aria-label", open ? "Close chat" : "Open chat");
      fab.innerHTML = (open ? ICON_X : ICON_CHAT) + '<span class="ping"></span>';
      if (open) setTimeout(function () { input.focus(); }, 30);
    }
    function ask(q) {
      q = (q || "").trim();
      if (!q || busy) return;
      busy = true;
      input.value = "";
      input.disabled = true; send.disabled = true;
      setChips([]);
      add("user", q);
      var typing = add("bot", "Searching his resume…");
      var local = findAnswer(q);
      var hist = history.slice();
      history.push({ from: "user", text: q });
      askAI(q, hist).then(function (ai) {
        return ai || new Promise(function (r) { setTimeout(function () { r(null); }, 300); });
      }).then(function (ai) {
        typing.remove();
        var text = ai ? ai.text : local.text;
        add("bot", text, { sources: ai && ai.sources, links: local.links });
        history.push({ from: "bot", text: text });
        setChips(local.follow);
        busy = false;
        input.disabled = false; send.disabled = false;
        input.focus();
      });
    }

    add("bot", greeting);
    setChips(["Who is Dikshant?", "Is he open to roles?", "Best projects?", "How do I contact him?"]);

    fab.addEventListener("click", function () { setOpen(panel.hidden); });
    panel.querySelector(".chat-x").addEventListener("click", function () { setOpen(false); fab.focus(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { setOpen(false); fab.focus(); } });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    var y = document.querySelectorAll("[data-year]");
    y.forEach(function (e) { e.textContent = new Date().getFullYear(); });
    navState();
    reveal();
    resumeButtons();
    projectFilters();
    contactForm();
    chat();
    trackVisit();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
