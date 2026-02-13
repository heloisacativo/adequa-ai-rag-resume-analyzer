import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ArrowLeft, X, Plus, Save, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toats';
import type { SeniorityLevel, JobStatus } from '../types/Index';

export default function JobForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const MAX_DESCRIPTION_LENGTH = 5000;
  const isDescriptionTooLong = description.length > MAX_DESCRIPTION_LENGTH;

  const handleDescriptionChange = (value: string) => {
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(value);
    }
  };
  const [seniority, setSeniority] = useState<SeniorityLevel>('mid');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [status, setStatus] = useState<JobStatus>('draft');

  // Array fields
  const [technicalReqs, setTechnicalReqs] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [requiredCriteria, setRequiredCriteria] = useState<string[]>([]);
  const [desiredCriteria, setDesiredCriteria] = useState<string[]>([]);

  // Temp inputs for array fields
  const [techInput, setTechInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [requiredInput, setRequiredInput] = useState('');
  const [desiredInput, setDesiredInput] = useState('');

  const addToArray = (
    value: string,
    setInput: (v: string) => void,
    array: string[],
    setArray: (v: string[]) => void
  ) => {
    if (value.trim() && !array.includes(value.trim())) {
      setArray([...array, value.trim()]);
      setInput('');
    }
  };

  const removeFromArray = (index: number, array: string[], setArray: (v: string[]) => void) => {
    setArray(array.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe o título da vaga.',
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: 'Vaga criada!',
      description: 'A vaga foi salva com sucesso.',
    });

    setIsLoading(false);
    navigate('/jobs');
  };

  const ArrayInput = ({
    label,
    value,
    onChange,
    array,
    setArray,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    array: string[];
    setArray: (v: string[]) => void;
    placeholder: string;
  }) => (
    <div className="space-y-2">
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addToArray(value, onChange, array, setArray);
            }
          }}
          className="input input-bordered w-full"
        />
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => addToArray(value, onChange, array, setArray)}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {array.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {array.map((item, index) => (
            <div key={index} className="badge badge-secondary gap-1">
              {item}
              <button
                type="button"
                onClick={() => removeFromArray(index, array, setArray)}
                className="ml-1 hover:text-error"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            className="btn btn-ghost btn-square"
            onClick={() => navigate('/jobs')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nova Vaga</h1>
            <p className="text-muted-foreground">
              Preencha os detalhes para criar uma nova vaga.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Informações Básicas</h2>
              <p className="text-base-content/70 mb-4">Dados principais da vaga</p>
              <div className="space-y-2">
                <label htmlFor="title" className="label">
                  <span className="label-text">Título da vaga *</span>
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Desenvolvedor Frontend Senior"
                  className="input input-bordered w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="label">
                  <span className="label-text">Descrição</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Descreva a vaga, responsabilidades e o que você busca..."
                  rows={5}
                  className={`textarea textarea-bordered w-full ${isDescriptionTooLong ? 'textarea-error' : ''}`}
                />
                <label className="label">
                  <span className={`label-text-alt ${isDescriptionTooLong ? 'text-error' : ''}`}>
                    {isDescriptionTooLong 
                      ? `Descrição muito longa (${description.length}/${MAX_DESCRIPTION_LENGTH} caracteres)`
                      : `${description.length}/${MAX_DESCRIPTION_LENGTH} caracteres`
                    }
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label">
                    <span className="label-text">Senioridade</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
                  >
                    <option value="junior">Júnior</option>
                    <option value="mid">Pleno</option>
                    <option value="senior">Sênior</option>
                    <option value="lead">Lead</option>
                    <option value="principal">Principal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JobStatus)}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="active">Ativa</option>
                    <option value="paused">Pausada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="location" className="label">
                    <span className="label-text">Localização</span>
                  </label>
                  <input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: São Paulo, SP (Híbrido)"
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="salary" className="label">
                    <span className="label-text">Faixa salarial</span>
                  </label>
                  <input
                    id="salary"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="Ex: R$ 10.000 - R$ 15.000"
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Requisitos</h2>
              <p className="text-base-content/70 mb-4">
                Defina as habilidades e critérios para a vaga
              </p>
              <ArrayInput
                label="Requisitos Técnicos"
                value={techInput}
                onChange={setTechInput}
                array={technicalReqs}
                setArray={setTechnicalReqs}
                placeholder="Ex: React, TypeScript..."
              />

              <ArrayInput
                label="Soft Skills"
                value={softInput}
                onChange={setSoftInput}
                array={softSkills}
                setArray={setSoftSkills}
                placeholder="Ex: Comunicação, Liderança..."
              />

              <ArrayInput
                label="Palavras-chave"
                value={keywordInput}
                onChange={setKeywordInput}
                array={keywords}
                setArray={setKeywords}
                placeholder="Ex: frontend, design system..."
              />
            </div>
          </div>

          {/* Criteria */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Critérios de Seleção</h2>
              <p className="text-base-content/70 mb-4">
                Defina o que é obrigatório e o que é diferencial
              </p>
              <ArrayInput
                label="Critérios Obrigatórios"
                value={requiredInput}
                onChange={setRequiredInput}
                array={requiredCriteria}
                setArray={setRequiredCriteria}
                placeholder="Ex: 5+ anos de experiência..."
              />

              <ArrayInput
                label="Critérios Desejáveis"
                value={desiredInput}
                onChange={setDesiredInput}
                array={desiredCriteria}
                setArray={setDesiredCriteria}
                placeholder="Ex: Conhecimento em Next.js..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/jobs')}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || isDescriptionTooLong}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Vaga
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
