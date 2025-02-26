"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Rings } from "react-loader-spinner";
import { Camera, FlipHorizontal, PersonStanding, Video } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Separator } from "./ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { toast } from "sonner";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import { drawOnCanvas } from "@/utils/draw";
import { beep } from "@/utils/audio";

interface WebcamSectionProps {
  className?: string;
}

export function WebcamSection({ className }: WebcamSectionProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volume, setVolume] = useState(0.8);
  const [model, setModel] = useState<ObjectDetection>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (webcamRef && webcamRef.current) {
      const stream = (webcamRef.current.video as any).captureStream();
      if (stream) {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = handleDataAvailable;
        mediaRecorderRef.current.onstart = () => setIsRecording(true);
        mediaRecorderRef.current.onstop = () => setIsRecording(false);
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    initializeModel();
  }, []);

  const initializeModel = async () => {
    try {
      const loadedModel = await cocossd.load({ base: "mobilenet_v2" });
      setModel(loadedModel);
    } catch (error) {
      console.error("Error loading model:", error);
      toast.error("Failed to load detection model");
    } finally {
      setLoading(false);
    }
  };

  const handleDataAvailable = (e: BlobEvent) => {
    if (e.data.size > 0) {
      const recordedBlob = new Blob([e.data], { type: "video" });
      const videoURL = URL.createObjectURL(recordedBlob);
      downloadVideo(videoURL);
    }
  };

  const downloadVideo = (videoURL: string) => {
    const a = document.createElement("a");
    a.href = videoURL;
    a.download = `${formatDate(new Date())}.webm`;
    a.click();
  };

  const formatDate = (d: Date) => {
    return [
      [d.getMonth() + 1, d.getDate(), d.getFullYear()].map(n => n.toString().padStart(2, "0")).join("-"),
      [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => n.toString().padStart(2, "0")).join("-")
    ].join(" ");
  };

  return (
    <div className={className}>
      <div className="relative">
        <div className="relative">
          <Webcam
            ref={webcamRef}
            mirrored={mirrored}
            className="w-full h-full rounded-lg"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        <div className="absolute top-4 left-4 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMirrored(prev => !prev)}
          >
            <FlipHorizontal />
          </Button>
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={() => {
              if (isRecording) {
                mediaRecorderRef.current?.stop();
              } else {
                mediaRecorderRef.current?.start();
              }
            }}
          >
            <Video className={isRecording ? "animate-pulse" : ""} />
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Detection Settings</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h3 className="font-medium">Detection Volume</h3>
                <Slider
                  value={[volume]}
                  onValueChange={([v]) => setVolume(v)}
                  max={1}
                  step={0.1}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
                <Separator />
                <div className="flex items-center gap-2">
                  <Button
                    variant={autoRecordEnabled ? "default" : "outline"}
                    onClick={() => setAutoRecordEnabled(prev => !prev)}
                    className="w-full"
                  >
                    <PersonStanding className="mr-2" />
                    {autoRecordEnabled ? "Auto Recording On" : "Auto Recording Off"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {loading && (
          <div className="flex items-center justify-center">
            <Rings
              height="50"
              width="50"
              color="gray"
              radius="6"
              wrapperStyle={{}}
              wrapperClass=""
              visible={true}
              ariaLabel="rings-loading"
            />
          </div>
        )}
      </div>
    </div>
  );
}