import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Image, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileUploadProps {
  label: string;
  accept?: string;
  required?: boolean;
  description?: string;
  maxSizeMB?: number;
  onUpload: (url: string, fileName: string) => void;
  value?: string;
  fileName?: string;
  folder?: string;
}

const FileUpload = ({
  label,
  accept = ".pdf,.jpg,.jpeg,.png",
  required = false,
  description,
  maxSizeMB = 5,
  onUpload,
  value,
  fileName,
  folder = "uploads",
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to upload files");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${folder}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("certificate-files")
        .upload(filePath, file);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Use signed URL for private bucket instead of public URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("certificate-files")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        toast.error("Failed to generate file URL");
        return;
      }

      onUpload(signedUrlData.signedUrl, file.name);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleRemove = () => {
    onUpload("", "");
  };

  const isPdf = fileName?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/30">
          {isPdf ? (
            <FileText className="h-8 w-8 text-destructive" />
          ) : (
            <Image className="h-8 w-8 text-accent" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">Uploaded successfully</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}
            ${uploading ? "opacity-50 pointer-events-none" : ""}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            {uploading ? "Uploading..." : "Drop file here or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")} (Max {maxSizeMB}MB)
          </p>
        </div>
      )}
      
      {description && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {description}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
