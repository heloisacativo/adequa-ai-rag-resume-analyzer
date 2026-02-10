import type React from "react";
import { useState, useMemo } from "react";
import { resumeService } from "../lib/api";
import { useSavedIndexes } from "../hooks/useSavedIndexes";
import { useToast } from "../hooks/use-toats";
import { Upload, FileUp, AlertCircle, X, Trash2, Plus, FolderOpen } from "lucide-react"; 
interface FileInputProps {
  label?: string;
  setIndexId: (id: string) => void;
  onSuccess?: () => void;
}

const FileInput = ({ label, setIndexId, onSuccess }: FileInputProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { loadIndexes } = useSavedIndexes();
  const { toast } = useToast();

  const fileValidation = useMemo(() => {
    if (!files || files.length === 0) return { isValid: true, pdfCount: 0, nonPdfCount: 0, nonPdfFiles: [] as string[] };
    
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    const nonPdfFiles = files.filter(file => file.type !== 'application/pdf');
    
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

    const newFilesArray = Array.from(selectedFiles);
    const totalFiles = files.length + newFilesArray.length;

    if (totalFiles > 50) {
      toast({
        title: 'Limite excedido',
        description: `Você já tem ${files.length} arquivo(s). Pode adicionar no máximo ${50 - files.length} arquivo(s) a mais (limite: 50 currículos).`,
        variant: 'error',
      });
      return;
    }

    // Adiciona os novos arquivos aos existentes
    setFiles(prev => [...prev, ...newFilesArray]);
    // Limpa o input para permitir selecionar os mesmos arquivos novamente
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const data = await resumeService.uploadResumes(files);


      const indexId = data.vector_index_id;
      setIndexId(indexId);
      
      await loadIndexes();
      
      toast({
        title: 'Upload concluído!',
        description: `${data.indexed_files} currículos indexados.`,
        variant: 'success',
      });
      
      setFiles([]);
      
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
        <div className="relative flex-1 group">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={uploading || files.length >= 50}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className={`
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
              flex items-center justify-center gap-2
              ${files.length >= 50 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {files.length >= 50 ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Limite Atingido (50 currículos)
              </>
            ) : files.length > 0 ? (
              <>
                <Plus className="w-4 h-4" />
                Adicionar Mais Arquivos
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4" />
                Selecionar Arquivos
              </>
            )}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading || !fileValidation.isValid}
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
      
      {files && files.length > 0 && (
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between bg-gray-50 border-2 border-black rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              {fileValidation.isValid ? (
                <div className="flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-neo-secondary" />
                  <span className="text-sm font-bold text-neo-secondary">
                    {fileValidation.pdfCount} PDF{fileValidation.pdfCount !== 1 ? 's' : ''} pronto{fileValidation.pdfCount !== 1 ? 's' : ''} para envio
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-bold text-red-700">
                    {fileValidation.pdfCount} válido{fileValidation.pdfCount !== 1 ? 's' : ''}, {fileValidation.nonPdfCount} inválido{fileValidation.nonPdfCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={clearAllFiles}
              className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
              title="Limpar todos os arquivos"
            >
              <Trash2 className="w-3 h-3" />
              Limpar Tudo
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 bg-white border-2 border-black rounded-lg p-3">
            {files.map((file, index) => {
              const isPdf = file.type === 'application/pdf';
              const fileSize = (file.size / 1024).toFixed(1); 
              
              return (
                <div
                  key={`${file.name}-${index}`}
                  className={`
                    flex items-center justify-between gap-3 p-2 rounded-lg border-2 transition-all
                    ${isPdf 
                      ? 'bg-neo-primary border-neo-secondary' 
                      : 'bg-red-50 border-red-300 hover:bg-red-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isPdf ? (
                      <FileUp className="w-4 h-4 text-neo-secondary shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${isPdf ? 'text-neo-secondary' : 'text-red-800'}`} title={file.name}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${isPdf ? 'text-neo-secondary' : 'text-red-600'}`}>
                        {fileSize} KB {!isPdf && '• Apenas PDFs são aceitos'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(index)}
                    className={`
                      shrink-0 p-1.5 rounded-lg border-2 transition-all
                      ${isPdf 
                        ? 'bg-white border-neo-secondary text-neo-secondary cursor-pointer hover:text-white' 
                        : 'bg-white border-red-400 text-red-700 hover:bg-red-200 hover:border-red-500'
                      }
                    `}
                    title="Remover arquivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-600 text-center font-medium">
            {files.length} de 50 currículos • Você pode adicionar mais {50 - files.length} arquivo(s)
          </p>
        </div>
      )}
    </div>
  );
};

export default FileInput;