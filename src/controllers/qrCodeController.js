const QRCode = require('qrcode');

const gerarQrCodeEntrega = async (req, res) => {
    try {
        const { id } = req.params; // O UUID da entrega

        if (!id) {
            return res.status(400).json({ error: 'ID da entrega é obrigatório' });
        }

        // Configurações do QR Code
        const options = {
            errorCorrectionLevel: 'H', // Alta correção (bom para ler em telas)
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000', // Cor dos módulos
                light: '#ffffff' // Cor do fundo
            }
        };

        // Gera o QR Code diretamente para o stream de resposta (res)
        res.setHeader('Content-Type', 'image/png');
        await QRCode.toFileStream(res, id, options);

    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        res.status(500).send('Erro ao gerar imagem');
    }
};

module.exports = { gerarQrCodeEntrega };