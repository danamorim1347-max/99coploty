import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function run() {
  console.log("Iniciando empacotamento...");

  const distDir = path.resolve('./dist');
  const androidDir = path.resolve('./android-project');
  const publicDir = path.resolve('./public');

  // Criar public se não existir
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log("Diretório /public criado.");
  }

  // --- ZIP 1: FRONTEND DIST (Para ApkCreator local) ---
  if (fs.existsSync(distDir)) {
    const zipDist = new AdmZip();
    zipDist.addLocalFolder(distDir);
    
    // Adicionar um README simples explicando como usar o zip no ApkCreator
    const readmeContent = `=== COMO USAR ESTE ZIP NO APKCREATOR ===

Este arquivo ZIP contém o painel interativo e simulador compilado em formato compatível off-line/local.

Para empacotar no ApkCreator:
1. Abra o app ApkCreator no seu celular.
2. Selecione a aba "Geral".
3. Na seção "Configuração", selecione a opção "Local" (em vez de URL).
4. Clique no botão "Gerenciar" sob "Arquivos locais".
5. Faça o upload ou selecione todos os arquivos deste ZIP compilado (o index.html deve estar na raiz do diretório de arquivos locais).
6. Digite o nome do app (ex: "99 Ride Analyzer").
7. Digite o nome do pacote (ex: "com.gigu.clone99").
8. Clique em "GERAR APK"!

Excelente trabalho!`;
    
    zipDist.addFile("README_APK_CREATOR.txt", Buffer.from(readmeContent, "utf8"));
    zipDist.writeZip(path.join(publicDir, 'app-local.zip'));
    if (fs.existsSync(distDir)) {
      zipDist.writeZip(path.join(distDir, 'app-local.zip'));
    }
    console.log("ZIP do frontend criado com sucesso em: /public/app-local.zip e /dist/app-local.zip");
  } else {
    console.warn("Diretório /dist não encontrado! Certifique-se de rodar 'npm run build' primeiro.");
  }

  // --- ZIP 2: CÓDIGO FONTE ANDROID KOTLIN (Completo para Android Studio) ---
  if (fs.existsSync(androidDir)) {
    const zipAndroid = new AdmZip();
    zipAndroid.addLocalFolder(androidDir);

    const readmeKotlin = `=== CÓDIGO FONTE NATIVO KOTLIN (ANDROID STUDIO) ===

Este ZIP contém o projeto Android Nativo completo, escrito em Kotlin, pronto para ser aberto no Android Studio.

Este projeto contém o Serviço de Acessibilidade (AccessibilityService) personalizado para ler as corridas do aplicativo da 99 original de forma totalmente automatizada em tempo real e exibir o balão (Overlay) flutuante com a análise da corrida (R$/km e R$/h).

COMO IMPORTAR E COMPILAR:
1. Extraia este ZIP em uma pasta do seu computador.
2. Abra o Android Studio.
3. Clique em "Open" e selecione a pasta extraída (que contém o build.gradle.kts).
4. Aguarde a sincronização do Gradle terminar.
5. Conecte o seu celular com "Depuração USB" ativa.
6. Clique em "Run" ou gere o APK assinado em "Build > Generate Signed Bundle / APK" para instalar a versão nativa definitiva do supervisor de corridas!`;
    
    zipAndroid.addFile("README_ANDROID_STUDIO.txt", Buffer.from(readmeKotlin, "utf8"));
    zipAndroid.writeZip(path.join(publicDir, 'android-project.zip'));
    if (fs.existsSync(distDir)) {
      zipAndroid.writeZip(path.join(distDir, 'android-project.zip'));
    }
    console.log("ZIP do projeto nativo Android criado com sucesso em: /public/android-project.zip e /dist/android-project.zip");
  } else {
    console.warn("Diretório /android-project não encontrado!");
  }
}

run().catch(err => {
  console.error("Erro ao gerar os ZIPs:", err);
  process.exit(1);
});
