import { useState } from 'react';
import { ResumeUploader } from '../components/ResumeUploader';
import { CandidateAnalyzer } from '../components/CandidateAnalyzer';

export function ResumesPage() {
  const [vectorIndexId, setVectorIndexId] = useState<string>('');

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">
        Sistema de Análise de Currículos
      </h1>

      <div className="space-y-8">
        {/* Upload Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            1. Enviar Currículos
          </h2>
          <ResumeUploader onUploadComplete={setVectorIndexId} />
        </section>

        {/* Analysis Section */}
        {vectorIndexId && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Analisar Candidatos
            </h2>
            <CandidateAnalyzer indexId={vectorIndexId} />
          </section>
        )}
      </div>
    </div>
  );
}