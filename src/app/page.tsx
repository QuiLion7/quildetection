"use client";

import { useRef, useState, useEffect, RefObject } from "react";
import Webcam from "react-webcam";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { Button } from "@/components/ui/button";

import { Slider } from "@/components/ui/slider";
import { FlipHorizontal, Video, PersonStanding } from "lucide-react";
import { Rings } from "react-loader-spinner";
import { toast } from "sonner";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import { drawOnCanvas } from "@/utils/draw";
import { beep } from "@/utils/audio";
import { cn } from "@/lib/utils";

let interval: NodeJS.Timeout;
let stopTimeout: NodeJS.Timeout;

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volume, setVolume] = useState(0.8);
  const [model, setModel] = useState<ObjectDetection>();
  const [loading, setLoading] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(10);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  function formatDate(d: Date) {
    const formattedDate =
      [
        (d.getMonth() + 1).toString().padStart(2, "0"),
        d.getDate().toString().padStart(2, "0"),
        d.getFullYear(),
      ].join("-") +
      " " +
      [
        d.getHours().toString().padStart(2, "0"),
        d.getMinutes().toString().padStart(2, "0"),
        d.getSeconds().toString().padStart(2, "0"),
      ].join("-");
    return formattedDate;
  }

  useEffect(() => {
    if (webcamRef.current?.video) {
      try {
        const videoElement = webcamRef.current?.video as HTMLVideoElement & {
          captureStream: () => MediaStream;
        };
        const stream = videoElement.captureStream();
        if (stream) {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = handleDataAvailable;
          mediaRecorderRef.current.onstart = () => setIsRecording(true);
          mediaRecorderRef.current.onstop = () => setIsRecording(false);
        }
      } catch (error) {
        console.error("Erro ao configurar MediaRecorder:", error);
        toast.error("Erro ao configurar gravação");
      }
    }
  }, []);

  const handleDataAvailable = (e: BlobEvent) => {
    if (e.data.size > 0) {
      try {
        const recordedBlob = new Blob([e.data], { type: "video/webm" });
        const videoURL = URL.createObjectURL(recordedBlob);
        downloadVideo(videoURL);
      } catch (error) {
        console.error("Erro ao processar gravação:", error);
        toast.error("Erro ao salvar gravação");
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    initialModel();
  }, []);

  async function initialModel() {
    try {
      const loadedModel: ObjectDetection = await cocossd.load({
        base: "mobilenet_v2",
      });
      setModel(loadedModel);
    } catch (error) {
      console.error("Erro ao carregar o modelo:", error);
      toast.error("Erro ao carregar o modelo de detecção");
    }
  }

  useEffect(() => {
    if (model) {
      setLoading(false);
    }
  }, [model]);

  function resizeCanvas(
    canvasRef: RefObject<HTMLCanvasElement>,
    webcamRef: RefObject<Webcam>
  ) {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;

    if (canvas && video) {
      const { videoWidth, videoHeight } = video;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }
  }

  async function runPrediction() {
    if (
      model &&
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const predictions: DetectedObject[] = await model.detect(
        webcamRef.current.video
      );

      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext("2d"));

      let isPerson: boolean = false;

      if (predictions.length > 0) {
        predictions.forEach((prediction) => {
          isPerson = prediction.class === "person";
        });

        if (isPerson && autoRecordEnabled) {
          startRecording(true);
        }
      }
    }
  }

  useEffect(() => {
    interval = setInterval(() => {
      runPrediction();
    }, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(stopTimeout);
    };
  }, [model, mirrored, autoRecordEnabled]);

  function base64toBlob(base64Data: string) {
    const byteCharacters = atob(base64Data.split(",")[1]);
    const arrayBuffer = new ArrayBuffer(byteCharacters.length);
    const byteArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: "image/png" });
  }

  function userPromptScreenshot() {
    if (!webcamRef.current) {
      toast.error("Camera não encontrada. Por favor, atualize a página.");
    } else {
      const imgSrc = webcamRef.current.getScreenshot();
      if (imgSrc) {
        const blob = base64toBlob(imgSrc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formatDate(new Date())}.png`;
        a.click();
      } else {
        toast.error("Erro ao capturar a imagem.");
      }
    }
  }

  function startRecording(doBeep: boolean) {
    try {
      if (
        webcamRef.current &&
        mediaRecorderRef.current?.state !== "recording"
      ) {
        mediaRecorderRef.current?.start();
        if (doBeep) {
          beep(volume);
        }

        stopTimeout = setTimeout(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.requestData();
            clearTimeout(stopTimeout);
            mediaRecorderRef.current.stop();
            toast.success("Gravação salva em Downloads");
          }
        }, recordingDuration * 1000);
      }
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast.error("Erro ao iniciar gravação");
    }
  }

  function userPromptRecord() {
    if (!webcamRef.current) {
      toast.error("Camera não encontrada. Por favor, atualize a página.");
    }

    if (mediaRecorderRef.current?.state == "recording") {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
      toast.success("Gravação salva em Downloads");
    } else {
      startRecording(false);
    }
  }

  function toggleAutoRecord() {
    if (autoRecordEnabled) {
      setAutoRecordEnabled(false);
      toast.error("Gravação Desabilitada");
    } else {
      setAutoRecordEnabled(true);
      toast.success("Gravação Habilitada");
    }
  }

  const downloadVideo = (videoURL: string) => {
    const a = document.createElement("a");
    a.href = videoURL;
    a.download = `${formatDate(new Date())}.webm`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <section className="mb-6 text-center animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Detectando Movimentos
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Detecte pessoas em tempo real e grave todos os seus movimentos.
        </p>
      </section>

      <div className="grid lg:grid-cols-[2fr,1fr] gap-8 animate-slide-up">
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border shadow-lg">
            <Webcam
              ref={webcamRef}
              mirrored={mirrored}
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />

            {/* Controles da câmera */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMirrored(!mirrored)}
                className="rounded-full"
              >
                <FlipHorizontal className="h-4 w-4" />
              </Button>

              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={userPromptRecord}
                className="rounded-full"
              >
                <Video
                  className={cn("h-4 w-4", isRecording && "animate-pulse")}
                />
              </Button>

              <Button
                variant={autoRecordEnabled ? "destructive" : "outline"}
                size="icon"
                onClick={toggleAutoRecord}
                className="rounded-full"
              >
                {autoRecordEnabled ? (
                  <Rings color="white" height={20} />
                ) : (
                  <PersonStanding className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-lg border">
            <h2 className="text-xl font-semibold mb-4">Configurações</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium mb-2 block">
                  Volume de Notificação
                </label>
                <span className="text-sm">{(volume * 100).toFixed(0)}%</span>
              </div>
              <Slider
                max={1}
                min={0}
                step={0.1}
                value={[volume]}
                onValueChange={(val) => setVolume(val[0])}
                className="w-full"
              />

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium mb-2 block">
                  Duração da Gravação (s)
                </label>
                <span className="text-sm">{recordingDuration} s</span>
              </div>
              <Slider
                max={60}
                min={1}
                step={1}
                value={[recordingDuration]}
                onValueChange={(val) => setRecordingDuration(val[0])}
                className="w-full"
              />

              <div>
                <Button
                  variant={autoRecordEnabled ? "default" : "outline"}
                  onClick={toggleAutoRecord}
                  className="w-full"
                >
                  {autoRecordEnabled
                    ? "Desativar Gravação Automática"
                    : "Ativar Gravação Automática"}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    model ? "bg-green-500" : "bg-yellow-500"
                  )}
                />
                {model ? "Modelo carregado" : "Carregando modelo..."}
              </p>
              <p className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isRecording ? "bg-red-500" : "bg-slate-500"
                  )}
                />
                {isRecording ? "Gravando" : "Aguardando"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <Rings height={80} color="currentColor" />
            <p className="mt-4 text-lg">Inicializando sistema...</p>
          </div>
        </div>
      )}
    </div>
  );
}
