import type React from "react";
import { useState, useMemo } from "react";
import { resumeService } from "../lib/api";
import { useSavedIndexes } from "../hooks/useSavedIndexes";
import { useToast } from "../hooks/use-toats";
import { Upload, FileUp, AlertCircle } from "lucide-react"; // Adicionei ícones para polimento visual (opcional)

interface FileInputProps {
  label?: string;
  setIndexId: (id: string) => void;
  onSuccess?: () => void;
}

const FileInput = ({ label, setIndexId, onSuccess }: FileInputProps) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const { loadIndexes } = useSavedIndexes();
  const { toast } = useToast();

  // Validar se todos os arquivos são PDFs
  const fileValidation = useMemo(() => {
    if (!files) return { isValid: true, pdfCount: 0, nonPdfCount: 0, nonPdfFiles: [] as string[] };
    
    const filesArray = Array.from(files);
    const pdfFiles = filesArray.filter(file => file.type === 'application/pdf');
    const nonPdfFiles = filesArray.filter(file => file.type !== 'application/pdf');
    
    return {
      isValid: nonPdfFiles.length === 0,
      pdfCount: pdfFiles.length,
      nonPdfCount: nonPdfFiles.length,
      nonPdfFiles: nonPdfFiles.map(f => f.name)
    };
  }, [files]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    // Limita a 20 arquivos
    if (selectedFiles.length > 20) {
      toast({
        title: 'Limite excedido',
        description: 'Você pode selecionar no máximo 20 currículos.',
        variant: 'error',
      });
      return;
    }

    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (!files) return;

    setUploading(true);

    try {
      // Converte FileList para Array<File>
      const filesArray = Array.from(files);
      
      const data = await resumeService.uploadResumes(filesArray);
      
      console.log("Upload bem-sucedido:", data);
      console.log("vector_index_id recebido:", data.vector_index_id);

      const indexId = data.vector_index_id;
      setIndexId(indexId);
      
      // Recarrega os índices do servidor (que agora inclui o novo)
      await loadIndexes();
      
      toast({
        title: 'Upload concluído!',
        description: `${data.indexed_files} currículos indexados.`,
        variant: 'success',
      });
      
      // Limpa a seleção de arquivos
      setFiles(null);
      
      // Chama callback de sucesso se fornecido
      onSuccess?.();
      
    } catch (error) {
      console.error("Erro ao enviar os arquivos:", error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : "Erro ao fazer upload dos arquivos.",
        variant: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {label && (
        <span className="text-sm font-black uppercase tracking-wide text-black ml-1">
          {label}
        </span>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        {/* INPUT DE ARQUIVO ESTILIZADO */}
        <div className="relative flex-1 group">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="
              block w-full text-sm text-neo-secondary
              
              py-3 px-4
              text-sm font-bold
              bg-gray-100 text-neo-secondary
              cursor-pointer
              
              
              
              border-2 border-black rounded-lg
              bg-white
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
            "
          >
            Selecionar Arquivos
          </label>
        </div>

        {/* BOTÃO DE ENVIO */}
        <button
          onClick={handleUpload}
          disabled={!files || uploading || !fileValidation.isValid}
          className="
            flex items-center justify-center gap-2
            px-6 py-3
            bg-neo-primary text-neo-secondary font-bold uppercase tracking-wider
            border-2 border-black rounded-lg
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            
            hover:bg-gray-800 hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
            
            active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            
            disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:border-gray-400
            transition-all duration-200
            whitespace-nowrap
          "
        >
          {uploading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Enviar
            </>
          )}
        </button>
      </div>
      
      {/* Feedback visual sutil de quantos arquivos selecionados (opcional, mas ajuda na UX) */}
      {files && files.length > 0 && (
        <>
          {fileValidation.isValid ? (
            <p className="text-xs font-bold text-green-700 mt-1 ml-1 flex items-center gap-1 bg-green-50 border border-green-300 rounded px-2 py-1">
              <FileUp className="w-3 h-3" />
              {fileValidation.pdfCount} arquivo(s) PDF pronto(s) para envio (máximo 20)
            </p>
          ) : (
            <div className="text-xs font-bold text-red-700 mt-1 ml-1 bg-red-50 border-2 border-red-500 rounded px-3 py-2">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle className="w-4 h-4" />
                Apenas arquivos PDF são aceitos
              </div>
              <div className="text-[11px] font-medium">
                ❌ {fileValidation.nonPdfCount} arquivo(s) inválido(s): {fileValidation.nonPdfFiles.join(', ')}
              </div>
              {fileValidation.pdfCount > 0 && (
                <div className="text-[11px] font-medium text-green-700 mt-1">
                  ✅ {fileValidation.pdfCount} PDF(s) válido(s)
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FileInput;