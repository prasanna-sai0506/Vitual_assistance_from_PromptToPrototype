import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createPcmBlob, decode, decodeAudioData } from '../utils/audioUtils';
import { AssistantConfig } from '../types';

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private session: any = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private activeSources = new Set<AudioBufferSourceNode>();

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  // Define tools for system control
  private getTools(): FunctionDeclaration[] {
    return [
      {
        name: 'controlSystem',
        description: 'Control system hardware settings: WiFi, Bluetooth, Volume, Brightness, Power.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            setting: {
              type: Type.STRING,
              description: 'The setting: "wifi", "bluetooth", "brightness", "volume", "airplane_mode", "power_saver"',
            },
            toggleState: {
              type: Type.BOOLEAN,
              description: 'True for ON, False for OFF.',
            },
            numericValue: {
              type: Type.NUMBER,
              description: '0-100 for brightness/volume.',
            },
          },
          required: ['setting'],
        },
      },
      {
        name: 'launchApplication',
        description: 'Launch a Windows application.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            appName: {
              type: Type.STRING,
              description: 'Name of the app (e.g., Chrome, Spotify, Notepad).',
            },
          },
          required: ['appName'],
        },
      },
      {
        name: 'searchFiles',
        description: 'Search for files on the local computer. Can filter by filename, file type, or modification date.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: 'The filename or keyword to search for.',
            },
            fileType: {
              type: Type.STRING,
              description: 'The file extension/type to filter by (e.g., pdf, jpg, docx).',
            },
            date: {
              type: Type.STRING,
              description: 'The modification date to filter by in YYYY-MM-DD format.',
            }
          },
        },
      },
      {
        name: 'setTimer',
        description: 'Set a countdown timer.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            duration: {
              type: Type.NUMBER,
              description: 'Duration in seconds.',
            },
            label: {
              type: Type.STRING,
              description: 'Optional label for the timer.',
            },
          },
          required: ['duration'],
        },
      },
      {
        name: 'getWeather',
        description: 'Get the current weather for a location.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            location: {
              type: Type.STRING,
              description: 'City or region name.',
            },
          },
          required: ['location'],
        },
      }
    ];
  }

  public async connect(
    config: AssistantConfig,
    onAudioData: (isPlaying: boolean) => void,
    onToolCall: (name: string, args: any) => Promise<any>,
    onLog: (msg: string, type: 'info' | 'error' | 'action') => void
  ) {
    // Initialize Audio Contexts
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Get Mic Stream
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      onLog("Microphone access denied", "error");
      throw e;
    }

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
            onopen: () => {
                onLog("Nova Connected", "info");
                if (this.inputAudioContext && this.stream) {
                    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
                    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
                    this.processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                    };
                    this.source.connect(this.processor);
                    this.processor.connect(this.inputAudioContext.destination);
                }
            },
            onmessage: async (msg: LiveServerMessage) => {
                const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    onAudioData(true);
                    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext!.currentTime);
                    const buffer = await decodeAudioData(decode(audioData), this.outputAudioContext!, 24000, 1);
                    
                    const source = this.outputAudioContext!.createBufferSource();
                    source.buffer = buffer;
                    source.connect(this.outputAudioContext!.destination);
                    
                    source.addEventListener('ended', () => {
                        this.activeSources.delete(source);
                        if (this.activeSources.size === 0) onAudioData(false);
                    });
                    
                    source.start(this.nextStartTime);
                    this.nextStartTime += buffer.duration;
                    this.activeSources.add(source);
                }

                if (msg.toolCall) {
                    for (const fc of msg.toolCall.functionCalls) {
                        onLog(`Executing: ${fc.name}`, "action");
                        const result = await onToolCall(fc.name, fc.args);
                        
                        sessionPromise.then(s => s.sendToolResponse({
                            functionResponses: {
                                id: fc.id,
                                name: fc.name,
                                response: { result },
                            }
                        }));
                    }
                }
                
                if (msg.serverContent?.interrupted) {
                    this.activeSources.forEach(s => s.stop());
                    this.activeSources.clear();
                    this.nextStartTime = 0;
                    onAudioData(false);
                }
            },
            onclose: () => onLog("Disconnected", "info"),
            onerror: (e) => onLog(`Error: ${e}`, "error"),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
        },
        systemInstruction: `You are ${config.name}, an intelligent Windows 11 Assistant.
        
        Capabilities:
        1. System Control: Toggle WiFi, Bluetooth, Adjust Volume/Brightness.
        2. App Management: Open applications (Calculator, Spotify, Browser, etc).
        3. File System: Search for files by name, file type (e.g. "Find all PDFs"), or modification date.
        4. Utilities: Set timers, check weather.

        Personality:
        - Helpful, concise, and professional.
        - When a user asks to search files, use the 'searchFiles' tool.
        - When asked to open an app, use 'launchApplication'.
        - If a file is found, mention its name.
        `,
        tools: [{ functionDeclarations: this.getTools() }],
      },
    });

    this.session = await sessionPromise;
  }

  public async disconnect() {
    if (this.session) {
      this.stream?.getTracks().forEach(t => t.stop());
      this.processor?.disconnect();
      this.source?.disconnect();
      this.inputAudioContext?.close();
      this.outputAudioContext?.close();
      this.activeSources.forEach(s => s.stop());
    }
  }
}