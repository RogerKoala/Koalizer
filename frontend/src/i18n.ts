export const translations = {
 en: {
  // App.tsx
  appTitle: "Koalizer",
  appSubtitle:
   "Upload your audio file to get a detailed analysis of speakers and transcription.",
  errorTitle: "Error",
  // FileUpload.tsx
  uploadClick: "Click to upload a audio/video file",
  uploadDrag: "or drag and drop",
  selectedFile: "Selected file",
  processAudio: "Process Audio",
  importProjectDescription:
   "Click to import a previously saved project to continue editing without needing to process the file again!",
  loadProject: "Load File",
  acceptedAudioFormats:
   "Accepted formats: MP3, WAV, M4A, FLAC, OGG, OPUS, AMR, MP4, MOV, MKV, AVI",
  acceptedProjectFormats: "Accepted format: .koala",
  invalidProjectFileType: "Invalid file type. Only .koala files are accepted.",
  audioSegmentsLoaded: "audio segments loaded",
  // Loader.tsx
  processing: "Processing audio...",
  takeAMoment: "This may take a moment.",
  uploadingFile: "Uploading file...",
  uploadingDescription: "Sending your file.",
  downloadingVideo: "Downloading video...",
  downloadingDescription: "Downloading audio from YouTube video.",
  downloadingFromYoutube: "Extracting audio from YouTube",
  identifyingLanguage: "Identifying language",
  identifyingLanguageDescription: "Detecting audio language.",
  transcribing: "Transcribing...",
  transcribingDescription: "Converting speech to text.",
  aligning: "Aligning...",
  aligningDescription: "Synchronizing text with audio timestamps.",
  diarizing: "Diarizing...",
  diarizingDescription: "Identifying and separating speakers.",
  // ResultsDisplay.tsx
  analysisOf: "Analysis of ",
  exportPDF: "Export to PDF",
  exportProject: "Save Project",
  importProject: "Open a project",
  saving: "Saving...",
  analyzeAnother: "Analyze Another File",
  projectSavedSuccess: "Project saved successfully!",
  projectLoadedSuccess: "Project loaded successfully!",
  exportProjectError: "Error exporting project.",
  importProjectError: "Error importing project.",
  invalidProjectFormat: "Invalid project format.",
  transcriptionTime: "Transcription Time",
  aligningTime: "Alignment time",
  diarizationTime: "Diarization Time",
  manageSpeakers: "Manage Speakers",
  exportWarning: "A name must be provided for all speakers to enable export.",
  exportPDFAlert:
   "Please provide a name for all speakers before exporting to PDF.",
  transcriptionSegments: "Transcription Segments",
  summary: "Summary",
  fileSavedSuccess: "File saved successfully!",
  person: "Person",
  // PDF generation
  pdfTitle: "Transcription Report",
  pdfSourceFile: "Source File",
  pdfGeneratedAt: "Generated At",
  pdfTranscription: "Transcription",
  pdfSummary: "Summary",
  pdfPage: "Page",
  pdfOf: "of",
  // SpeakerManager.tsx
  speakerInputPlaceholder: "Enter new name",
  deleteSpeaker: "Delete speaker",
  speakerDeletedLabel: "Speaker Deleted",
  addNewSpeaker: "Add New Speaker",
  // AddSegmentButton.tsx
  addSegment: "Add Segment",
  selectSpeaker: "Select Speaker",
  noSpeakersAvailable: "No speaker available",
  // SummaryStats.tsx
  audioDuration: "Audio Duration",
  totalWords: "Total Words",
  // TranscriptionCard.tsx
  speakerNameLabel: "Speaker Name",
  deleteSegmentLabel: "Delete segment",
  transcriptionTextLabel: "Transcription Text",
  segmentDeletedMessage: "Segment deleted.",
  undoButtonLabel: "Undo",
  invalidTimeRange: "End time must be greater than start time",
  editTime: "Edit time",
  save: "Save",
  playSegmentAudio: "Play segment audio",
  stopSegmentAudio: "Stop audio",
  // ToastNotification.tsx
  close: "Close",
  undoButton: "Undo",
  // Settings
  settings: "Settings",
  language: "Interface language",
  ptBr: "Portuguese",
  eng: "English",
  theme: "Theme",
  lightTheme: "Light",
  darkTheme: "Dark",
  credits: "Credits",
  libs:
   "I want to give special thanks to the open-source libraries that made this app possible. In particular:",
  libsAll:
   "In addition to these, I'm also grateful to all the other libraries and developers from the open-source community who contributed directly or indirectly to this project. Without this amazing ecosystem, none of this would be possible!",
  author: "Author",
  // YouTube
  uploadFile: "Upload File",
  youtubeLink: "YouTube Link",
  youtubeUrlLabel: "YouTube URL",
  youtubeUrlPlaceholder: "Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  invalidYoutubeUrl: "Please enter a valid YouTube URL.",
  processYoutube: "Process YouTube Video",
  // Errors
  invalidFileType:
   "Unsupported file type. Only the following audio and video formats are allowed: .mp3, .wav, .m4a, .flac, .ogg, .opus, .amr, .mp4, .mov, .mkv, .avi.",
  selectFileFirst: "Please select a file first.",
  processingFailed: "Failed to process the audio file. Please try again.",
 },
 pt: {
  // App.tsx
  appTitle: "Koalizer",
  appSubtitle:
   "Envie seu arquivo de áudio para obter uma análise detalhada dos locutores e da transcrição.",
  errorTitle: "Erro",
  // FileUpload.tsx
  uploadClick: "Clique para enviar um arquivo de áudio ou vídeo",
  uploadDrag: "ou arraste e solte",
  selectedFile: "Arquivo selecionado",
  processAudio: "Processar Áudio",
  importProjectDescription:
   "Clique para importar um projeto previamente salvo para continuar a edição sem precisar processar o arquivo novamente!",
  loadProject: "Carregar arquivo",
  acceptedAudioFormats:
   "Formatos aceitos: MP3, WAV, M4A, FLAC, OGG, OPUS, AMR, MP4, MOV, MKV, AVI",
  acceptedProjectFormats: "Formato aceito: .koala",
  invalidProjectFileType:
   "Tipo de arquivo inválido. Apenas arquivos .koala são aceitos.",
  audioSegmentsLoaded: "segmentos de áudio carregados",
  // Loader.tsx
  processing: "Processando áudio...",
  takeAMoment: "Isso pode demorar um pouco.",
  uploadingFile: "Enviando arquivo...",
  uploadingDescription: "Enviando seu arquivo.",
  downloadingVideo: "Baixando vídeo...",
  downloadingDescription: "Baixando áudio do vídeo do YouTube.",
  downloadingFromYoutube: "Extraindo áudio do YouTube",
  identifyingLanguage: "Identificando linguagem",
  identifyingLanguageDescription: "Detectando idioma do áudio.",
  transcribing: "Transcrevendo...",
  transcribingDescription: "Convertendo fala em texto.",
  aligning: "Alinhando...",
  aligningDescription: "Sincronizando texto com timestamps do áudio.",
  diarizing: "Diarizando...",
  diarizingDescription: "Identificando e separando locutores.",
  // ResultsDisplay.tsx
  analysisOf: "Análise de ",
  exportPDF: "Exportar para PDF",

  exportProject: "Salvar Projeto",
  importProject: "Carregar Projeto",
  saving: "Salvando...",
  analyzeAnother: "Analisar Outro Arquivo",
  projectSavedSuccess: "Projeto salvo com sucesso!",
  projectLoadedSuccess: "Projeto carregado com sucesso!",
  exportProjectError: "Erro ao exportar projeto.",
  importProjectError: "Erro ao importar projeto.",
  invalidProjectFormat: "Formato de projeto inválido.",
  transcriptionTime: "Tempo de Transcrição",
  aligningTime: "Tempo de alinhamento",
  diarizationTime: "Tempo de Diarização",
  manageSpeakers: "Gerenciar Locutores",
  exportWarning:
   "É necessário preencher um nome para todos os locutores para habilitar a exportação.",
  exportPDFAlert:
   "Por favor, defina um nome para todos os locutores antes de exportar para PDF.",
  transcriptionSegments: "Segmentos da Transcrição",
  summary: "Resumo",
  fileSavedSuccess: "Arquivo salvo com sucesso!",
  undoDeleteToast: "Segmento excluído.",
  person: "Pessoa",
  // PDF generation
  pdfTitle: "Relatório de Transcrição",
  pdfSourceFile: "Arquivo de Origem",
  pdfGeneratedAt: "Gerado em",
  pdfTranscription: "Transcrição",
  pdfSummary: "Resumo",
  pdfPage: "Página",
  pdfOf: "de",
  // SpeakerManager.tsx
  speakerInputPlaceholder: "Digite o novo nome",
  deleteSpeaker: "Excluir locutor",
  speakerDeletedLabel: "Locutor Excluído",
  addNewSpeaker: "Adicionar Novo Locutor",
  addSegment: "Adicionar Segmento",
  selectSpeaker: "Selecionar Locutor",
  noSpeakersAvailable: "Nenhum locutor disponível",
  // SummaryStats.tsx
  audioDuration: "Duração do Áudio",
  totalWords: "Total de Palavras",
  // TranscriptionCard.tsx
  speakerNameLabel: "Nome do Locutor",
  deleteSegmentLabel: "Excluir segmento",
  transcriptionTextLabel: "Texto da Transcrição",
  segmentDeletedMessage: "Segmento excluído.",
  undoButtonLabel: "Desfazer",
  invalidTimeRange: "O tempo final deve ser maior que o tempo inicial",
  editTime: "Editar tempo",
  save: "Salvar",
  playSegmentAudio: "Reproduzir áudio do segmento",
  stopSegmentAudio: "Parar áudio",
  // ToastNotification.tsx
  close: "Fechar",
  undoButton: "Desfazer",
  // Settings
  settings: "Configurações",
  language: "Idioma da interface",
  ptBr: "Português",
  eng: "Inglês",
  theme: "Tema",
  lightTheme: "Claro",
  darkTheme: "Escuro",
  credits: "Créditos",
  libs:
   "Quero agradecer especialmente às bibliotecas de código aberto que tornaram este aplicativo possível. Em particular:",
  libsAll:
   "Além dessas, também sou grato a todas as outras bibliotecas e desenvolvedores da comunidade open source que contribuíram direta ou indiretamente para este projeto. Sem esse ecossistema incrível, nada disso seria possível!",
  author: "Autor",
  // YouTube
  uploadFile: "Enviar Arquivo",
  youtubeLink: "Link do YouTube",
  youtubeUrlLabel: "URL do YouTube",
  youtubeUrlPlaceholder: "Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  invalidYoutubeUrl: "Por favor, insira uma URL válida do YouTube.",
  processYoutube: "Processar Vídeo do YouTube",
  // Errors
  invalidFileType:
   "Tipo de arquivo não suportado. São permitidos apenas os seguintes formatos de áudio e vídeo: .mp3, .wav, .m4a, .flac, .ogg, .opus, .amr, .mp4, .mov, .mkv, .avi.",
  selectFileFirst: "Por favor, selecione um arquivo primeiro.",
  processingFailed:
   "Falha ao processar o arquivo de áudio. Por favor, tente novamente.",
 },
};
export type Language = keyof typeof translations;
export type Translations = (typeof translations)["en"];
export const getTranslator = (lang: Language): Translations => {
 return translations[lang];
};