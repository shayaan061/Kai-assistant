import { useEffect, useRef, useState } from "react";

type Props = {
  onResult?: (text: string) => void;
};

export default function useSpeech({ onResult }: Props = {}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore - webkitSpeechRecognition for Chrome
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult?.(transcript);
    };

    recog.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recog;
    return () => recog.stop();
  }, [onResult]);

  const startListening = () => {
    if (!recognitionRef.current) return alert("SpeechRecognition not supported in this browser.");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // simple TTS playback using SpeechSynthesis
  const speak = async (text: string) => {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    // choose a voice optionally:
    // const voices = speechSynthesis.getVoices();
    // utter.voice = voices.find(v=>v.lang.includes("en")) || voices[0];
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  return { listening, startListening, stopListening, speak };
}
