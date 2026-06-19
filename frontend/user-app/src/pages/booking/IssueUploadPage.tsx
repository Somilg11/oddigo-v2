import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useJobStore } from "@/store/job.store";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ArrowLeft, Upload, X, Video, Mic, MicOff } from "lucide-react";

export default function IssueUploadPage() {
    const navigate = useNavigate();
    const { setIssueMedia } = useJobStore();
    const [photos, setPhotos] = useState<string[]>([]);
    const [videos, setVideos] = useState<string[]>([]);
    const [customIssue, setCustomIssue] = useState("");
    const [uploading, setUploading] = useState(false);
    const [recording, setRecording] = useState(false);
    const [voiceNote, setVoiceNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setUploading(true);
        try {
            const results = await Promise.all(
                Array.from(files).map((file) => uploadToCloudinary(file, "oddigo/issues"))
            );
            setPhotos((prev) => [...prev, ...results.map((r) => r.secure_url)]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            logger.error("Photo upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setUploading(true);
        try {
            const results = await Promise.all(
                Array.from(files).map((file) => uploadToCloudinary(file, "oddigo/issues"))
            );
            setVideos((prev) => [...prev, ...results.map((r) => r.secure_url)]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            logger.error("Video upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const file = new File([blob], "voice-note.webm", { type: "audio/webm" });
                try {
                    const result = await uploadToCloudinary(file, "oddigo/voice-notes");
                    setVoiceNote(result.secure_url);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : "Voice note upload failed";
                    setError(message);
                    logger.error("Voice note upload failed", err);
                }
                stream.getTracks().forEach((t) => t.stop());
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Microphone access denied";
            setError(message);
            logger.error("Microphone access denied", err);
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));
    const removeVideo = (index: number) => setVideos((prev) => prev.filter((_, i) => i !== index));

    const handleContinue = () => {
        setIssueMedia(photos, videos, voiceNote, customIssue);
        navigate("/booking/ai-analysis");
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-2">Describe Your Issue</h1>
            <p className="text-gray-500 mb-6">Upload photos and videos to help us understand the problem.</p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Photos *</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {photos.map((url, i) => (
                                <div key={i} className="relative w-20 h-20">
                                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                                    <button
                                        onClick={() => removePhoto(i)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => photoInputRef.current?.click()}
                                className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                                disabled={uploading}
                            >
                                <Upload className="h-6 w-6" />
                            </button>
                        </div>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handlePhotoUpload}
                        />
                        <p className="text-xs text-gray-500 mt-2">Upload at least 1 photo</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Videos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {videos.map((url, i) => (
                                <div key={i} className="relative w-24 h-20">
                                    <video src={url} className="w-full h-full object-cover rounded-lg" />
                                    <button
                                        onClick={() => removeVideo(i)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => videoInputRef.current?.click()}
                                className="w-24 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                                disabled={uploading}
                            >
                                <Video className="h-6 w-6" />
                            </button>
                        </div>
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            multiple
                            className="hidden"
                            onChange={handleVideoUpload}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Voice Note</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {voiceNote ? (
                            <div className="flex items-center gap-3">
                                <audio src={voiceNote} controls className="flex-1" />
                                <Button variant="ghost" size="sm" onClick={() => setVoiceNote("")}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant={recording ? "destructive" : "outline"}
                                onClick={recording ? stopRecording : startRecording}
                                className="w-full"
                            >
                                {recording ? (
                                    <><MicOff className="h-4 w-4 mr-2" /> Stop Recording</>
                                ) : (
                                    <><Mic className="h-4 w-4 mr-2" /> Record Voice Note</>
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Additional Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Describe the issue in your own words..."
                            value={customIssue}
                            onChange={(e) => setCustomIssue(e.target.value)}
                            rows={3}
                        />
                    </CardContent>
                </Card>

                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleContinue}
                    disabled={photos.length === 0 || uploading}
                >
                    {uploading ? "Uploading..." : "Continue"}
                </Button>
            </div>
        </div>
    );
}
