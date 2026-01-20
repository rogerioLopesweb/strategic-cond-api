const storage = require('../services/storageService');

const testUpload = async (req, res) => {
    const { foto_base64, nome_arquivo } = req.body;

    if (!foto_base64) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nenhuma imagem enviada em Base64' 
        });
    }

    try {
        /**
         * 1. Faz o upload local. 
         * O storageService agora retorna o caminho relativo (ex: /uploads/arquivo.jpg)
         */
        const pathRelativo = await storage.uploadFoto(foto_base64, nome_arquivo || 'teste-vps');
        
        if (pathRelativo) {
            // 2. Gera a URL completa usando o BASE_URL da sua VPS
            const urlCompleta = await storage.gerarLinkVisualizacao(pathRelativo);

            res.json({
                success: true,
                message: 'Upload realizado com sucesso no disco da VPS!',
                detalhes: {
                    arquivo: pathRelativo,
                    url_publica: urlCompleta,
                    info: 'Arquivo armazenado permanentemente no volume da VPS'
                }
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Falha ao gravar arquivo no disco do servidor' 
            });
        }
    } catch (error) {
        console.error('Erro na rota de teste de upload local:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

module.exports = { testUpload };