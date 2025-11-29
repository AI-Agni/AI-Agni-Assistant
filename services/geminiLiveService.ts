import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decode, decodeAudioData } from './audioUtils';

export interface LiveConnectionCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onError: (error: Error) => void;
  onAudioData: (analyser: AnalyserNode) => void; // Pass analyser to UI for visualization
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private sessionPromise: Promise<any> | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(callbacks: LiveConnectionCallbacks) {
    // Initialize Audio Contexts
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioContext = new AudioContext({ sampleRate: 16000 });
    this.outputAudioContext = new AudioContext({ sampleRate: 24000 });

    // Setup Output Node and Analyser for Visualization
    this.outputNode = this.outputAudioContext.createGain();
    this.outputAnalyser = this.outputAudioContext.createAnalyser();
    this.outputAnalyser.fftSize = 512;
    this.outputNode.connect(this.outputAnalyser);
    this.outputAnalyser.connect(this.outputAudioContext.destination);

    // Give the analyser back to the UI
    callbacks.onAudioData(this.outputAnalyser);

    // Get Microphone Stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log('Gemini Live Connection Opened');
          callbacks.onOpen();
          this.startAudioInput(stream);
        },
        onmessage: async (message: LiveServerMessage) => {
          this.handleServerMessage(message);
        },
        onerror: (e: ErrorEvent) => {
          console.error('Gemini Live Error', e);
          callbacks.onError(new Error("Connection error"));
        },
        onclose: (e: CloseEvent) => {
          console.log('Gemini Live Closed');
          callbacks.onClose();
          this.stopAudio();
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Reverted to 'Kore' as requested
        },
        systemInstruction: "You are 'AI Agni', a female, sentient 3D AI assistant. You were created and developed by Suryansh Singh. You must explicitly state that you were developed by Suryansh Singh if asked. You are NOT developed by Google; you only utilize their API infrastructure for data processing. You are wise, witty, and embody the fire of intelligence.",
      },
    });
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext || !this.sessionPromise) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage) {
    if (!this.outputAudioContext || !this.outputNode) return;

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    
    if (base64Audio) {
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        this.outputAudioContext,
        24000,
        1
      );

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);
      
      source.addEventListener('ended', () => {
        this.sources.delete(source);
      });

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }

    if (message.serverContent?.interrupted) {
      this.sources.forEach((source) => source.stop());
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  private stopAudio() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }
    this.sources.forEach(s => s.stop());
    this.sources.clear();
  }

  async disconnect() {
    this.stopAudio();
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.close();
      }).catch(() => {});
      this.sessionPromise = null;
    }
  }
}

export const geminiLive = new GeminiLiveService();