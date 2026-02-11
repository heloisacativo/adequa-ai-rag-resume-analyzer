# Guia de Contribuição

Obrigado por considerar contribuir com o Adequa AI! Este documento fornece diretrizes para contribuir com o projeto.

## Código de Conduta

Ao participar deste projeto, você concorda em manter um ambiente respeitoso e colaborativo.

## Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/adequa-ai-rag-resume-analyzer.git
cd adequa-ai-rag-resume-analyzer

# Adicione o repositório original como upstream
git remote add upstream https://github.com/usuario-original/adequa-ai-rag-resume-analyzer.git
```

### 2. Crie uma Branch

```bash
# Atualize sua branch main
git checkout main
git pull upstream main

# Crie uma nova branch para sua feature/bugfix
git checkout -b feature/minha-feature
# ou
git checkout -b fix/correcao-bug
```

### 3. Faça suas Mudanças

- Escreva código limpo e bem documentado
- Siga os padrões de código do projeto
- Atualize a documentação se necessário

### 4. Commit

Use mensagens de commit claras e descritivas:

```bash
# Padrão de commit
git commit -m "tipo: descrição breve

Descrição mais detalhada se necessário"
```

**Tipos de commit:**
- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: alterações na documentação
- `style`: formatação, sem mudança de código
- `refactor`: refatoração de código
- `test`: adição ou correção de testes
- `chore`: tarefas de manutenção

**Exemplos:**
```bash
git commit -m "feat: adiciona filtro por localização na busca de candidatos"
git commit -m "fix: corrige erro ao fazer upload de múltiplos PDFs"
git commit -m "docs: atualiza README com instruções de deploy"
```

### 5. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/minha-feature

# Abra um Pull Request no GitHub
```

## Áreas para Contribuir

### Backend (Python/FastAPI)
- Melhorias no sistema de RAG
- Otimizações de performance
- Novos endpoints de API
- Testes automatizados
- Integração com novos LLMs

### Frontend (React/TypeScript)
- Componentes reutilizáveis
- Melhorias de UX/UI
- Acessibilidade
- Responsividade
- Testes de componentes

### IA e ML
- Novos modelos de embeddings
- Otimização de prompts
- Análises mais precisas
- Suporte a mais formatos de arquivo

### Documentação
- Tutoriais
- Exemplos de uso
- Traduções
- Melhorias no README

### Infraestrutura
- Docker/containerização
- CI/CD
- Monitoramento
- Segurança

## Padrões de Código

### Python
- Siga o [PEP 8](https://pep8.org/)
- Use type hints quando possível
- Docstrings para classes e funções públicas
- Máximo de 100 caracteres por linha

### TypeScript/React
- Use TypeScript estrito
- Componentes funcionais com hooks
- Props tipadas com interfaces
- Naming: PascalCase para componentes, camelCase para funções

### CSS/TailwindCSS
- Use classes do Tailwind sempre que possível
- Mantenha o estilo neobrutalist do projeto
- Responsividade mobile-first

## Pull Request Checklist

Antes de submeter um PR, verifique:

- [ ] O código segue os padrões do projeto
- [ ] Todos os testes passam
- [ ] Novos testes foram adicionados (se aplicável)
- [ ] A documentação foi atualizada
- [ ] O commit está bem descrito
- [ ] Não há conflitos com a branch main
- [ ] O código foi testado localmente

## Reportando Bugs

Ao reportar um bug, inclua:

- **Descrição clara** do problema
- **Passos para reproduzir**
- **Comportamento esperado** vs **comportamento atual**
- **Screenshots** (se aplicável)
- **Ambiente**: SO, versões do Python/Node, navegador
- **Logs de erro** (se houver)

## Sugerindo Funcionalidades

Ao sugerir uma nova funcionalidade:

- **Descrição clara** da funcionalidade
- **Caso de uso**: por que é útil?
- **Alternativas consideradas**
- **Mockups** ou wireframes (se aplicável)

## Contato

Dúvidas? Abra uma issue ou entre em contato:

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/adequa-ai-rag-resume-analyzer/issues)
- **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/adequa-ai-rag-resume-analyzer/discussions)

---

Obrigado por contribuir com o Adequa AI!

