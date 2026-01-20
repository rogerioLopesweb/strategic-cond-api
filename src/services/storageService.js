const fs = require('fs');
const path = require('path');

// O caminho deve bater com o "Caminho do Destino" que você colocou no Easypanel
const uploadPath = path.join(__dirname, '../../public/uploads');

// Garante que a pasta existe
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const uploadFoto = async (base64Data, fileName) => {
    try {
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Image, 'base64');
        
        const nomeArquivo = `${Date.now()}-${fileName}.jpg`;
        const localPath = path.join(uploadPath, nomeArquivo);

        fs.writeFileSync(localPath, buffer);

        // Retorna apenas o caminho que será usado na URL
        return `/uploads/${nomeArquivo}`;
    } catch (error) {
        console.error('Erro ao salvar foto na VPS:', error);
        return null;
    }
};

const gerarLinkVisualizacao = async (key) => {
    // Retorna a URL completa usando o domínio da sua API
    // Certifique-se de ter a variável BASE_URL no seu .env do Easypanel
    return `${process.env.BASE_URL}${key}`;
};

module.exports = { uploadFoto, gerarLinkVisualizacao };