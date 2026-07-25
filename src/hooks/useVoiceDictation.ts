import { useCallback, useEffect, useRef, useState } from "react";

// Minimal shape of the browser SpeechRecognition API we use.
type SRResult = { 0: { transcript: string }; isFinal: boolean };
type SREvent = { results: ArrayLike<SRResult>; resultIndex: number };
interface SRInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function getCtor(): (new () => SRInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SRInstance;
    webkitSpeechRecognition?: new () => SRInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceDictation(onAppend: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SRInstance | null>(null);
  const finalTailRef = useRef("");

  useEffect(() => { setSupported(!!getCtor()); }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    finalTailRef.current = "";
    rec.onresult = (e) => {
      let interim = "";
      let finalPiece = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0].transcript;
        if (r.isFinal) finalPiece += txt;
        else interim += txt;
      }
      if (finalPiece) {
        onAppend((finalTailRef.current ? " " : "") + finalPiece.trim());
        finalTailRef.current += finalPiece;
      } else if (interim) {
        // fire interim occasionally as append via callback caller strategy
        onAppend("\u200B" + interim); // sentinel-prefixed interim
      }
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => { setListening(false); recRef.current = null; };
    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch { /* already started */ }
  }, [onAppend]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  const toggle = useCallback(() => { listening ? stop() : start(); }, [listening, start, stop]);

  return { listening, supported, start, stop, toggle };
}
