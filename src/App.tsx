import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import "./index.css";
import { siteData } from "./data";

type Scene = "sunrise" | "day" | "sunset" | "night";

/* ---------- shared SVG gradients (defined once) ---------- */
function Defs() {
  const pet = [
    ["#ffe3ef", "#e89ac0", "#a8559a"],
    ["#fff0dc", "#f2b38c", "#c4688a"],
    ["#efe3ff", "#b99be6", "#6f4fa8"],
  ];
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {pet.map((p, i) => (
          <radialGradient key={i} id={`pg${i}`} cx="50%" cy="85%" r="90%">
            <stop offset="0" stopColor={p[0]} />
            <stop offset="0.55" stopColor={p[1]} />
            <stop offset="1" stopColor={p[2]} />
          </radialGradient>
        ))}
        <radialGradient id="fc" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff6c2" />
          <stop offset="0.5" stopColor="#f3c25a" />
          <stop offset="1" stopColor="#b7742f" />
        </radialGradient>
        <linearGradient id="lg" x1="0" x2="1">
          <stop offset="0" stopColor="#c9782f" />
          <stop offset="0.3" stopColor="#ffd77a" />
          <stop offset="0.5" stopColor="#fff3b0" />
          <stop offset="0.75" stopColor="#ffc35c" />
          <stop offset="1" stopColor="#b8651f" />
        </linearGradient>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a4a62" />
          <stop offset="1" stopColor="#2c1432" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ---------- Flower: SVG so the centre is always perfectly aligned ---------- */
function Flower({ hue = 0, className = "", style }: { hue?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" className={`flower ${className}`} style={style} aria-hidden="true">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx="50" cy="26" rx="12" ry="23" fill={`url(#pg${hue % 3})`}
          stroke="rgba(255,255,255,.35)" strokeWidth="0.8" transform={`rotate(${a} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="14" fill="url(#fc)" stroke="#ffe9a0" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="5" fill="#fff6c8" opacity=".85" />
    </svg>
  );
}

function Crown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 64" className={className} aria-hidden="true">
      <path d="M8 54 L14 16 L34 36 L50 8 L66 36 L86 16 L92 54 Z" fill="url(#fc)" stroke="#ffe9a0" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="8" y="52" width="84" height="8" rx="3" fill="url(#fc)" stroke="#ffe9a0" strokeWidth="1.2" />
      {[14, 50, 86].map((x, i) => <circle key={x} cx={x} cy={i === 1 ? 8 : 15} r="4.5" fill="#fff6c8" stroke="#e8a94a" />)}
      {[30, 50, 70].map((x) => <circle key={x} cx={x} cy="56" r="2.2" fill="#e86a8a" />)}
    </svg>
  );
}

/* ---------- Lantern (SVG) ---------- */
function Lantern({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 110" className={`lantern ${className}`} aria-hidden="true">
      <line x1="30" y1="0" x2="30" y2="10" stroke="#e8c27a" strokeWidth="1" />
      <rect x="15" y="10" width="30" height="8" rx="3" fill="#a8642b" />
      <path d="M15 18 Q2 52 15 86 L45 86 Q58 52 45 18 Z" fill="url(#lg)" />
      <ellipse className="l-glow" cx="30" cy="52" rx="13" ry="22" fill="#fffbd0" opacity=".85" />
      <path d="M30 18 V86 M22 18 Q14 52 22 86 M38 18 Q46 52 38 86" stroke="#a55f25" strokeWidth="1" fill="none" opacity=".5" />
      <rect x="17" y="86" width="26" height="7" rx="3" fill="#a8642b" />
      <path d="M24 93 v14 M30 93 v17 M36 93 v14" stroke="#f0c36e" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Drag the lantern, release, and it flies from where you let go ---------- */
function WishLantern({ wish, onFly }: { wish: string; onFly: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const s = useRef({ x: 0, y: 0, ox: 0, oy: 0, drag: false, fly: false });
  const [dragging, setDragging] = useState(false);
  const [fresh, setFresh] = useState(false);

  const down = (e: RPointerEvent<HTMLButtonElement>) => {
    if (s.current.fly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.current.drag = true;
    s.current.ox = e.clientX;
    s.current.oy = e.clientY;
    setDragging(true);
  };
  const move = (e: RPointerEvent<HTMLButtonElement>) => {
    if (!s.current.drag || !ref.current) return;
    const x = e.clientX - s.current.ox;
    const y = Math.min(24, e.clientY - s.current.oy);
    s.current.x = x;
    s.current.y = y;
    ref.current.style.transform = `translate3d(${x}px,${y}px,0) rotate(${x * 0.06}deg)`;
  };
  const up = () => {
    const el = ref.current;
    if (!s.current.drag || !el) return;
    s.current.drag = false;
    setDragging(false);
    const { x, y } = s.current;
    if (y > -60) {
      s.current.x = s.current.y = 0;
      el.style.transform = "";
      return;
    }
    s.current.fly = true;
    onFly();
    const h = window.innerHeight;
    const a = el.animate(
      [
        { transform: `translate3d(${x}px,${y}px,0) scale(1)`, opacity: 1 },
        { transform: `translate3d(${x + 36}px,${y - h * 0.5}px,0) rotate(5deg) scale(.7)`, opacity: 1, offset: 0.5 },
        { transform: `translate3d(${x - 30}px,${y - h * 1.4}px,0) rotate(-4deg) scale(.25)`, opacity: 0 },
      ],
      { duration: 8000, easing: "cubic-bezier(.35,.05,.3,1)", fill: "forwards" },
    );
    a.onfinish = () => {
      a.cancel();
      el.style.transform = "";
      s.current = { x: 0, y: 0, ox: 0, oy: 0, drag: false, fly: false };
      setFresh(true);
      window.setTimeout(() => setFresh(false), 1200);
    };
  };

  return (
    <button ref={ref} type="button" className={`wish-lantern ${dragging ? "dragging" : ""} ${fresh ? "fresh" : ""}`}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      aria-label="Drag the lantern upward and let go">
      <Lantern />
      {wish && <span className="wish-tag">{wish}</span>}
    </button>
  );
}

/* ---------- Cake ---------- */
function Cake({ blown }: { blown: boolean }) {
  return (
    <svg viewBox="0 0 220 200" className="cake" aria-hidden="true">
      <ellipse cx="110" cy="188" rx="95" ry="9" fill="rgba(0,0,0,.35)" />
      <rect x="20" y="120" width="180" height="62" rx="10" fill="#f6d3dc" />
      <path d="M20 132 q15 16 30 0 q15 16 30 0 q15 16 30 0 q15 16 30 0 q15 16 30 0 q15 16 30 0 v-12 h-180z" fill="#fff2f4" />
      <rect x="45" y="78" width="130" height="48" rx="9" fill="#e9b3c9" />
      <path d="M45 90 q13 14 26 0 q13 14 26 0 q13 14 26 0 q13 14 26 0 q13 14 26 0 v-12 h-130z" fill="#fff7f0" />
      <rect x="106" y="42" width="8" height="38" rx="3" fill="#f3c25a" />
      <path className={`flame ${blown ? "off" : ""}`} d="M110 14 q12 14 0 27 q-12 -13 0 -27z" fill="#ffd36a" />
      {blown && <path className="smoke" d="M110 38 q-8 -12 0 -22 q8 -10 0 -20" stroke="#cbbbe0" strokeWidth="2" fill="none" />}
      {[44, 78, 142, 176].map((x) => <circle key={x} cx={x} cy="150" r="5" fill="#e89ac0" />)}
    </svg>
  );
}

function App() {
  const [bookOpen, setBookOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [started, setStarted] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [scene, setScene] = useState<Scene>("sunrise");
  const [photo, setPhoto] = useState<number | null>(null);
  const [letter, setLetter] = useState<"closed" | "opening" | "open">("closed");
  const [pulse, setPulse] = useState<number[]>([]);
  const [blown, setBlown] = useState(false);
  const [wish, setWish] = useState("");
  const [sent, setSent] = useState(0);
  const [said, setSaid] = useState(false);
  const [noN, setNoN] = useState(0);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const yt = useRef<HTMLIFrameElement | null>(null);
  const NO = ["No", "Are you sure? 🥺", "Try again 😌", "Can't catch me ✦", "Too slow!", "Just say yes 💖"];
  const dodge = () => {
    const w = window.innerWidth < 760 ? 70 : 150;
    setNoN((n) => n + 1);
    setNoPos({ x: (Math.random() - 0.5) * 2 * w, y: (Math.random() - 0.5) * 100 });
  };
  const yes = () => {
    setSaid(true);
    window.setTimeout(() => document.querySelector(".flower-world")?.scrollIntoView({ behavior: "smooth" }), 3200);
  };
  const burst = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      x: (Math.random() - 0.5) * 520, y: -(180 + Math.random() * 380),
      s: 34 + Math.random() * 40, d: Math.random() * 0.9, l: i % 3 === 0, h: i % 3,
    })), []);

  const confetti = useMemo(
    () => Array.from({ length: 34 }, (_, i) => ({
      x: (Math.random() - 0.5) * 380, y: -(120 + Math.random() * 240),
      r: Math.random() * 720, c: i % 4, d: Math.random() * 0.25,
    })), []);

  const cmd = (func: "playVideo" | "pauseVideo") =>
    yt.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");

  const openBook = () => {
    if (bookOpen) return;
    setBookOpen(true);
    setStarted(true); // mounts the iframe with autoplay=1 (inside the tap = allowed)
    setMusicOn(true);
    window.setTimeout(() => cmd("playVideo"), 900);
    window.setTimeout(() => setEntered(true), 2800);
  };

  const toggleMusic = () => {
    cmd(musicOn ? "pauseVideo" : "playVideo");
    setMusicOn(!musicOn);
  };

  useEffect(() => {
    if (!entered) return;
    window.scrollTo(0, 0);
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    const io = new IntersectionObserver(
      (list) => list.forEach((en) => {
        if (en.isIntersecting) setScene(en.target.getAttribute("data-scene") as Scene);
      }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [entered]);

  const openLetter = () => {
    if (letter !== "closed") return;
    setLetter("opening");
    window.setTimeout(() => setLetter("open"), 1100);
  };

  const paragraphs = siteData.letterText.split(". ").reduce<string[]>((acc, sentence, i, arr) => {
    if (i % 2 === 0) {
      const next = arr[i + 1];
      acc.push(next ? `${sentence}. ${next}${next.endsWith(".") ? "" : "."}` : sentence.endsWith(".") ? sentence : `${sentence}.`);
    }
    return acc;
  }, []);

  const garden: [number, number, number, number][] = [
    [6, 52, 74, 0], [24, 68, 96, 1], [46, 56, 70, 2], [66, 70, 100, 0],
    [86, 54, 78, 1], [12, 84, 84, 2], [38, 88, 66, 0], [58, 90, 88, 1], [82, 86, 72, 2], [92, 72, 58, 0],
  ];

  return (
    <main className={`storybook-page ${scene} ${bookOpen ? "is-open" : "is-closed"} ${entered ? "entered" : ""}`}>
      <Defs />

      {/* SKY: layered so day/sunset/night cross-fade smoothly */}
      <div className="sky" aria-hidden="true">
        {(["sunrise", "day", "sunset", "night"] as Scene[]).map((n) => (
          <div key={n} className={`sky-layer sky-${n} ${scene === n ? "on" : ""}`} />
        ))}
        <div className="stars">
          {Array.from({ length: 55 }).map((_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 85}%`, animationDelay: `${(i % 7) * 0.5}s` }} />
          ))}
        </div>
        <div className="sun"><i /></div>
        <div className="moon" />
      </div>

      <div className="magic-dust" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, i) => (
          <span key={i} style={{ left: `${(i * 47) % 100}%`, top: `${40 + ((i * 29) % 55)}%`, animationDelay: `${(i % 9) * 0.8}s` }} />
        ))}
      </div>

      {started && (
        <iframe ref={yt} className="youtube-audio" title="Background music"
          src={`https://www.youtube.com/embed/${siteData.youtubeVideoId}?enablejsapi=1&autoplay=1&controls=0&loop=1&playlist=${siteData.youtubeVideoId}&playsinline=1`}
          allow="autoplay; encrypted-media" aria-hidden="true" />
      )}

      {/* ---------- BOOK ---------- */}
      <div className={`book-gate ${bookOpen ? "opened" : ""}`} aria-hidden={entered}>
        <div className="book-stage">
          <div className="book">
            <div className="book-block">
              <div className="book-light" />
            </div>
            <div className="cover">
              <div className="cover-face front">
                <div className="cover-border">
                  <i className="c-corner tl" /><i className="c-corner tr" /><i className="c-corner bl" /><i className="c-corner br" />
                  <div className="cover-emblem"><Crown className="emblem-crown" /></div>
                  <div className="cover-title">
                    <small>A ROYAL TALE FOR</small>
                    <strong>My Princess</strong>
                  </div>
                  <div className="cover-stars">✦ · ✦</div>
                </div>
              </div>
              <div className="cover-face back" />
            </div>
          </div>
          {bookOpen && (
            <div className="burst" aria-hidden="true">
              {burst.map((b, i) => (
                <span key={i} className="burst-item"
                  style={{ ["--bx" as string]: `${b.x}px`, ["--by" as string]: `${b.y}px`, animationDelay: `${1.1 + b.d}s`, width: b.s, height: b.l ? b.s * 1.8 : b.s }}>
                  {b.l ? <Lantern /> : <Flower hue={b.h} />}
                </span>
              ))}
            </div>
          )}
          {!bookOpen && (
            <button type="button" className="book-open-button" onClick={openBook}>
              ✦ Open the story ✦
            </button>
          )}
        </div>
        {!bookOpen && <div className="book-gate-hint">A little story, made just for you</div>}
      </div>
      <div className={`golden-flash ${bookOpen ? "active" : ""}`} aria-hidden="true" />

      {/* ---------- MUSIC ---------- */}
      {entered && (
        <button type="button" className={`music-button ${musicOn ? "playing" : ""}`} onClick={toggleMusic}
          aria-label={musicOn ? "Pause music" : "Play music"}>
          <span className="eq"><i /><i /><i /></span>
          <span className="music-copy">{siteData.songTitle}</span>
          <span className="music-icon">{musicOn ? "❚❚" : "▶"}</span>
        </button>
      )}

      {/* ---------- INVITATION ---------- */}
      <section className="story-section invitation" data-scene="sunrise">
        <div className="invitation-frame">
          <div className="invitation-content">
            <Crown className="crown-top" />
            <span className="eyebrow">✦ BY ROYAL INVITATION ✦</span>
            <h1>A Royal Birthday<br /><em>Date Awaits</em></h1>
            <div className="gold-divider"><span /><b>✦</b><span /></div>
            <p className="invitation-lead">Dear {siteData.personName}, my princess,</p>
            <p className="invitation-body">Tonight the stars are aligned, the lanterns are lit, and the whole kingdom is waiting for you. I made you a little world of our memories, but before you step inside, I have one very important question…</p>
            <div className="invitation-details">
              <div><small>OCCASION</small><strong>Turning {siteData.birthdayAge}</strong></div>
              <div><small>DATE</small><strong>{siteData.birthdayDate}</strong></div>
            </div>
            <p className="ask">Will you go on a date with me?</p>
            {!said ? (
              <div className="ask-buttons">
                <button type="button" className="yes-btn" style={{ transform: `scale(${Math.min(1 + noN * 0.07, 1.5)})` }} onClick={yes}>Yes ♡</button>
                <button type="button" className="no-btn" style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
                  onPointerEnter={dodge} onPointerDown={(e) => { e.preventDefault(); dodge(); }} onClick={dodge}>
                  {NO[Math.min(noN, NO.length - 1)]}
                </button>
              </div>
            ) : (
              <div className="said">
                <div className="confetti">
                  {confetti.map((c, i) => (
                    <i key={i} className={`cf c${c.c}`} style={{ ["--x" as string]: `${c.x}px`, ["--y" as string]: `${c.y}px`, ["--r" as string]: `${c.r}deg`, animationDelay: `${c.d}s` }} />
                  ))}
                </div>
                <p>I knew you'd say yes, my princess ♡</p>
                <small>Come, let me show you our little world ↓</small>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- FLOWERS ---------- */}
      <section className="story-section flower-world" data-scene="day">
        <div className="section-copy">
          <span className="eyebrow">✦ A LITTLE MAGIC ✦</span>
          <h2>Where the<br /><em>flowers glow</em></h2>
          <p>Some places feel magical simply because the right person is standing in them. Tap a flower.</p>
        </div>
        <div className="flowers">
          {garden.map(([l, t, size, hue], i) => (
            <button key={i} type="button" className={`magic-flower ${pulse.includes(i) ? "pulse" : ""}`}
              style={{ left: `${l}%`, top: `${t}%`, width: `calc(${size}px * var(--fs))`, height: `calc(${size}px * var(--fs))`, animationDelay: `${i * 0.35}s` }}
              onClick={() => setPulse((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
              aria-label="Magical flower">
              <Flower hue={hue} />
            </button>
          ))}
        </div>
        <div className="garden-message"><p>For someone worth growing a whole garden for.</p></div>
      </section>

      {/* ---------- GALLERY ---------- */}
      <section className="story-section gallery-section" data-scene="day">
        <div className="section-copy">
          <span className="eyebrow">✦ THE ROYAL GALLERY ✦</span>
          <h2>Little Pieces<br /><em>of Our Story</em></h2>
          <p>Six little moments, kept like paintings in a gallery I never want to forget.</p>
        </div>
        <div className="painting-gallery">
          {siteData.photos.map((p, i) => (
            <button key={p.image} type="button" className={`painting-card p${i % 3}`}
              onClick={() => setPhoto(i)} aria-label={`Open memory ${i + 1}`}>
              <div className="painting-frame">
                {[0, 1, 2, 3].map((k) => (
                  <Flower key={k} hue={k} className="frame-flower"
                    style={{ top: k < 2 ? "-18px" : "auto", bottom: k >= 2 ? "-18px" : "auto", left: k % 2 === 0 ? "-18px" : "auto", right: k % 2 === 1 ? "-18px" : "auto" }} />
                ))}
                <Flower hue={2} className="frame-flower sm" style={{ top: "-12px", left: "calc(50% - 15px)" }} />
                <Flower hue={1} className="frame-flower sm" style={{ bottom: "-12px", left: "calc(50% - 15px)" }} />
                <div className="painting-image-wrap">
                  <img src={p.image} alt={p.caption} loading="lazy" />
                </div>
              </div>
              <div className="painting-plate">
                <span>MEMORY {String(i + 1).padStart(2, "0")}</span>
                <small>{p.caption}</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      {photo !== null && (
        <div className="painting-modal" role="dialog" aria-modal="true" onClick={() => setPhoto(null)}>
          <div className="painting-modal-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setPhoto(null)} aria-label="Close">×</button>
            <div className="modal-frame"><img src={siteData.photos[photo].image} alt={siteData.photos[photo].caption} /></div>
            <p>{siteData.photos[photo].caption}</p>
          </div>
        </div>
      )}

      {/* ---------- LETTER ---------- */}
      <section className="story-section letter-section" data-scene="day">
        <div className="section-copy">
          <span className="eyebrow">✦ A LETTER FOR YOU ✦</span>
          <h2>Words I<br /><em>wanted you to have</em></h2>
          <p>{letter === "closed" ? "Tap the envelope when you're ready." : "Some things deserve more than a passing sentence."}</p>
        </div>

        {letter !== "open" ? (
          <button type="button" className={`envelope ${letter === "opening" ? "opening" : ""}`} onClick={openLetter} aria-label="Open the letter">
            <span className="env-body" />
            <span className="env-flap" />
            <span className="env-seal">✦</span>
            <span className="env-hint">TAP TO OPEN</span>
          </button>
        ) : (
          <article className="letter-card">
            <Flower hue={0} className="letter-flower lf1" />
            <Flower hue={2} className="letter-flower lf2" />
            <span className="letter-date">{siteData.birthdayDate}</span>
            <h3>My beautiful {siteData.personName},</h3>
            {paragraphs.map((p, i) => <p key={i} style={{ animationDelay: `${0.3 + i * 0.35}s` }}>{p}</p>)}
            <p className="letter-final" style={{ animationDelay: `${0.3 + paragraphs.length * 0.35}s` }}>Happy birthday, my love. Here's to another beautiful chapter.</p>
            <div className="letter-signature"><span>Always,</span><strong>{siteData.senderName}</strong></div>
          </article>
        )}
      </section>

      {/* ---------- VIDEO ---------- */}
      <section className="story-section video-section" data-scene="day">
        <div className="section-copy">
          <span className="eyebrow">✦ ONE MORE MEMORY ✦</span>
          <h2>Our Little<br /><em>Moving Picture</em></h2>
          <p>Because some memories are too beautiful to stay still.</p>
        </div>
        <div className="royal-video-frame">
          <video src={siteData.videoUrl} controls playsInline preload="metadata" />
        </div>
      </section>

      {/* ---------- CAKE ---------- */}
      <section className="story-section cake-section" data-scene="sunset">
        <div className="section-copy">
          <span className="eyebrow">✦ AS THE DAY TURNS GOLD ✦</span>
          <h2>Make a wish,<br /><em>blow the candle</em></h2>
          <p>{blown ? "May every wish you make find its way home." : "Tap the cake to blow out the candle."}</p>
        </div>
        <button type="button" className="cake-btn" onClick={() => setBlown(true)} aria-label="Blow out the candle">
          <Cake blown={blown} />
          {blown && (
            <div className="confetti">
              {confetti.map((c, i) => (
                <i key={i} className={`cf c${c.c}`} style={{ ["--x" as string]: `${c.x}px`, ["--y" as string]: `${c.y}px`, ["--r" as string]: `${c.r}deg`, animationDelay: `${c.d}s` }} />
              ))}
            </div>
          )}
        </button>
        {blown && <button type="button" className="ghost-btn" onClick={() => setBlown(false)}>light it again ✦</button>}
      </section>

      {/* ---------- LANTERNS ---------- */}
      <section className="story-section lantern-night" data-scene="night">
        <div className="section-copy">
          <span className="eyebrow">✦ MAKE A WISH ✦</span>
          <h2>Let the<br /><em>lanterns rise</em></h2>
          <p>Write your wish, then drag the lantern up and let it go.</p>
        </div>

        <div className="sky-lanterns" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`floating-lantern fl${i}`}><Lantern /></div>
          ))}
        </div>

        <div className="wish-area">
          <input className="wish-input" value={wish} maxLength={36} onChange={(e) => setWish(e.target.value)}
            placeholder="Write your wish here…" aria-label="Your wish" />
          <WishLantern wish={wish} onFly={() => setSent((n) => n + 1)} />
          <div className="wish-hint">{sent ? "Your wish is on its way ✦" : "↑ drag upward & let go"}</div>
        </div>

        <div className="river">
          <div className="lake-glow" />
          {[8, 22, 37, 52, 66, 80, 91].map((l, i) => <i key={l} className="glint" style={{ left: `${l}%`, top: `${18 + ((i * 23) % 60)}%`, animationDelay: `${i * 0.6}s` }} />)}
          {[14, 70, 86].map((l, i) => <Flower key={l} hue={i} className="lotus" style={{ left: `${l}%`, bottom: `${10 + i * 9}%`, animationDelay: `${i * 1.2}s` }} />)}
          <div className="boat">
            <svg viewBox="0 0 260 150" aria-hidden="true">
              <ellipse cx="130" cy="138" rx="95" ry="7" fill="rgba(255,200,110,.22)" />
              <path d="M26 82 H234 Q222 120 190 128 H70 Q38 120 26 82Z" fill="url(#hull)" stroke="#d9a35a" strokeWidth="1.5" />
              <path d="M40 94 H220" stroke="#e8c27a" strokeWidth="1.2" opacity=".6" />
              <line x1="130" y1="82" x2="130" y2="30" stroke="#b98a52" strokeWidth="3" />
              <g transform="translate(112 6) scale(.3)"><Lantern /></g>
              <circle cx="130" cy="38" r="26" fill="rgba(255,205,110,.25)" />
            </svg>
          </div>
        </div>
      </section>

      {/* ---------- FINAL ---------- */}
      <section className="story-section final-section" data-scene="night">
        <div className="final-content">
          <div className="final-sun">✦</div>
          <span className="eyebrow">✦ AND SO THE STORY CONTINUES ✦</span>
          <h2>Happy<br /><em>Birthday</em></h2>
          <div className="final-highlight">{siteData.personName}</div>
          <div className="gold-divider"><span /><b>✦</b><span /></div>
          <h3>Another year.<br /><strong>Another chapter.</strong></h3>
          <p className="final-message">{siteData.finalMessage}</p>
          <div className="final-signature"><span>With all my love,</span><strong>{siteData.senderName}</strong></div>
        </div>
      </section>
    </main>
  );
}

export default App;