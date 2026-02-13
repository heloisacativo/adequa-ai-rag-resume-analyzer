import { useState } from 'react';
import { useCandidateAnalysis } from '../hooks/useCandidateAnalysis';

interface CandidateAnalyzerProps {
  indexId: string;
}

export function CandidateAnalyzer({ indexId }: CandidateAnalyzerProps) {
  const [jobDescription, setJobDescription] = useState('');
  const { analyzeCandidates, isAnalyzing, analysisResult } = useCandidateAnalysis();

  const MAX_DESCRIPTION_LENGTH = 5000;
  const isDescriptionTooLong = jobDescription.length > MAX_DESCRIPTION_LENGTH;

  const handleDescriptionChange = (value: string) => {
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setJobDescription(value);
    }
  };

  const handleAnalyze = async () => {
    if (isDescriptionTooLong) {
      return;
    }
    await analyzeCandidates(jobDescription, indexId);
  };

  return (
    <div className="space-y-6">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Descrição da Vaga</span>
        </label>
        <textarea
          className={`textarea textarea-bordered h-32 ${isDescriptionTooLong ? 'textarea-error' : ''}`}
          placeholder="Descreva a vaga, requisitos técnicos, experiência necessária..."
          value={jobDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
        />
        <label className="label">
          <span className={`label-text-alt ${isDescriptionTooLong ? 'text-error' : ''}`}>
            {isDescriptionTooLong 
              ? `Texto muito longo (${jobDescription.length}/${MAX_DESCRIPTION_LENGTH} caracteres)`
              : `Quanto mais detalhes, melhor a análise (${jobDescription.length}/${MAX_DESCRIPTION_LENGTH})`
            }
          </span>
        </label>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!jobDescription.trim() || isAnalyzing || isDescriptionTooLong}
        className="btn btn-primary w-full"
      >
        {isAnalyzing ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Analisando candidatos...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Analisar Candidatos
          </>
        )}
      </button>

      {analysisResult && (
        <div className="space-y-4">
          <div className="stats shadow w-full">
            <div className="stat">
              <div className="stat-title">Total de Candidatos</div>
              <div className="stat-value text-neo-primary">{analysisResult.total_candidates}</div>
              <div className="stat-desc">Currículos analisados</div>
            </div>
          </div>

          {analysisResult.best_candidate && (
            <div className="bg-neo-secondary text-black border-1 border-black p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">Melhor Candidato</h3>
                <div className="text-sm">
                  {analysisResult.best_candidate.candidate_name} - 
                  <span className="font-semibold ml-1">
                    {analysisResult.best_candidate.score}/100
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Ranking de Candidatos</h3>
            <div className="space-y-3">
              {analysisResult.ranking.map((candidate, index) => (
                <div key={candidate.resume_id} className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="badge badge-lg badge-primary font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">
                            {candidate.candidate_name}
                          </h4>
                          <p className="text-sm text-base-content/60">
                            {candidate.file_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-neo-primary">
                          {candidate.score}
                        </div>
                        <div className="text-xs text-base-content/60">pontos</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <progress 
                        className={`progress ${
                          candidate.score >= 80 ? 'progress-success' :
                          candidate.score >= 60 ? 'progress-warning' :
                          'progress-error'
                        } w-full`}
                        value={candidate.score} 
                        max="100"
                      />
                    </div>

                    {candidate.strengths.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-semibold text-success mb-2">
                          ✓ Pontos Fortes
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {candidate.strengths.map((strength, i) => (
                            <span key={i} className="badge badge-success badge-outline">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {candidate.weaknesses.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-semibold text-warning mb-2">
                          ⚠ Pontos Fracos
                        </h5>
                        <div className="flex flex-wrap gap-2">
                                                  {candidate.weaknesses.map((weakness, i) => (
                                                    <span key={i} className="badge badge-warning badge-outline">
                                                      {weakness}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }