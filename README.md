# CronoAulas - Gerenciamento Escolar Inteligente

CronoAulas é uma aplicação moderna para gestão de horários escolares, aulas e instrutores. Construída com React, Vite, Tailwind CSS e Supabase, oferece uma interface intuitiva e responsiva para organizar o dia a dia educacional.

## 🚀 Funcionalidades

- **Dashboard**: Visão geral de aulas, horas e instrutores ativos.
- **Visualização Diária**: Linha do tempo detalhada com detecção de sobreposição de aulas.
- **Visualização Mensal**: Calendário interativo com suporte para meses de 5 ou 6 semanas.
- **Gestão de Dados**: Cadastro completo de Cursos, Matérias e Instrutores.
- **Modo Dark**: Interface adaptável para maior conforto visual.
- **Realtime**: Sincronização em tempo real via Supabase.

## 🛠️ Tecnologias Principais

- **React 19**
- **Vite**
- **Tailwind CSS**
- **Supabase** (Autenticação e Banco de Dados)
- **Lucide React** (Ícones)
- **Date-fns** (Manipulação de datas)

## 💻 Como Rodar Localmente

1. **Clonar o Repositório**:
   ```bash
   git clone [seu-repositorio-github]
   cd App-CronoAulas
   ```

2. **Instalar Dependências**:
   ```bash
   npm install
   ```

3. **Configurar Variáveis de Ambiente**:
   Crie um arquivo `.env.local` na raiz do projeto e adicione suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=seu_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
   ```

4. **Executar em Desenvolvimento**:
   ```bash
   npm run dev
   ```

## 🌐 Deploy (Vercel)

Esta aplicação está pronta para ser publicada na Vercel:

1. Conecte seu repositório GitHub à Vercel.
2. Nas configurações do projeto, adicione as mesmas variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
3. O deploy será realizado automaticamente a cada push na branch principal.

## 📱 Versão Mobile (Android/APK)

Este projeto utiliza **Capacitor** para gerar a versão mobile.

1. **Gerar Build Web**:
   ```bash
   npm run build
   ```
2. **Sincronizar com Android**:
   ```bash
   npx cap sync
   ```
3. **Gerar APK**:
   Abra a pasta `android` no **Android Studio** e vá em `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

---

## 📄 Licença

Este projeto é privado para uso da CronoAulas.
