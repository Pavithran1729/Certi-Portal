import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CertificateTemplate } from "@/hooks/useTemplates";
import { Eye } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CertificateTemplate | null;
}

const TemplatePreviewDialog = ({ open, onOpenChange, template }: Props) => {
  if (!template) return null;

  const content = (template as any).template_content;

  if (!content) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {template.template_name}
            </DialogTitle>
            <DialogDescription>No design content available for preview.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview: {template.template_name}
          </DialogTitle>
          <DialogDescription>
            This shows the approximate structure of the generated document. The final .docx may differ in perfect formatting depending on exact tags.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[65vh] border rounded-md bg-white text-black p-8 mt-4">
          <div className="max-w-2xl mx-auto space-y-8 font-serif">
            {/* Header Preview */}
            {content.header && (
              <div className="text-center space-y-4 border-b pb-6">
                {content.header.logo_url && (
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400 bg-gray-50 flex-col gap-1">
                       <span>[Logo]</span>
                       <span className="truncate w-full px-2 text-center text-[10px] break-all">{content.header.logo_url}</span>
                    </div>
                  </div>
                )}
                {content.header.institution_name && (
                  <h2 className="text-xl font-bold whitespace-pre-wrap">{content.header.institution_name}</h2>
                )}
                {content.header.certificate_title && (
                  <h3 className="text-lg font-bold underline underline-offset-4 mt-6">
                    {content.header.certificate_title.toUpperCase()}
                  </h3>
                )}
              </div>
            )}

            {/* Body Preview */}
            {content.body && (
              <div className="text-justify leading-relaxed whitespace-pre-wrap">
                {/* Highlight <tags> in blue */}
                {content.body.split(/(<[^>]+>)/g).map((part: string, i: number) => {
                  if (part.startsWith("<") && part.endsWith(">")) {
                    return <span key={i} className="text-blue-600 font-mono text-sm bg-blue-50 px-1 rounded">{part}</span>;
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>
            )}

            {/* Footer Preview */}
            {content.footer && (
              <div className="pt-24 flex justify-between items-end border-t border-dashed mt-12">
                <div className="text-left w-1/3">
                  {content.footer.show_date && (
                    <p className="font-semibold text-sm">Date: _________</p>
                  )}
                </div>
                {content.footer.signatory_name && (
                  <div className="text-center w-1/3 flex flex-col items-center">
                    <div className="h-10"> {/* Signature space */} </div>
                    <p className="font-bold border-t border-gray-400 pt-2 px-4 w-full text-center">
                      {content.footer.signatory_name}
                    </p>
                    {content.footer.signatory_designation && (
                      <p className="text-sm text-gray-600">{content.footer.signatory_designation}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewDialog;
